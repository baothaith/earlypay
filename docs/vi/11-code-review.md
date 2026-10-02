# Quy Trình Code Review

## Tổng Quan

Mọi thay đổi vào `main` phải qua Pull Request và được review. Điều này áp dụng cho cả tính năng, bugfix, và thay đổi tài liệu.

---

## Checklist Tác Giả (Trước Khi Mở PR)

### Bắt Buộc

- [ ] `bun run check` pass với 0 errors, 0 warnings
- [ ] `bunx vite build` thành công
- [ ] Không có secrets/credentials trong code hoặc commit history
- [ ] Không có `.env` trong staged files
- [ ] Conventional commit format
- [ ] PR description có: What, Why, How to test

### Frontend

- [ ] Tính năng hoạt động ở cả Dark Mode và Light Mode
- [ ] Responsive trên mobile (375px), tablet (768px), desktop (1280px)
- [ ] Không có hard-coded màu sắc — dùng CSS tokens
- [ ] Loading states được xử lý (không freeze UI)
- [ ] Error states được hiển thị rõ ràng
- [ ] Transaction flow đúng: approve → action → receipt → update
- [ ] Không fake balance hay blockchain data

### Contract (khi có thay đổi Solidity)

- [ ] `forge build` clean
- [ ] `forge test` pass (khi có tests)
- [ ] Checks-Effects-Interactions pattern
- [ ] Không trực tiếp `.transfer()` hay `.call()` mà không check return value
- [ ] Custom errors thay vì revert strings
- [ ] Không hardcode địa chỉ hay decimals
- [ ] Reviewed for reentrancy risks
- [ ] Events emitted cho mọi state change quan trọng

### Database (khi có thay đổi schema)

- [ ] Migration idempotent (IF NOT EXISTS)
- [ ] Indexes cho mọi column thường xuyên query
- [ ] `bun run db:migrate` chạy thành công
- [ ] `bun run db:verify` confirm schema đúng

---

## Checklist Reviewer

### Code Quality

- [ ] Logic nghiệp vụ đúng và đầy đủ
- [ ] Không có code path nào bỏ sót edge case
- [ ] Types đầy đủ, không có `any` không cần thiết
- [ ] Không có duplicate code có thể extract
- [ ] Performance: không có re-render không cần thiết, không có N+1 queries

### Security

- [ ] Không có secrets trong code
- [ ] User input được sanitize/validate
- [ ] Authorization check ở đúng chỗ
- [ ] Contract: không có re-entrancy vector mới
- [ ] Contract: mọi external call có checks trước interactions

### UX/UI

- [ ] Consistent với design system
- [ ] Không có layout shift hay overflow
- [ ] Accessible (aria-labels, focus states)
- [ ] Không phá vỡ tính năng hiện có

### Documentation

- [ ] Code tự giải thích hoặc có comment cho logic phức tạp
- [ ] PR description đầy đủ
- [ ] Nếu thêm tính năng mới, có cập nhật docs không?

---

## SLA Review (TBD)

| Loại PR | SLA |
|---|---|
| Hotfix security | 4 giờ |
| Bug fix | 24 giờ |
| Tính năng mới | 48 giờ |
| Refactoring | 72 giờ |
| Tài liệu | 24 giờ |

---

## Quy Tắc Review

1. **Review code, không phải người viết** — phản hồi mang tính xây dựng
2. **Đề xuất cụ thể** — "Cân nhắc dùng X vì Y" thay vì "Cái này sai"
3. **Phân biệt blocking vs non-blocking**:
   - `[blocking]` — phải fix trước merge
   - `[nit]` — nhỏ, có thể fix sau
   - `[question]` — clarification, không nhất thiết phải thay đổi
4. **Approve có điều kiện**: nếu chỉ có nits, approve với note
5. **Request changes**: chỉ khi có blocking issues

---

## Quy Tắc Merge

- **Squash merge** ưu tiên cho feature branches (giữ history sạch)
- **Rebase merge** cho hotfixes nhỏ
- **Không force push** lên `main`
- **Không self-merge** trừ khi là sole contributor (TBD khi có team)
- Delete source branch sau khi merge

---

## Contract Audit Riêng

Khi thay đổi `contracts/DiscountVault.sol` hoặc deploy contract mới:

1. Chạy `forge build` và `forge test`
2. Yêu cầu review bổ sung từ ít nhất một người có kinh nghiệm Solidity
3. Nếu thay đổi logic tài chính: chạy audit tool (TBD: Slither, Mythril)
4. Nếu deploy lên mainnet: yêu cầu audit độc lập bên ngoài
5. Cập nhật `AGENTS.md` với địa chỉ contract mới sau khi deploy
