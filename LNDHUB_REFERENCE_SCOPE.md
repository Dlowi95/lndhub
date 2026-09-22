# lndhub — Phạm vi đầy đủ bàn giao Sol

Ngày 2026-09-20. Chỉ cập nhật tài liệu, chưa sửa app/DB. Tài liệu này ưu tiên về phạm vi so với hai plan cũ; yêu cầu bảo mật cũ giữ nguyên.

## Xác minh

Nguồn: https://www.tadhub.store/ ; https://www.tadhub.store/api/products ; bundle https://www.tadhub.store/_next/static/chunks/app/page-ec09a54e58f10e4d.js ; ảnh chủ shop gửi.

API trả 47 gói. Logic ev gom group.id thành một thẻ, bỏ biến thể tắt. Đối chiếu cho 36 thẻ, khớp ảnh. Số này suy từ API/logic frontend, chưa test browser tương tác. Cần model danh mục → thẻ → SKU, không tạo chỉ 36 SKU độc lập. Snapshot có thể thay đổi.

## Danh mục theo thứ tự

| Danh mục | Thẻ | SKU |
|---|---:|---:|
| Tất cả | 36 | 47 |
| ChatGPT | 4 | 11 |
| Gemini | 2 | 2 |
| Claude | 5 | 5 |
| Grok | 3 | 4 |
| YouTube | 1 | 1 |
| Netflix | 1 | 1 |
| VPN | 2 | 2 |
| Spotify | 1 | 1 |
| CapCut | 1 | 2 |
| Canva | 1 | 3 |
| Adobe | 6 | 6 |
| Office | 3 | 3 |
| JetBrains | 1 | 1 |
| iLovePDF | 1 | 1 |
| Leonardo AI | 1 | 1 |
| Autodesk | 1 | 1 |
| Duolingo | 1 | 1 |
| Khác | 1 | 1 |

Tất cả là bộ lọc. Leonardo frontend phân theo tên dù API categoryName là Khác. lndhub dùng categoryId tường minh. Counts theo thẻ public, không hardcode 36 hoặc 4 nổi bật; draft/ẩn không tính, hết hàng có thể hiện nhưng không mua.

## Đối chiếu 36 thẻ và ID nguồn

Mỗi dòng là một thẻ. Nhiều ID là nhiều lựa chọn SKU. ID chỉ để truy vết snapshot, không dùng làm primary key lndhub. Nhãn rút gọn chưa phải nội dung quảng cáo được duyệt.

| # | Thẻ / lựa chọn | ID nguồn |
|---|---|---|
| 1 | ChatGPT cá nhân: Free 250 credits; Free Codex JSON; Plus không BH; Free trial Momo; Plus BH full; Free 1000 credits; Pro 5x | 3,70,2,4,6,50,63 |
| 2 | ChatGPT dùng chung 5 ngày | 22 |
| 3 | ChatGPT K12 đến 2028; K12 JSON | 31,41 |
| 4 | ChatGPT Business 1 tháng | 26 |
| 5 | Gemini Pro 18 tháng email khách | 10 |
| 6 | Gemini Pro 1 năm tài khoản | 9 |
| 7 | Claude Team Standard 1 tháng | 44 |
| 8 | Claude Pro 1 tháng chính chủ | 18 |
| 9 | Claude Team 1 tháng Premium | 45 |
| 10 | Claude Max x20 chính chủ | 48 |
| 11 | Claude Max x20 tài khoản | 49 |
| 12 | Grok Super 7–10 ngày; 1 tháng | 40,19 |
| 13 | Grok Free | 62 |
| 14 | Grok Free JSON + account | 64 |
| 15 | YouTube Premium 1 tháng | 7 |
| 16 | Netflix Premium 4K 1 tháng | 25 |
| 17 | NordVPN 3 tháng gift | 28 |
| 18 | NordVPN 1 tháng tài khoản | 11 |
| 19 | Spotify Premium 3 tháng | 8 |
| 20 | CapCut Pro 5–7 ngày; 30 ngày | 35,36 |
| 21 | Canva Pro 30 ngày; Edu 2 năm; Edu Team 1 năm | 37,38,39 |
| 22 | Adobe Express Premium 12 tháng | 20 |
| 23 | Adobe Creative Cloud 1 tháng | 24 |
| 24 | Adobe Full App 2 tháng | 29 |
| 25 | Adobe CC Pro 1 tháng | 32 |
| 26 | Adobe Creative Cloud 3 tháng | 33 |
| 27 | Adobe Creative Cloud trial 14 ngày | 46 |
| 28 | Microsoft 365 cá nhân 1 năm | 21 |
| 29 | Office 2024 Pro Plus | 51 |
| 30 | Office 365 gói 6 năm | 34 |
| 31 | JetBrains Edu Pack 12 tháng | 71 |
| 32 | iLovePDF Premium 1 năm | 72 |
| 33 | Leonardo AI 8.500 credits 1 tháng | 52 |
| 34 | Autodesk 1 năm | 73 |
| 35 | Duolingo Super 12 tháng | 74 |
| 36 | Windows 10/11 Pro 1 PC (Khác) | 47 |

