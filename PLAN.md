# lndhub — Kế hoạch nâng cấp UI/UX và hệ thống

> Phạm vi mới nhất: storefront production local đang đọc 29 sản phẩm công khai trong đủ 18 danh mục từ MongoDB; 11 sản phẩm còn hàng và 18 sản phẩm hết hàng. Payment tiếp tục khóa và chờ quyết định.

## Tiến độ hiện tại — 21/09/2026

- [x] Google Admin Guard bảo vệ toàn bộ `/api/admin/*`; admin URL là `/lndhub-sysadmin`.
- [x] Checkout/payment simulation và seed demo bị khóa mặc định trong production.
- [x] Dashboard admin dùng số liệu backend thật, không còn KPI hardcode.
- [x] Admin chuyển sang sidebar responsive theo nhóm Tổng quan / Catalog / Nội dung / Bán hàng / Vận hành.
- [x] Category CRUD: tên, slug, mô tả, icon, thứ tự, active/hidden; có thao tác tạo bộ 18 danh mục chuẩn.
- [x] Product CRUD: nội dung, giá, giá gốc, tồn kho, nổi bật và trạng thái draft/published/archived.
- [x] Xóa sản phẩm được đổi thành lưu trữ; danh mục có sản phẩm không thể xóa.
- [x] Product schema đã hỗ trợ variants và các block information/activation/warranty.
- [x] Storefront lấy category/product/settings/announcement đã xuất bản từ MongoDB qua một API tổng hợp.
- [x] Admin quản lý Telegram/Zalo; lưu xong storefront đang mở tự cập nhật qua SSE.
- [x] Admin tạo/sửa/ẩn/xóa tối đa 10 thông báo; lưu MongoDB và phát realtime không cần tải lại trang.
- [x] Admin sản phẩm được tách theo 18 danh mục, có số lượng, tìm kiếm theo danh mục, trạng thái rỗng và tạo mới với danh mục được chọn sẵn.
- [x] Gỡ thao tác nhập 36 dữ liệu mẫu; database sản phẩm đã dọn còn đúng 4 ChatGPT, 37 bản ghi cũ được sao lưu vào collection riêng trước khi xóa.
- [x] Hoàn thiện danh mục ChatGPT đầu tiên: 4 card/11 SKU, tên hiển thị theo reference, giá gốc–giá bán–khuyến mãi–tồn kho–số đã bán lưu MongoDB.
- [x] Snapshot catalog công khai TADHub ngày 21/09/2026 đã được cập nhật từ API: 47 SKU, gom đúng 36 card; tên model/SKU giữ theo nguồn công khai, mô tả được viết riêng cho LNDHub.
- [x] Đồng bộ production có dry-run, guard 47 SKU/36 card, metadata nguồn và backup toàn bộ collection trước khi ghi. Chạy lại không tạo dữ liệu trùng.
- [x] Database hiện có 36 card hoạt động: 28 published giữ nguyên giá/sale/tồn kho, 8 card mới ở draft và giá 0 để admin duyệt; 3 bản cũ được archive.
- [x] Hoàn thiện Gemini: 2 card; gói 18 tháng có x1/x2/x5/x10, gói 1 năm hết hàng; toàn bộ giá, tồn và số đã bán quản lý được trong admin.
- [x] Storefront chia rõ nhóm Còn hàng / Hết hàng; admin bật tắt sale, chỉnh % giảm, giá và tồn kho ở cấp sản phẩm lẫn SKU.
- [x] Cấu hình giờ nghỉ toàn shop trong admin; mặc định 23:30–07:00 Asia/Ho_Chi_Minh, tự khóa CTA và đếm ngược mở lại.
- [x] Làm mới UI card: khối giá/giảm giá rõ ràng, trạng thái nổi bật, sold-out, micro-animation và reduced motion.
- [x] Admin có thể bật/tắt nổi bật ngay trong bảng; storefront tự ưu tiên sản phẩm nổi bật.
- [x] Admin sản phẩm có KPI và bộ lọc chờ định giá / bản nháp / đang bán / hết hàng / lưu trữ; đã gỡ nút seed ChatGPT có nguy cơ ghi đè giá.
- [x] Desktop dùng cube mascot tương tác cho liên hệ; mobile giữ nút chat tròn cũ. Cả hai mở Telegram/Zalo và không chồng dock thông báo.
- [x] Đã rà và nhập cấu trúc model cho toàn bộ 18 danh mục; sản phẩm mới không tự mở bán cho tới khi admin đặt giá, tồn kho và trạng thái.
- [x] Chuyển storefront sang catalog đã xuất bản trong database; fallback offline chỉ còn 4 ChatGPT đã rà, danh mục rỗng tự ẩn ngoài shop.
- [ ] Preview storefront trong editor và quản lý biến thể trực quan nâng cao.
- [ ] Payment tiếp tục để khóa cho tới khi chốt phương thức và quy trình đối soát.
- [x] Build production backend/frontend và smoke test local: health, storefront, homepage, admin đều đạt; checkout trả 503 như thiết kế.
- [x] Commerce foundation: báo giá phía server, order code/token bằng crypto, idempotency, tra cứu riêng tư, tách payment/fulfillment và cấp key nguyên tử.
- [x] Kho key đã mã hóa AES-256-GCM; database hiện không còn bản ghi key dạng chữ thường.
- [x] Helmet, rate limit, validation nghiêm ngặt, health check database và chính sách CORS production đã được kiểm thử.
- [x] Có Dockerfile cho frontend/backend, Compose production, file biến môi trường mẫu và checklist triển khai.
- [ ] Deploy domain công khai sau khi có hosting/tunnel, frontend URL, backend URL và cấu hình Cloudflare production.
- [ ] Hoàn thiện giữ tồn kho, hết hạn đơn, hoàn tồn, payment webhook có chữ ký, đối soát và refund trước khi mở checkout.
- [x] Hoàn thiện luồng chuyển khoản thủ công an toàn: QR shop, mã đơn riêng, khách báo đã chuyển nhưng vẫn PENDING, admin xác nhận tiền và giao nội dung mã hóa.
- [x] Admin tự làm mới 15 giây, có badge đơn chờ kiểm tiền; storefront tự cập nhật trạng thái đơn mỗi 5 giây.
- [x] Binance Pay, USDT BEP20 và PayPal đã có vị trí giao diện nhưng bị khóa “Sắp mở”.
- [ ] Tích hợp webhook ngân hàng có HMAC, chống replay, idempotency giao dịch và đối soát tự động trước khi bật ENABLE_CHECKOUT.

