# lndhub — Đặc tả triển khai cho Sol

> Đọc LNDHUB_REFERENCE_SCOPE.md trước: phạm vi mới là 36 thẻ / 47 SKU và tất cả danh mục, không chỉ Gemini. Admin chỉnh giá; payment bàn sau. LNHUB bên dưới là tên cũ.

Ngày: 2026-09-20. Trạng thái: kế hoạch, chưa triển khai application code.

## 1. Phạm vi và nguồn bằng chứng

Mục tiêu: shop dịch vụ số có trải nghiệm tương tự reference TADHub, ưu tiên Gemini Pro 18 tháng và admin tự quản lý nội dung. Giữ Next.js + Mantine + Tailwind + Lucide, NestJS + MongoDB. Payment chờ chủ shop quyết định.

Đọc cùng PLAN.md; dùng thứ tự task trong tài liệu này để cụ thể hóa các phase cũ. Mỗi lượt chỉ triển khai task được giao; không coi toàn bộ backlog là quyền làm tất cả.

- Website đọc lại ngày 2026-09-20: https://www.tadhub.store/ . Quan sát được sản phẩm, blogs, affiliate, bảo hành, tra cứu, liên hệ và giới thiệu mua không cần đăng nhập. Công cụ đọc không tải danh sách động/modal; chưa thao tác mua thật hoặc truy cập admin của họ.
- Sáu ảnh chủ shop gửi: category chips/icon/count; thông tin/kích hoạt/bảo hành dạng accordion; quantity presets; coupon; contact/note; phương thức thanh toán; tổng tiền/CTA cố định cuối modal.
- Đã đọc lại source catalog, API client, admin page/controller, product schema, orders service/controller, keys service, lookup, checkout và package manifests.
- Chưa kết nối DB, kiểm tra build/browser hoặc migration. GitNexus chỉ in tên analyzer không chứng minh index thành công.
- UI/UX Pro Max được dùng để rà focus/contrast/modal/states. Script search chưa chạy được do lỗi tạo process; không có design-system generator output đã kiểm chứng.

Nội dung ảnh là reference, không là cam kết kinh doanh LNHUB. Không sao chép giá, 5TB, quyền family, quyền truy cập model, thời gian giao hay bảo hành nếu chủ shop chưa xác nhận. Giữ thương hiệu và chính sách riêng.

## 2. Gap analysis

| Hạng mục | Bằng chứng hiện tại | Cần bổ sung |
|---|---|---|
| Định vị | frontend/src/app/page.tsx, hero/docs/layout quảng bá API key | Gói subscription, thời hạn, cách nhận đúng sản phẩm |
| Danh mục | ProductCatalog.tsx hardcode nhóm API | CRUD, icon, order, active, public count |
| Product | backend/src/schemas/product.schema.ts bắt buộc model | Type, duration, deliveryMethod, content sections, tiers, draft/publish |
| Chi tiết | CheckoutModal.tsx đi vào quantity/email/QR | Modal thông tin trước khi đặt; accordion, lưu ý, sticky summary |
| Giá | orders.service.ts#createOrder chỉ price × quantity | Server quote theo tier, chống sửa giá client |
| CMS | admin/page.tsx chỉ orders/import key, stats mẫu | Product/category/policy/settings editor và preview |
| Auth P0 | admin.controller.ts#checkAuth không reject, không được gọi | Auth cho toàn bộ admin reads/writes |
| Mock P0 | api.ts tự tạo order/paid khi lỗi; keys.service.ts sinh key khi thiếu | Báo lỗi thật; không fake order/key/success |
| Giao hàng | keys.service.ts đọc rồi save từng key | Subscription workflow, cấp phát nguyên tử, idempotency |
| Lookup | OrderLookupModal.tsx coi PAID là hoàn tất | Phân biệt giao hàng, hết hạn, hủy; bảo vệ secret/PII |
| Bảo hành | Chưa có luồng đầy đủ trong code đã rà | Policy quản trị được, hỗ trợ gắn với đơn |
| Coupon/blog/affiliate | Reference có, flow hiện tại chưa có | Sau MVP; không cần để bán gói đầu |

## 3. MVP và quyết định còn mở

MVP catalog: storefront + category + detail + admin auth/CMS + policy/contact + quote. Order/fulfillment triển khai khi business contract rõ. Không cần cart nhiều sản phẩm, tài khoản khách, blog hoặc affiliate ngay.