Nhóm ChatGPT Plus của reference chứa Free/Pro, vì vậy đặt nhãn nhóm rõ nghĩa trên lndhub, không sao chép lỗi gây nhầm. Có đủ cấu trúc fixture không có nghĩa được publish tự động các gói chưa duyệt.

## UI/admin

- Tên chính thức lndhub, L thường đầu; đồng nhất header/hero/metadata/footer/modal/admin. Không tự đổi folder/package/DB/domain.
- Hero desktop hai cột, mobile xếp dọc; nền navy/cyan/tím, glass, chữ đậm theo ảnh; giới thiệu/trạng thái thật/CTA/liên hệ trái, artwork lndhub phải.
- Header sản phẩm/tra cứu/bảo hành; VI/EN, blog, affiliate, giveaway là backlog parity riêng, chưa hoạt động thì ẩn hoặc báo chưa khả dụng.
- Thanh category icon/nhãn/count một hàng cuộn ngang, hai mũi tên, touch/keyboard, không che tab đầu/cuối. Grid 3/2/1 cột.
- Modal chọn SKU trước, cập nhật giá/nội dung/tồn; accordion thông tin/kích hoạt/bảo hành, coupon, quantity presets/nhập tay, contact/note, sticky tổng/CTA; focus trap/return, Escape, footer không che nội dung.
- Admin CRUD category/card/SKU, đổi giá VND nguyên/tier từng SKU, nội dung/policy/icon/thứ tự/featured/trạng thái/default SKU và preview. Không tự đồng bộ giá TAD.
- Server quote không tin giá client; giá mới không đổi snapshot đơn cũ. Tồn/cấp phát theo SKU, nguyên tử/idempotent; paid khác fulfilled. Admin auth cả read/write, không fake order/key/success.
- Chỉ dùng artwork/liên hệ/thanh toán riêng. Quyền lợi reference chưa xác minh: chủ shop duyệt nguồn hàng/quyền bán/giá/giao hàng/bảo hành trước publish. Không yêu cầu khách chuyển session/cookie/OAuth token/2FA bí mật.
- Payment chưa chốt: không chọn provider/ngân hàng/ví, không QR/paid giả, không bật thu tiền. Không seed/migrate DB thật khi chưa duyệt.

## Thứ tự task

1. R00 = S00 + rà S01: baseline/auth/mock/seed trước khi chạy backend với env thật.
2. R01 = S02 mở rộng: UI fixture đủ 18 category + Tất cả, 36 card/47 SKU, chưa payment. Gemini chỉ ưu tiên test.
3. R02 = S03: schema/API/counts, seed draft idempotent, migration có diff/backup/rollback chờ duyệt.
4. R03 = S01+S04: admin CMS có auth, giá/tier/nội dung, lỗi lưu phải báo lỗi thật.
5. R04 = S05/S06/S08 phần chưa payment: nối data/quote/lookup/policy, loading/error/empty/out-of-stock, bảo vệ PII/secret, không fallback fake.
6. R05 = S07/payment sau khi bàn và chốt với chủ shop.
7. R06 = S09 mở rộng: VI/EN/blog/affiliate/giveaway/hỗ trợ đơn, mỗi phần task riêng.

QA: 360/390/768/1280/1920px; cuộn tới Khác; counts thẻ khác SKU; đổi SKU; ranh giới tier; quantity âm/lẻ/quá giới hạn; sửa giá client; giá đơn cũ; draft không lộ; admin chưa auth bị chặn. Không bỏ security gate để chạy theo UI.

Prompt Sol: Đọc ba plan và quy tắc dự án. Làm R00 trước, báo cáo; chỉ làm R01 khi được giao. Không tự làm toàn backlog/payment/seed DB thật. Báo file đổi/diff/test/phần chưa đạt và dừng trước task tiếp theo.

### Trạng thái triển khai 2026-09-20

R01 đã có storefront preview và production build pass: đủ 36 thẻ/47 SKU, category rail, search, card responsive, modal biến thể/accordion/số lượng, CTA payment khóa và trạng thái lookup/contact chưa cấu hình. Đã kiểm tra trực quan headless tại 1440px và 500px. Chưa đánh dấu nghiệm thu hoàn toàn cho tới khi QA tương tác keyboard/modal và các mốc 320/375/768/zoom 200% hoàn tất. R00 và R02–R06 chưa triển khai trong lượt này.

Cập nhật icon: category rail, product card và modal dùng chung bộ logo thương hiệu tương ứng với reference TADHub; icon điều khiển giữ Lucide nhất quán. Production build đã pass sau thay đổi.