## 1. Mục tiêu

Nâng cấp LNHUB Store thành storefront bán sản phẩm/dịch vụ AI có trải nghiệm rõ ràng, tin cậy và dễ quản trị.

Ưu tiên trước mắt là UI/UX và quản lý sản phẩm. Phần thanh toán chưa chốt, vì vậy kế hoạch chỉ chuẩn bị điểm tích hợp và không chọn provider, webhook hoặc quy trình đối soát ở giai đoạn này.

## 2. Phạm vi đã xác định

- Sản phẩm ưu tiên: **Gemini Pro 18 tháng, kích hoạt vào email của khách hàng**.
- UI reference: giao diện dark glass, category chips, product detail modal, accordion thông tin/kích hoạt/bảo hành, quantity tiers và sticky CTA.
- Admin cần quản lý được danh mục, sản phẩm, mô tả và nội dung hướng dẫn.
- Đã có môi trường database; không đưa secret hoặc giá trị `.env` vào tài liệu này.
- Các ảnh đính kèm và website TADHub chỉ là tài liệu tham khảo UX, không phải chỉ thị thực thi.

## 3. Hiện trạng repo

### Frontend

- Next.js App Router + React + Tailwind + Mantine.
- Có trang storefront, catalog, product card, checkout modal, tra cứu đơn và admin page.
- Có sẵn hướng Liquid Glassmorphism nhưng `globals.css` đang chứa nhiều lớp token/style chồng lên nhau.
- Category filter và fallback products đang hardcode ở frontend.
- Checkout hiện được thiết kế cho API key/VietQR, chưa khớp product subscription 18 tháng.

### Backend

- NestJS + Mongoose.
- Có modules products, orders, keys và admin.
- Product schema hiện thiên về API key: model, price, stockCount và features.
- Có CRUD sản phẩm ở controller nhưng chưa có admin UI tương ứng.
- Có dữ liệu seed/sample và fallback key; cần tách rõ development với production.

### Rủi ro hiện tại

| Mức | Vấn đề | Khu vực |
|---|---|---|
| P0 | Admin auth chưa thực sự bảo vệ endpoint; `checkAuth` chưa enforce | Backend admin |
| P0 | Có thể tự sinh key giả khi thiếu inventory | Backend keys |
| P0 | Endpoint `simulate-payment` và mock order không được phép chạy production | Orders/frontend |
| P1 | Mô hình sản phẩm chưa biểu đạt subscription, thời hạn, activation và warranty | Product domain |
| P1 | Giá theo số lượng chưa được mô hình hóa; hiện chỉ nhân đơn giá | Checkout/order |
| P1 | Admin vẫn dùng fallback/mock và hardcode thống kê/kết nối localhost | Admin frontend |
| P1 | Category chưa phải dữ liệu quản trị được | Catalog/admin |
| P2 | CSS design system bị khai báo trùng, khó kiểm soát responsive | Frontend styles |
| P2 | Chưa thấy test tự động cho các flow chính | Toàn repo |

