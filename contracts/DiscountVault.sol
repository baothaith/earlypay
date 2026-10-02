// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DiscountVault
 * @notice Onchain Dynamic Early Payment Discount vault.
 * Buyers post invoices with time-decaying USDC rebate tiers.
 * Suppliers claim a discount tier by settling before its window closes.
 * The contract holds buyer collateral (the maximum possible rebate) and
 * releases it to the supplier on settlement, returning any unused portion
 * to the buyer. Unsettled invoices can be expired after the deadline,
 * returning the full collateral to the buyer.
 *
 * Money-state machine: OPEN → SETTLED | EXPIRED
 * Trigger: time-elapsed + supplier-initiated payment (NOT human approval).
 */
contract DiscountVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MAX_FACE_VALUE    = 1e12;  // 1,000,000 USDC (6 dec)
    uint16  public constant MAX_DISCOUNT_BPS  = 5000;  // 50 %
    uint16  public constant BPS_DENOMINATOR   = 10_000;
    uint256 public constant MAX_INVOICES_PER_BUYER = 256;

    // ─── Types ────────────────────────────────────────────────────────────────
    enum State { OPEN, SETTLED, EXPIRED }

    struct Tier {
        uint64 windowEnd;   // unix timestamp; tier active while block.timestamp <= windowEnd
        uint16 discountBps; // basis points, e.g. 200 = 2.00 %
    }

    struct Invoice {
        address buyer;
        address supplier;
        uint256 faceValue;   // full invoice amount (USDC 6-decimal)
        uint256 rebatePool;  // max rebate locked by buyer
        Tier[3] tiers;       // up to 3 tiers; zero-windowEnd slots are inactive
        State   state;
        address settler;
        uint256 settledAt;
        uint256 rebatePaid;
        uint64  expiresAt;   // deadline for any settlement
    }

    // ─── Errors ───────────────────────────────────────────────────────────────
    error ZeroAddress();
    error InvalidFaceValue();
    error InvalidExpiresAt();
    error InvalidTierOrder();
    error InvalidDiscountBps();
    error InvalidRebatePool();
    error InvalidSupplier();
    error InvoiceNotFound();
    error InvalidState();
    error InvoiceAlreadyExpired();
    error UnauthorizedSettler();
    error BuyerInvoiceLimitReached();

    // ─── Events ───────────────────────────────────────────────────────────────
    event InvoicePosted(
        uint256 indexed invoiceId,
        address indexed buyer,
        address indexed supplier,
        uint256 faceValue,
        uint256 rebatePool,
        uint64  expiresAt
    );

    event InvoiceSettled(
        uint256 indexed invoiceId,
        address indexed buyer,
        address indexed supplier,
        address settler,
        uint256 supplierPays,
        uint256 rebateAmount,
        uint16  activeTierBps
    );

    event InvoiceExpired(
        uint256 indexed invoiceId,
        address indexed buyer,
        uint256 rebatePool
    );

    // ─── Storage ──────────────────────────────────────────────────────────────
    address public immutable usdc;

    /// @dev Private to avoid exposing the Tier[3] array through the auto-getter.
    mapping(uint256 => Invoice)   private invoices;
    mapping(address => uint256[]) private buyerInvoices;
    mapping(address => uint256[]) private supplierInvoices;

    uint256 private nextInvoiceId;

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _usdc, address _owner) Ownable(_owner) {
        if (_usdc == address(0) || _owner == address(0)) revert ZeroAddress();
        usdc = _usdc;
        nextInvoiceId = 1;
    }

    // ─── External: Buyer ──────────────────────────────────────────────────────

    /**
     * @notice Post a new invoice with up to three time-decaying discount tiers.
     * @dev Tiers are encoded as two packed uint256 values to avoid tuple[3] ABI
     *      and stack-depth issues.
     *
     *  tierPack0 encodes tiers 0 and 1:
     *    bits 255-192 : tier-0 windowEnd  (uint64)
     *    bits 191-176 : tier-0 discountBps (uint16)
     *    bits 127-64  : tier-1 windowEnd  (uint64)
     *    bits  63-48  : tier-1 discountBps (uint16)
     *    (bits 175-128 and 47-0 are ignored/zero)
     *
     *  tierPack1 encodes tier 2:
     *    bits 255-192 : tier-2 windowEnd  (uint64)
     *    bits 191-176 : tier-2 discountBps (uint16)
     *
     *  Set windowEnd=0 and discountBps=0 for unused slots (must trail active slots).
     *
     * @param faceValue  Full invoice amount in USDC (6 decimals).
     * @param supplier   Address authorised to settle this invoice.
     * @param tierPack0  Packed tier-0 + tier-1 data (see above).
     * @param tierPack1  Packed tier-2 data (see above).
     * @param expiresAt  Hard deadline; after this, anyone can expire the invoice.
     * @return invoiceId Sequential invoice identifier.
     */
    function postInvoice(
        uint256 faceValue,
        address supplier,
        uint256 tierPack0,
        uint256 tierPack1,
        uint64  expiresAt
    ) external whenNotPaused returns (uint256 invoiceId) {
        if (supplier == address(0))                       revert InvalidSupplier();
        if (faceValue == 0 || faceValue > MAX_FACE_VALUE) revert InvalidFaceValue();
        if (expiresAt <= block.timestamp)                 revert InvalidExpiresAt();
        if (buyerInvoices[msg.sender].length >= MAX_INVOICES_PER_BUYER) {
            revert BuyerInvoiceLimitReached();
        }

        // Unpack tier data.
        Tier[3] memory tiers;
        tiers[0] = Tier(uint64(tierPack0 >> 192),         uint16(tierPack0 >> 176));
        tiers[1] = Tier(uint64(tierPack0 >> 64),          uint16(tierPack0 >> 48));
        tiers[2] = Tier(uint64(tierPack1 >> 192),         uint16(tierPack1 >> 176));

        _validateTiers(tiers);

        // Rebate pool = max possible rebate = tier-0 discount applied to face value.
        uint256 rebatePool = (faceValue * uint256(tiers[0].discountBps)) / BPS_DENOMINATOR;
        if (rebatePool == 0 || rebatePool > faceValue) revert InvalidRebatePool();

        invoiceId = nextInvoiceId++;

        Invoice storage inv = invoices[invoiceId];
        inv.buyer      = msg.sender;
        inv.supplier   = supplier;
        inv.faceValue  = faceValue;
        inv.rebatePool = rebatePool;
        inv.state      = State.OPEN;
        inv.expiresAt  = expiresAt;
        for (uint256 i = 0; i < 3; ++i) {
            inv.tiers[i] = tiers[i];
        }

        buyerInvoices[msg.sender].push(invoiceId);
        supplierInvoices[supplier].push(invoiceId);

        // Pull rebate collateral from buyer.
        IERC20(usdc).safeTransferFrom(msg.sender, address(this), rebatePool);

        emit InvoicePosted(invoiceId, msg.sender, supplier, faceValue, rebatePool, expiresAt);
    }

    // ─── External: Supplier ───────────────────────────────────────────────────

    /**
     * @notice Settle an invoice.
     *         The supplier pays `faceValue - rebate` to the buyer and receives the
     *         rebate from the locked collateral.  The active tier is the first tier
     *         whose windowEnd is >= block.timestamp.  If all windows have closed but
     *         expiresAt has not passed, rebateBps = 0 (full face value owed, no rebate).
     */
    function settleInvoice(uint256 invoiceId) external nonReentrant whenNotPaused {
        Invoice storage inv = invoices[invoiceId];
        if (inv.buyer == address(0))       revert InvoiceNotFound();
        if (inv.state != State.OPEN)        revert InvalidState();
        if (block.timestamp > inv.expiresAt) revert InvoiceAlreadyExpired();
        if (msg.sender != inv.supplier)     revert UnauthorizedSettler();

        // Find the highest-discount tier still within its window.
        uint16 activeTierBps;
        for (uint8 i = 0; i < 3; ++i) {
            Tier memory t = inv.tiers[i];
            if (t.discountBps > 0 && block.timestamp <= t.windowEnd) {
                activeTierBps = t.discountBps;
                break;
            }
        }

        uint256 rebateAmount = (inv.faceValue * uint256(activeTierBps)) / BPS_DENOMINATOR;
        if (rebateAmount > inv.rebatePool) rebateAmount = inv.rebatePool;

        uint256 supplierPays = inv.faceValue - rebateAmount;

        // Supplier pays buyer the discounted amount.
        IERC20(usdc).safeTransferFrom(msg.sender, inv.buyer, supplierPays);

        // Release rebate from vault to supplier.
        if (rebateAmount > 0) {
            IERC20(usdc).safeTransfer(msg.sender, rebateAmount);
        }

        // Return excess collateral to buyer.
        uint256 excess = inv.rebatePool - rebateAmount;
        if (excess > 0) {
            IERC20(usdc).safeTransfer(inv.buyer, excess);
        }

        inv.state      = State.SETTLED;
        inv.settler    = msg.sender;
        inv.settledAt  = block.timestamp;
        inv.rebatePaid = rebateAmount;

        emit InvoiceSettled(
            invoiceId,
            inv.buyer,
            msg.sender,
            msg.sender,
            supplierPays,
            rebateAmount,
            activeTierBps
        );
    }

    // ─── External: Anyone ─────────────────────────────────────────────────────

    /**
     * @notice Expire an overdue invoice, returning collateral to the buyer.
     *         Can be called by anyone once block.timestamp > expiresAt.
     */
    function expireInvoice(uint256 invoiceId) external nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        if (inv.buyer == address(0))          revert InvoiceNotFound();
        if (inv.state != State.OPEN)           revert InvalidState();
        if (block.timestamp <= inv.expiresAt)  revert InvoiceAlreadyExpired();

        if (inv.rebatePool > 0) {
            IERC20(usdc).safeTransfer(inv.buyer, inv.rebatePool);
        }
        inv.state = State.EXPIRED;

        emit InvoiceExpired(invoiceId, inv.buyer, inv.rebatePool);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @notice Return the currently-active discount tier for an invoice.
     * @return discountBps Active basis points; 0 if no tier is active.
     * @return windowEnd   Active tier's window close timestamp; 0 if none.
     * @return tierIndex   0-based index; 255 = no active tier.
     */
    function getCurrentTier(uint256 invoiceId)
        external view
        returns (uint16 discountBps, uint64 windowEnd, uint8 tierIndex)
    {
        Invoice storage inv = invoices[invoiceId];
        if (inv.buyer == address(0)) return (0, 0, 255);

        for (uint8 i = 0; i < 3; ++i) {
            Tier memory t = inv.tiers[i];
            if (t.discountBps > 0 && block.timestamp <= t.windowEnd) {
                return (t.discountBps, t.windowEnd, i);
            }
        }
        return (0, 0, 255);
    }

    /**
     * @notice Return the scalar fields of an invoice (excludes the tier array).
     * @return buyer      The buyer address.
     * @return supplier   The supplier address.
     * @return faceValue  Full invoice face value (USDC 6 decimals).
     * @return rebatePool Locked collateral amount.
     * @return state      0=OPEN, 1=SETTLED, 2=EXPIRED.
     * @return settler    Address that settled (zero if unsettled).
     * @return settledAt  Timestamp of settlement (0 if unsettled).
     * @return rebatePaid Actual rebate released to settler.
     * @return expiresAt  Invoice expiry timestamp.
     */
    function getInvoiceFields(uint256 invoiceId)
        external view
        returns (
            address buyer,
            address supplier,
            uint256 faceValue,
            uint256 rebatePool,
            uint8   state,
            address settler,
            uint256 settledAt,
            uint256 rebatePaid,
            uint64  expiresAt
        )
    {
        Invoice storage inv = invoices[invoiceId];
        return (
            inv.buyer,
            inv.supplier,
            inv.faceValue,
            inv.rebatePool,
            uint8(inv.state),
            inv.settler,
            inv.settledAt,
            inv.rebatePaid,
            inv.expiresAt
        );
    }

    /**
     * @notice Return all three tier windowEnd timestamps for an invoice.
     */
    function getInvoiceTierWindows(uint256 invoiceId)
        external view
        returns (uint64 w0, uint64 w1, uint64 w2)
    {
        Invoice storage inv = invoices[invoiceId];
        return (inv.tiers[0].windowEnd, inv.tiers[1].windowEnd, inv.tiers[2].windowEnd);
    }

    /**
     * @notice Return all three tier discountBps values for an invoice.
     */
    function getInvoiceTierDiscounts(uint256 invoiceId)
        external view
        returns (uint16 d0, uint16 d1, uint16 d2)
    {
        Invoice storage inv = invoices[invoiceId];
        return (inv.tiers[0].discountBps, inv.tiers[1].discountBps, inv.tiers[2].discountBps);
    }

    /// @notice Return all invoice IDs posted by a buyer.
    function getInvoicesByBuyer(address buyer)
        external view returns (uint256[] memory)
    {
        return buyerInvoices[buyer];
    }

    /// @notice Return all invoice IDs assigned to a supplier.
    function getInvoicesBySupplier(address supplier)
        external view returns (uint256[] memory)
    {
        return supplierInvoices[supplier];
    }

    /// @notice Total invoices ever created (includes all states).
    function totalInvoices() external view returns (uint256) {
        return nextInvoiceId - 1;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /**
     * @dev Validate tier ordering rules:
     *   1. discountBps <= MAX_DISCOUNT_BPS for all tiers.
     *   2. Active tiers (windowEnd > 0) must have strictly increasing windowEnd.
     *   3. Active tiers must have strictly positive and non-increasing discountBps (decay).
     *   4. Zero-windowEnd slots may only trail active slots (discountBps must also be 0).
     *   5. At least one active tier must be present.
     */
    function _validateTiers(Tier[3] memory tiers) internal pure {
        uint64 lastWindowEnd;
        uint16 lastDiscountBps = type(uint16).max; // sentinel
        bool   atLeastOneTier;

        for (uint256 i = 0; i < 3; ++i) {
            Tier memory t = tiers[i];

            if (t.discountBps > MAX_DISCOUNT_BPS) revert InvalidDiscountBps();

            if (t.windowEnd == 0) {
                // Inactive slot — discountBps must also be 0.
                if (t.discountBps != 0) revert InvalidTierOrder();
                continue;
            }

            // windowEnd must be strictly increasing.
            if (t.windowEnd <= lastWindowEnd) revert InvalidTierOrder();

            // discountBps must be > 0 and non-increasing (time-decay).
            if (t.discountBps == 0)               revert InvalidDiscountBps();
            if (t.discountBps > lastDiscountBps)  revert InvalidTierOrder();

            lastWindowEnd   = t.windowEnd;
            lastDiscountBps = t.discountBps;
            atLeastOneTier  = true;
        }

        if (!atLeastOneTier) revert InvalidTierOrder();
    }
}
