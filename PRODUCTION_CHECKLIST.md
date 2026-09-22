# LNDHub production checklist

Thanh toán vẫn phải giữ ở trạng thái tắt cho đến khi hoàn thành toàn bộ mục trong tài liệu này.

## 1. Runtime và bí mật

- Dùng Node.js 22.22.3 LTS hoặc image Docker đi kèm dự án.
- Tạo riêng từng bí mật ngẫu nhiên dài tối thiểu 32 byte cho JWT_SECRET, GIFT_ENCRYPTION_KEY, INVENTORY_ENCRYPTION_KEY, ORDER_LOOKUP_SECRET và DELIVERY_ENCRYPTION_KEY.
- Không dùng lại cùng một giá trị giữa các biến bí mật.
- Không commit file .env hoặc đưa bí mật vào ảnh chụp, log và lịch sử lệnh.
- Cấu hình ADMIN_EMAILS đúng danh sách Gmail được phép quản trị.
- Cấu hình GOOGLE_CLIENT_ID ở cả backend và frontend, đồng thời khai báo đúng origin production trong Google Cloud Console.

## 2. Hạ tầng

- Khai báo CORS_ORIGINS bằng HTTPS frontend production, không dùng wildcard.
- Khai báo NEXT_PUBLIC_API_URL bằng URL HTTPS public của backend và có hậu tố /api.
- Chỉ bật TRUST_CLOUDFLARE_HEADERS khi origin đã chặn truy cập trực tiếp và chỉ nhận traffic từ Cloudflare.
- Cấu hình TRUST_PROXY_HOPS đúng số proxy thực tế.
- Bật MongoDB Atlas backup, point-in-time recovery nếu gói hỗ trợ, và kiểm tra khôi phục thử.
- Giới hạn MongoDB Network Access theo IP máy chủ hoặc private networking; không mở toàn Internet nếu không cần.
- Không public cổng backend và frontend trực tiếp nếu đã có reverse proxy; compose mặc định chỉ bind localhost.

## 3. Cờ an toàn trước thanh toán

- ENABLE_CHECKOUT=false
- ENABLE_PAYMENT_SIMULATION=false
- ENABLE_DEMO_SEED=false
- Không kích hoạt kho quà trong admin cho đến khi dữ liệu quà đã được kiểm tra.
- Chưa thêm hoặc bật webhook thanh toán cho đến khi có xác minh chữ ký, idempotency và đối soát.

## 4. Ngân hàng và thanh toán

- Cấu hình BANK_ID, ACCOUNT_NO và ACCOUNT_NAME bằng tài khoản nhận tiền thật.
- Cấu hình BANK_NAME và xác nhận ảnh public/images/payment-bank-qr.png trùng đúng tài khoản nhận tiền.
- Quét thử QR bằng ít nhất hai ứng dụng ngân hàng và chuyển thử số tiền nhỏ trước khi mở bán.
- Không mở checkout chỉ với QR tĩnh. Cần hoàn thành webhook hoặc quy trình xác nhận tiền có kiểm soát.
- Webhook phải xác minh chữ ký, chống replay, lưu raw event an toàn và xử lý idempotent.
- Hoàn thành giữ tồn kho, hết hạn đơn chưa thanh toán, hoàn tồn và quy trình refund trước khi nhận đơn thật.
- Chạy thử bằng số tiền nhỏ trên môi trường staging và đối soát với sao kê thực tế.

## 5. Kiểm thử bắt buộc

Chạy tại thư mục backend:

    npm run test:commerce
    npm run build
    npm audit --omit=dev

Chạy tại thư mục frontend:

    npm run lint
    npm run build
    npm audit --omit=dev

## 6. Kiểm tra sau deploy

- GET /api/health trả về 200 và database connected.
- API admin không có token phải trả về 401.
- Checkout phải trả về 503 khi CHECKOUT_ENABLED=false.
- Endpoint mô phỏng thanh toán phải trả về 404 trên production.
- Origin lạ không được nhận CORS header.
- Header bảo mật Helmet và header bảo mật frontend xuất hiện đúng.
- Sản phẩm, danh mục, liên hệ và thông báo đều lấy từ database, không dùng dữ liệu giả ở frontend.
- Tạo backup thủ công ngay trước thời điểm mở checkout.

## 7. Điều kiện mở bán

Chỉ chuyển ENABLE_CHECKOUT=true khi webhook thanh toán, giữ tồn kho, hết hạn đơn, hoàn tồn, refund, giám sát lỗi và kịch bản khôi phục đã được kiểm thử đầy đủ trên staging.