| Cần chủ shop chốt | Cách tiếp tục khi chưa có câu trả lời |
|---|---|
| Giao link kích hoạt hay admin xử lý email? | Product draft, chưa thực thi giao hàng |
| x2/x5/x10 ứng với bao nhiêu email/người? | Quantity preview, không đoán recipient schema |
| Giá x1 và tier, maxQuantity? | Admin-configurable, không seed giá reference thành giá bán |
| Quyền lợi, tài khoản đủ điều kiện, thời điểm tính 18 tháng? | Draft copy, không tự hứa quyền lợi/ngày hết hạn |
| Bảo hành, đổi, hoàn tiền, SLA? | Policy draft có version, chờ duyệt |
| Provider/phương thức thanh toán? | checkoutEnabled=false, không tạo QR/giao dịch mới |

Phân biệt email liên hệ với email kích hoạt. Không yêu cầu mật khẩu Google, OTP hay recovery code. Không mặc định một link đã giao là đã kích hoạt. Có env DB không đồng nghĩa được seed/migrate DB thật.

## 4. UI specification

### Storefront

- Header: logo LNHUB, sản phẩm, hướng dẫn/bảo hành, tra cứu, hỗ trợ; admin tách navigation mua hàng. Ẩn link admin không thay auth.
- Hero gọn cho gói ưu tiên; CTA tới catalog. Không thống kê, reviews, stock hoặc tốc độ giao giả.
- Một sản phẩm vẫn có bố cục hoàn chỉnh, không tạo card giả lấp chỗ.
- Category chips cuộn ngang, tên/icon/count; count chỉ tính sản phẩm active thuộc category active, độc lập search. Counter kết quả tìm kiếm riêng.
- Card: tên, duration, mô tả, availability, giá x1; nếu ghi giá từ tier phải ghi điều kiện số lượng. CTA Xem chi tiết.
- Có loading/error/retry/empty/no-results/sold-out riêng. Đổi docs cURL thành hướng dẫn mua/kích hoạt cho subscription.
- Footer: contact và policies đã cấu hình; ẩn link/tính năng chưa có.

### Modal sản phẩm

Thứ tự: tên/thời hạn → tóm tắt + tồn hàng → thông tin → kích hoạt → bảo hành → lưu ý → quantity → contact/note theo phương thức → tổng/CTA.

- Tận dụng Mantine Modal/Accordion; desktop tối đa khoảng 900px, mobile <640px full-screen, viewport động.
- Header/close và footer tiếp cận được, body cuộn; footer không che input/focus/đoạn cuối; kiểm tra bàn phím ảo.
- Trap focus, Escape đóng, trả focus về trigger; reset quote/error khi đổi product, không reset khi gập accordion.
- Presets 1/2/5/10 theo cấu hình, input integer 1..maxQuantity. Không tự chọn x10 làm mặc định.
- Summary/footer đồng bộ; đang quote lại thì khóa tiếp tục, response cũ không đè giá mới.
- Contact email optional chỉ khi nghiệp vụ cho phép. Coupon ẩn tới khi backend hỗ trợ.
- Trước payment approval: CTA công khai Chưa mở thanh toán, disabled; contact support thật nếu đã cấu hình. Admin preview không tạo order; không fake-success.

### Visual guideline đề xuất

Dark navy, chữ sáng, cyan primary, tím dùng tiết chế; glass surface có fallback đủ đậm. Một nguồn token map sang Mantine/Tailwind, không thêm lớp override cuối globals.css. Giữ Be Vietnam Pro và Lucide.

Spacing 4/8/12/16/24/32/48px; radius card 20–24px, button/input 12–16px, chips pill. Body 16px, phụ khoảng 14px; max-width 1200px; gutter mobile 16px/desktop 24px. Contrast chữ thường >=4.5:1, focus rõ, touch target mục tiêu 44×44 CSS px, trạng thái có text/icon. Motion 150–220ms, reduced-motion; không cần thêm animation framework. Đây là đề xuất chưa render/đo contrast.

## 5. Data contract đề xuất

Category: name, slug unique, description, iconKey, sortOrder, isActive. Archive thay xóa khi có sản phẩm; xóa đang dùng ->409.

Product: name, slug unique, categoryId, productType (SUBSCRIPTION/API_KEY/SERVICE), deliveryMethod (ACTIVATION_LINK/MANUAL_EMAIL/API_KEY), durationMonths, shortDescription, features, information, activationSteps, warrantyPolicyId, importantNotes, eligibility, basePriceVnd, pricingTiers, minQuantity, maxQuantity, status (DRAFT/ACTIVE/HIDDEN/ARCHIVED), availability (IN_STOCK/OUT_OF_STOCK/PAUSED), featured, sortOrder, version. model chỉ required cho API_KEY. Một SKU/gói/thời hạn trong MVP, chưa cần engine biến thể.