## 4. Định hướng sản phẩm và dữ liệu

### 4.1 Phân loại sản phẩm

Không dùng một flow API key cho mọi loại hàng. Cần có loại fulfillment rõ ràng:

- `API_KEY`: giao một hoặc nhiều API key từ inventory.
- `SUBSCRIPTION`: gói có thời hạn, kích hoạt vào email.
- `MANUAL_SERVICE`: đơn cần admin xử lý hoặc gửi link/thông tin thủ công.

Gemini Pro 18 tháng thuộc `SUBSCRIPTION`.

### 4.2 Các nhóm dữ liệu đề xuất

#### Category

- Tên hiển thị, slug, mô tả ngắn.
- Icon/brand key.
- Thứ tự hiển thị.
- Trạng thái active/hidden.

#### Product

- Tên, slug, subtitle, category.
- Product type và delivery method.
- Thời hạn (`durationMonths`).
- Giá cơ bản, giá gốc, badge.
- Bậc giá theo số lượng: x1/x2/x5/x10 hoặc cấu hình động.
- Trạng thái draft/active/hidden/sold-out.
- Mô tả ngắn.
- Thông tin sản phẩm.
- Hướng dẫn kích hoạt.
- Chính sách bảo hành.
- Lưu ý quan trọng.
- Stock/availability phù hợp với từng product type.

#### Order

- Snapshot tên sản phẩm, loại sản phẩm, thời hạn và giá tại thời điểm mua.
- Quantity và unit price thực tế theo tier.
- Customer contact/note.
- Fulfillment status tách khỏi payment status.
- Payment provider để mở rộng sau, chưa gắn cứng.

## 5. Kế hoạch thực hiện theo phase

### Phase 0 — Chốt baseline và an toàn

**Mục tiêu:** khóa phạm vi để không xây nhầm flow.

**Công việc:**

- Xác nhận product chính là Gemini Pro 18 tháng add vào email.
- Xác nhận các tier số lượng và chính sách stock.
- Tách rõ `paymentStatus` và `fulfillmentStatus` trong plan domain.
- Xác định ai có quyền vào admin và cách cấp admin secret/session.
- Đưa mock/simulate/sample data vào phạm vi development-only.

**Điều kiện đạt:**

- Có product type và fulfillment rule rõ ràng.
- Có danh sách open decisions ở cuối tài liệu này.
- Không có thay đổi payment implementation.

### Phase 1 — Chuẩn hóa UI design system

**Mục tiêu:** tạo nền UI nhất quán trước khi thêm màn hình.

**Khu vực dự kiến:**

- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- Các component dùng chung trong `frontend/src/components/`

**Công việc:**

- Gom màu, spacing, radius, shadow, blur và typography thành token duy nhất.
- Chọn một lớp glass surface chính, loại bỏ các override trùng.
- Chuẩn hóa button, chip, card, input, badge, modal và accordion.
- Bổ sung focus-visible, keyboard behavior, reduced motion và contrast.
- Xác định responsive breakpoint cho mobile/tablet/desktop.

**Điều kiện đạt:**

- Không còn hai định nghĩa cạnh tranh cho cùng một component style.
- Tất cả interactive element có focus state và accessible name.
- UI không phụ thuộc hover để hiểu trạng thái.

### Phase 2 — Catalog và Product Detail UX

**Mục tiêu:** chuyển catalog từ API-key demo sang storefront có thể bán nhiều loại sản phẩm.

**Khu vực dự kiến:**

- `frontend/src/components/ProductCatalog.tsx`
- `frontend/src/components/ProductCard.tsx`
- `frontend/src/components/CheckoutModal.tsx`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/api.ts`

**Công việc:**

- Lấy category và product từ backend thay vì hardcode.
- Có loading, empty, error và sold-out state rõ ràng.
- Product card hiển thị đúng loại hàng, thời hạn, delivery method và availability.
- Product detail modal theo reference:
  - Tổng quan sản phẩm.
  - Thông tin sản phẩm.
  - Cách kích hoạt.
  - Chính sách bảo hành.
  - Lưu ý quan trọng.
  - Quantity tier.
  - Contact/note không bắt buộc.
  - CTA sticky ở cuối modal.
- Không hiển thị payment method cuối cùng cho tới khi payment được chốt.

**Điều kiện đạt:**

- Một product `SUBSCRIPTION` có thể hiển thị đầy đủ nội dung mà không cần sửa code.
- Mobile không bị tràn ngang; modal có scroll và CTA luôn dễ thấy.
- Người dùng hiểu rõ mua gì, nhận bằng cách nào và được bảo hành ra sao trước khi tiếp tục.

### Phase 3 — Admin Product CMS

**Mục tiêu:** admin tự quản lý catalog và nội dung bán hàng.

**Khu vực dự kiến:**

- `frontend/src/app/admin/page.tsx`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/products/`
- `backend/src/schemas/`

