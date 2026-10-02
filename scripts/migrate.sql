-- ============================================================
--  EarlyPay — Database Schema
--  Schema: earlypay
--  Mirrors the DiscountVault onchain state for fast off-chain
--  querying (invoice lists, tier lookups, settlement history).
-- ============================================================

-- Dedicated schema keeps tables isolated from other dbs on the
-- same Postgres instance.
CREATE SCHEMA IF NOT EXISTS earlypay;

-- ────────────────────────────────────────────────────────────
--  ENUM: invoice lifecycle state
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE earlypay.invoice_state AS ENUM ('OPEN', 'SETTLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
--  TABLE: invoices
--  One row per on-chain invoice (indexed from postInvoice events).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earlypay.invoices (
  -- On-chain identity
  id                BIGINT                    PRIMARY KEY,   -- contract invoiceId (uint256, fits bigint)
  chain_id          INTEGER                   NOT NULL,      -- EVM chain id (5042002 = Arc Testnet)
  contract_address  CHAR(42)                  NOT NULL,      -- vault contract (checksummed 0x…)

  -- Parties
  buyer             CHAR(42)                  NOT NULL,
  supplier          CHAR(42)                  NOT NULL,

  -- Money amounts (stored as NUMERIC to handle full uint256 range)
  face_value        NUMERIC(38,0)             NOT NULL,      -- USDC 6-decimal raw units
  rebate_pool       NUMERIC(38,0)             NOT NULL,      -- collateral locked (max rebate)

  -- State machine
  state             earlypay.invoice_state    NOT NULL DEFAULT 'OPEN',

  -- Settlement fields (populated when state → SETTLED)
  rebate_paid       NUMERIC(38,0),
  settler           CHAR(42),
  settled_at        BIGINT,                                  -- unix timestamp (seconds)

  -- Lifecycle timestamps (unix seconds, from contract)
  expires_at        BIGINT                    NOT NULL,
  posted_at_block   BIGINT,                                  -- block number of postInvoice tx
  posted_at_ts      BIGINT,                                  -- block timestamp (seconds)

  -- Off-chain tracking
  post_tx_hash      CHAR(66),                               -- transaction hash of postInvoice
  settle_tx_hash    CHAR(66),
  expire_tx_hash    CHAR(66),

  synced_at         TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
--  TABLE: invoice_tiers
--  Up to 3 discount tiers per invoice (unpacked from tierPack0/1).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earlypay.invoice_tiers (
  id            BIGSERIAL   PRIMARY KEY,
  invoice_id    BIGINT      NOT NULL REFERENCES earlypay.invoices(id) ON DELETE CASCADE,
  tier_index    SMALLINT    NOT NULL CHECK (tier_index BETWEEN 0 AND 2),  -- 0 = best/first tier
  window_end    BIGINT      NOT NULL,    -- unix timestamp (seconds) — close of this tier window
  discount_bps  SMALLINT    NOT NULL CHECK (discount_bps > 0 AND discount_bps <= 5000),
  UNIQUE (invoice_id, tier_index)
);

-- ────────────────────────────────────────────────────────────
--  TABLE: sync_cursors
--  Tracks the last indexed block per (chain, contract) so the
--  indexer can resume after restart without re-scanning.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earlypay.sync_cursors (
  chain_id          INTEGER   NOT NULL,
  contract_address  CHAR(42)  NOT NULL,
  last_block        BIGINT    NOT NULL DEFAULT 0,
  last_synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chain_id, contract_address)
);

-- ────────────────────────────────────────────────────────────
--  TABLE: transaction_events
--  Raw event log for auditability — every on-chain event that
--  touched an invoice, in insertion order.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earlypay.transaction_events (
  id              BIGSERIAL   PRIMARY KEY,
  chain_id        INTEGER     NOT NULL,
  contract_address CHAR(42)   NOT NULL,
  invoice_id      BIGINT      NOT NULL,  -- may not yet exist in invoices (out-of-order)
  event_name      VARCHAR(64) NOT NULL,  -- 'InvoicePosted' | 'InvoiceSettled' | 'InvoiceExpired'
  tx_hash         CHAR(66)    NOT NULL,
  block_number    BIGINT      NOT NULL,
  block_timestamp BIGINT      NOT NULL,
  log_index       INTEGER     NOT NULL,
  raw_data        JSONB,                 -- full decoded event args for debugging
  processed       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_hash, log_index)
);

-- ────────────────────────────────────────────────────────────
--  INDEXES
-- ────────────────────────────────────────────────────────────

-- Invoice lookups by party address (most common query)
CREATE INDEX IF NOT EXISTS idx_invoices_buyer
  ON earlypay.invoices (buyer);

CREATE INDEX IF NOT EXISTS idx_invoices_supplier
  ON earlypay.invoices (supplier);

-- Invoice lookups by state (filter OPEN invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_state
  ON earlypay.invoices (state);

-- Invoice lookups by chain + contract (for multi-chain expansion)
CREATE INDEX IF NOT EXISTS idx_invoices_chain_contract
  ON earlypay.invoices (chain_id, contract_address);

-- Expiry queries (find invoices past deadline, for expireInvoice bot)
CREATE INDEX IF NOT EXISTS idx_invoices_expires_at
  ON earlypay.invoices (expires_at)
  WHERE state = 'OPEN';

-- Tier lookups by invoice
CREATE INDEX IF NOT EXISTS idx_invoice_tiers_invoice_id
  ON earlypay.invoice_tiers (invoice_id);

-- Event log — unprocessed events (indexer queue)
CREATE INDEX IF NOT EXISTS idx_events_unprocessed
  ON earlypay.transaction_events (chain_id, block_number)
  WHERE processed = FALSE;

-- Event log — by invoice
CREATE INDEX IF NOT EXISTS idx_events_invoice_id
  ON earlypay.transaction_events (invoice_id);

-- ────────────────────────────────────────────────────────────
--  TRIGGER: auto-update updated_at on invoices
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION earlypay.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON earlypay.invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON earlypay.invoices
  FOR EACH ROW EXECUTE FUNCTION earlypay.set_updated_at();

-- ────────────────────────────────────────────────────────────
--  SEED: sync cursor for Arc Testnet DiscountVault
-- ────────────────────────────────────────────────────────────
INSERT INTO earlypay.sync_cursors (chain_id, contract_address, last_block)
VALUES (5042002, '0xf8a283ada5c99831b904d058291895d0e38c546b', 0)
ON CONFLICT (chain_id, contract_address) DO NOTHING;