Policy: type, title, content, version, status, publishedAt. Settings: shopName, contacts, notice, checkoutEnabled mặc định false. Chỉ public projection được đưa ra ngoài.

Content dùng plain text/blocks hoặc Markdown sanitize; không render HTML tùy ý. Validate URL an toàn, không javascript. Publish cần category active, giá >0, content bắt buộc, deliveryMethod và policy đã duyệt.

Tier đề xuất: {minQuantity, unitPriceVnd}, minQuantity tăng dần không trùng. Lấy tier lớn nhất <=q, áp đơn giá đó cho toàn bộ q. Ví dụ chỉ cho test: base100, q>=2 giá90, q>=5 giá80; q4 tổng360, q5 tổng400. Không là giá bán thật. Chủ shop duyệt rule trước bán; server không tin price/total từ client.

Order tương lai lưu snapshot SKU/tên/duration/price/tier/policy/deliveryMethod, không lấy lại thông tin mới để diễn giải đơn cũ. FulfillmentStatus (UNFULFILLED/PROCESSING/FULFILLED/NEEDS_REVIEW) tách khỏi payment; enum/transitions payment chốt ở task riêng. Recipient tối thiểu theo delivery, idempotency key và audit log che secret.

Lookup đề xuất dùng display orderCode + secret token đủ entropy, hash token server; token truyền body/header, không URL/log. Nếu muốn một mã duy nhất, mã phải là bearer secret đủ khó đoán; chốt recovery UX. Rate limit, no-store, mask contact và chỉ trả hàng cho người có credential.

## 6. API contract

Giữ envelope {success,data}; errors code/message/fieldErrors, không stack trace.

| Endpoint đề xuất | Contract |
|---|---|
| GET /api/categories | Active categories + count active products |
| GET /api/products?category=&q=&page=&limit= | Public projection, active/category active, pagination ổn định |
| GET /api/products/:slug | Hidden/draft ->404 |
| GET /api/settings/public; /api/policies/:slug | Chỉ settings công khai/policy publish |
| POST /api/admin/auth/login, /logout; GET /me | Session auth |
| /api/admin/categories, /products | CRUD có auth, DTO, conflict handling |
| POST /api/admin/products/:id/publish | Validate trước publish |
| /api/admin/policies, /settings | Auth, version nội dung |
| POST /api/orders/quote | productId + quantity; trả unitPriceVnd/totalVnd/quantity/productVersion/availability; không side effects |

Quote không giữ hàng, không tạo order/QR. Create-order sau này tính lại giá/stock; giá đổi trả409 yêu cầu khách xác nhận. Route cũ có thể giữ tương thích trong transition, nhưng không giữ public loophole.

## 7. Backlog cho Sol

### S00 — Baseline (trước mọi task)

Đọc PLAN.md, tài liệu này và rules/skills thực tế. Kiểm tra cả .agent và .agents trước đồng bộ anti-code; không giả định skill được auto-load hay đảm bảo an toàn tuyệt đối. Xác nhận GitNexus artifact/status nếu dùng; không upload env/code ra ngoài.

Ghi kết quả build hai package; xác nhận env ignore bằng git check-ignore không in nội dung. Backend hiện auto-seed nên không boot với DB thật. Repo có file untracked, git diff --check không bao phủ các file đó; kiểm tra file mới riêng. Không tự commit toàn bộ hoặc xóa thay đổi người dùng.

Nghiệm thu: baseline, lỗi có sẵn, file scope và lệnh validation cho task sau.

### S01 — Auth và loại bỏ demo production (P0)