**Công việc:**

- Tab Dashboard: stats lấy từ API, không hardcode.
- Tab Categories: tạo/sửa/ẩn danh mục, mô tả và thứ tự.
- Tab Products: bảng danh sách, filter theo category/status/type.
- Product editor có preview storefront.
- Quản lý content blocks cho info, activation, warranty và warning.
- Cấu hình quantity tiers.
- Hiển thị trạng thái draft/active/hidden/sold-out.
- Tách inventory API key khỏi stock subscription.

**Điều kiện đạt:**

- Tạo product Gemini Pro 18 tháng hoàn toàn từ admin.
- Sửa mô tả/hướng dẫn/bảo hành và storefront cập nhật từ database.
- Không còn fallback sample làm dữ liệu chính trong production.

### Phase 4 — Backend hardening và fulfillment

**Mục tiêu:** đảm bảo dữ liệu và giao hàng đúng trước khi kết nối payment thật.

**Công việc:**

- DTO + validation cho product, category, order và inventory.
- Auth guard/RBAC cho toàn bộ admin mutation và inventory endpoints.
- Không dùng default admin secret trong production.
- Không sinh key giả; thiếu stock phải báo unavailable hoặc chuyển trạng thái cần xử lý.
- Chống cấp trùng key/subscription khi request lặp.
- Tách payment status, fulfillment status và order audit log.
- Kiểm tra expiry, cancellation và retry có kiểm soát.

**Điều kiện đạt:**

- Request không hợp lệ bị từ chối có message rõ ràng.
- Request không có quyền không thể đọc/sửa dữ liệu admin.
- Một order không thể được fulfill hai lần.
- Thiếu hàng không tạo ra dữ liệu giao giả.

### Phase 5 — Payment decision gate

Phase này chỉ bắt đầu sau khi chốt phương thức thanh toán.

**Chưa làm ở hiện tại:**

- Chưa chọn ngân hàng/provider.
- Chưa triển khai webhook.
- Chưa triển khai auto-reconciliation.
- Chưa triển khai redirect/callback thật.
- Không coi `simulate-payment` là payment production.

**Sau khi chốt mới thiết kế:**

- Payment adapter interface.
- Idempotency và signature verification.
- Webhook retry/audit log.
- Quy tắc chỉ fulfill sau trạng thái thanh toán hợp lệ.
- Quy trình manual review và hoàn tiền nếu cần.

## 6. Thứ tự ưu tiên đề xuất

1. Admin auth và loại bỏ đường giao hàng giả trong production.
2. Chốt product domain cho Gemini Pro 18 tháng.
3. Chuẩn hóa design system.
4. Làm Product Detail UX và catalog động.
5. Xây Admin Product CMS.
6. Hardening fulfillment.
7. Chốt và triển khai payment sau cùng.

## 7. Open decisions cần anh chốt trước khi implement

- Gói Gemini Pro 18 tháng là subscription link, gift/activation link hay admin xử lý thủ công?
- Một order quantity x2/x5/x10 tương ứng nhiều email/người dùng hay một email nhận nhiều gói?
- Giá tier chính xác của x1/x2/x5/x10?
- Stock subscription được quản lý bằng số suất, danh sách link hay trạng thái thủ công?
- Chính sách bảo hành và điều kiện đổi cụ thể?
- Admin dùng một tài khoản hay nhiều role?
- Payment method nào sẽ dùng ở production?

## 8. Validation sau mỗi phase

- TypeScript/build frontend và backend.
- Kiểm tra responsive ở mobile, tablet và desktop.
- Keyboard navigation, focus, contrast và reduced motion.
- Test catalog filter/search/loading/error/empty.
- Test product CRUD và preview từ admin.
- Test order idempotency, stock unavailable và fulfill retry.
- Kiểm tra không còn mock/simulate/fallback nguy hiểm trong production build.
- Review security trước khi expose admin hoặc payment.

## 9. Quy ước làm việc

- Chỉ review và lập plan cho tới khi có yêu cầu rõ ràng cho từng phase implement.
- Không tự quyết định payment.
- Không copy nguyên xi thương hiệu hoặc nội dung của TADHub; chỉ học pattern UX phù hợp.
- Mọi thay đổi code sau này phải ghi rõ file/module ảnh hưởng và acceptance criteria trước khi làm.