Files: backend/src/main.ts, modules/admin/*, modules/orders/orders.controller.ts, modules/keys/keys.service.ts, modules/products/products.service.ts; frontend/src/lib/api.ts, admin/page.tsx và CheckoutModal.tsx.

- Admin auth guard cho reads/writes. MVP đề xuất một owner, password hash server, cookie HttpOnly/Secure/SameSite, logout invalidation, rate limit login, CSRF với cookie mutations. Không client secret/NEXT_PUBLIC/localStorage. CORS allowlist cụ thể thay origin:true credentials:true.
- Vô hiệu public simulator production cả endpoint/nút, fail closed khi thiếu config. Không triển khai provider mới.
- Bỏ mock checkout/paid/fake-key và fake-success admin; kiểm tra res.ok, giữ form khi lỗi. Seed chỉ explicit opt-in test/dev DB, không onModuleInit production.
- DTO class/decorators, whitelist/forbidNonWhitelisted; ID/email/quantity integer/range/length. Inline TypeScript type chưa đủ validation.

Nghiệm thu: anonymous admin ->401, sai quyền ->403 nếu có roles; logout session vô hiệu; production simulate không dùng được; backend chết không tạo đơn/QR/key; HTTP400/500 không báo nạp thành công; invalid payload ->400.

### S02 — Storefront và modal preview (UI ưu tiên)

Files: globals.css, UIProvider.tsx, Navbar.tsx, HeroSection.tsx, ProductCatalog.tsx, ProductCard.tsx, DocsSection.tsx, app/page.tsx, app/layout.tsx. Thêm ProductDetailModal/QuantitySelector/ProductInfoSections nếu cần, tách xem thông tin khỏi CheckoutModal cũ.

Làm mục4. Fixture draft chỉ preview có nhãn; không dùng làm fallback khi API lỗi. Thay copy/metadata API-key và cam kết 3 giây không được chứng minh. Không nối payment. Không đổi contracts backend trong task UI này.

Nghiệm thu: screenshot375/1440px, kiểm tra320/768px và zoom200%; modal keyboard đúng; footer không che nội dung; loading/error/empty/sold-out; checkout disabled không tạo đơn. Một card vẫn bố cục đẹp.

### S03 — Catalog schema/API (sau S01)

Files: product.schema.ts, thêm category/policy schemas/modules/DTO; products/admin modules; frontend/src/lib/types.ts.

Làm mục5–6. Migration additive map category string ->categoryId bằng slug, legacy API-key ->API_KEY chỉ khi xác minh. Không biến hàng cũ thành subscription hay xóa order. Dry-run counts/errors, backup, apply sau duyệt, chạy lại idempotent; không sửa snapshot lịch sử.

Nghiệm thu: draft không lộ kể cả truy cập slug; duplicate slug409; category inactive loại product khỏi public; publish thiếu trường bị chặn; legacy data vẫn đọc được.

### S04 — Admin CMS (sau S01/S03)

Files: tách admin/page.tsx thành routes/components categories/products/policies/settings; tập trung API client.

Sidebar Tổng quan/Sản phẩm/Danh mục/Nội dung/Cài đặt. Editor product có basic/type/duration/delivery, tier, info/activation/warranty/notes, stock, draft/publish, preview dùng cùng renderer public. Errors inline, giữ form khi lỗi, cảnh báo rời trang chưa lưu. Category reorder bằng nút lên/xuống; không cần drag engine. Policy version và shop contact cấu hình thật.

Stats aggregation trên toàn DB/range; không cộng100 đơn do getAllOrders đang limit, không KPI280+. List có pagination/search/status filter. Archive thay destructive delete khi có reference.

Nghiệm thu: tạo draft Gemini18 tháng, reload persist, preview/public nhất quán nội dung; publish hợp lệ, hide hiệu lực; lỗi save giữ dữ liệu; trực tiếp gọi API admin vẫn cần auth; stats đúng với >100 đơn test.

### S05 — Nối catalog thật (sau S02/S03/S04)

Files: api.ts, types.ts, app/page.tsx, catalog/card/detail và policy/settings consumers.

Public DTO thống nhất, không fallback; API base cấu hình cả admin/public, bỏ localhost rải rác. Xác định refresh sau publish, không nhầm next.revalidate trong client fetch với server cache. Product deep link đề xuất /products/[slug], share/refresh được, content renderer dùng chung, metadata thật; không triển khai đồng thời hai cơ chế routing modal khác nhau.

Nghiệm thu: filter+search đúng; draft hidden404; hide/sửa phản ánh sau refresh; đổi backend URL không sửa component; lỗi kết nối khác empty.

### S06 — Server quote (sau S03/S05)

Files: orders quote DTO/controller/service, frontend API/types/detail/quantity.

Server tier calculation; quote không mutation. UI request cancellation/version chống stale response; summary/footer đồng bộ; quantity nguyên và max. Create-order integration chờ payment contract.

Nghiệm thu: q1,2,4,5,9,10,max+1,0,-1,1.5; spoof total không tác dụng; quantity đổi nhanh không hiển thị giá cũ; out-of-stock không báo có thể đặt.

### S07 — Subscription fulfillment (CHỜ business và payment contract)

Files: fulfillment/inventory modules mới, order schema/service, admin order detail. Không dùng API-key shortcut cho subscription.

Chốt delivery/recipients/stock/điều kiện được phép giao trước làm. Inventory link gắn productId; manual email tạo work item admin. Cấp nguyên tử, idempotency và recovery; không giữ DB lock qua external call. Nếu deployment Mongo không hỗ trợ transaction, phải trình giải pháp atomic reservation/recovery trước code. Không fulfill thiếu quantity, không đoán ngày activation. Product sửa không đổi đơn snapshot.

Nghiệm thu DB test: hai đơn/1 item chỉ một đơn nhận; retry không tiêu thụ thêm; crash giữa cấp/lưu khôi phục được; thiếu hàng NEEDS_REVIEW, không key giả. Không thử giao thật.

### S08 — Lookup và hỗ trợ (sau S07 contract)

Files: OrderLookupModal.tsx, order status/detail renderer, backend lookup/public DTO; policy public có thể hoàn thành trước ở S04.

Credentials theo mục5; không raw document/PII. Hiển thị từng state, không PAID=FULFILLED. Poll chỉ non-terminal, dừng đóng/unmount/hủy/hết hạn, backoff và error feedback, tránh request overlap. Link/key chỉ hiện khi được phép, clipboard báo lỗi thật. Bảo hành dùng policy snapshot. Ticket nội bộ chỉ nếu chủ shop muốn; MVP contact link cấu hình được, không form gửi giả.

Nghiệm thu: refresh lookup, sai credential không lộ dữ liệu, rate limit, no-store; terminal dừng poll; hủy/hết hạn không bị gọi chờ thanh toán.

### S09 — Sau MVP

Coupon cần scope, thời hạn, usage limit atomic, stacking với tiers và tính server; chờ rules thanh toán. Blogs/affiliate là task riêng, affiliate cần attribution/commission/refund rules. Không cài thêm framework để làm các phần chưa ưu tiên.

## 8. QA/release và bàn giao

- Unit/integration: DTO, tier boundary, public filtering, auth, stats pagination, sanitized content; concurrency/retry fulfillment khi tới S07.
- Browser: 320/375/768/1440px, zoom200%, keyboard, reduced-motion, input keyboard mobile, tên/nội dung tiếng Việt dài, retry và save fail giữ form.
- Chạy npm.cmd run build riêng frontend/backend. Hai package chưa khai báo test script trong manifest đã đọc: task có logic mới bổ sung test runner/lệnh phù hợp, không báo npm test pass khi chưa có.
- Playwright có thể bổ sung ở task QA; automated accessibility không thay manual keyboard/contrast.
- Không launch backend vào DB thật trước khóa seed. Không migrate production trước backup/dry-run/duyệt.
- UI xong chưa là sẵn sàng nhận tiền: release thương mại cần auth, giá, stock, fulfillment, lookup và payment đã nghiệm thu.

Prompt cho Sol:

> Đọc SOL_IMPLEMENTATION_PLAN.md và PLAN.md, rules/skills thực tế. Làm S00 rồi duy nhất task tôi chỉ định; liệt kê file và acceptance criteria trước sửa. Giữ stack hiện tại. Với S02 chỉ UI preview, không tự nối payment. Có blocker ngoài scope thì báo bằng chứng, không lặng lẽ rewrite. Không in secrets, seed/migrate DB thật, copy giá/cam kết TADHub hoặc fake-success. Kết thúc báo file đổi, lệnh/check thực tế, screenshot khi đổi UI, vấn đề còn lại và task tiếp theo. Build pass chưa đủ đánh dấu task xong nếu chưa đạt tiêu chí.

Lượt đầu đề xuất: S00 + S02 để chủ shop duyệt UI. S01 bắt buộc trước expose admin/mở bán. Sau UI: S01 → S03 → S04 → S05 → S06. S07/S08 đợi business contract; payment task riêng sau chủ shop chốt.

Nhật ký 2026-09-20: đã phân tích source/reference và viết kế hoạch. Đã triển khai lát cắt R01/S02 storefront preview: thương hiệu lndhub; fixture 36 thẻ/47 SKU; 18 danh mục + Tất cả; hero, search/filter, product card, detail modal, quantity và trạng thái payment/lookup/contact an toàn. Frontend production build pass và đã kiểm tra ảnh headless ở 1440px/500px. Chưa kết nối DB/API catalog, chưa làm admin/auth/payment, chưa xác nhận GitNexus; R01 mới đạt phần UI preview, các tiêu chí 320/375/768/zoom 200% và keyboard modal vẫn cần QA tương tác trước khi nghiệm thu hoàn toàn.
