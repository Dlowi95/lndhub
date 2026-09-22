# Kiến trúc thanh toán LNDHub

## Quyết định hiện tại

LNDHub dùng mô hình fulfillment lai thay vì áp dụng một cách giao hàng cho mọi sản phẩm.

- MANUAL_SERVICE: dùng cho tài khoản, subscription và key có nguy cơ bị nguồn hàng kích hoạt trước. Không ôm kho lớn. Sau khi tiền được xác nhận, admin mua hoặc chuẩn bị hàng rồi nhập nội dung giao vào đúng đơn.
- API_KEY: chỉ dùng cho key từ nguồn kiểm soát được. Giữ kho nóng nhỏ, mã hóa dữ liệu và cấp nguyên tử sau khi thanh toán hợp lệ.

## Chuyển khoản ngân hàng phiên bản đầu

1. Server tự tính lại giá từ sản phẩm/SKU trong database.
2. Server tạo mã đơn ngẫu nhiên và token tra cứu riêng.
3. Người dùng xem QR tài khoản shop, số tiền chính xác và nội dung chuyển khoản là mã đơn.
4. Người dùng có thể bấm “Tôi đã chuyển khoản”. Hành động này chỉ ghi nhận CUSTOMER_REPORTED_PAYMENT; paymentStatus vẫn là PENDING.
5. Admin thấy đơn chờ kiểm tra trong tối đa 15 giây, đối chiếu trực tiếp ứng dụng ngân hàng rồi xác nhận tiền.
6. Sau khi paymentStatus là PAID, admin mới được nhập key hoặc nội dung giao hàng.
7. Nội dung giao được mã hóa AES-256-GCM trước khi lưu và chỉ được giải mã khi khách dùng đúng token tra cứu của đơn.
8. Trang khách tự cập nhật mỗi 5 giây; không cần tải lại trang.

Đơn chưa thanh toán hết hạn sau 30 phút. Khi khách đã báo chuyển, thời gian kiểm tra được kéo dài để tránh hết hạn trong lúc admin đối soát.

## Quy tắc an toàn

- Không xác nhận tiền chỉ dựa trên ảnh chụp hoặc nút “Tôi đã chuyển khoản”.
- Phải khớp tài khoản nhận, chiều tiền vào, số tiền và mã đơn.
- Một giao dịch ngân hàng chỉ được gắn với một đơn.
- Nội dung giao hàng không xuất hiện trong API admin list, log hoặc storefront công khai.
- Ảnh QR tĩnh phải được quét thử và phải trùng với BANK_ID, ACCOUNT_NO và ACCOUNT_NAME đang cấu hình.
- Trước khi mở bán phải thử một giao dịch giá trị nhỏ từ đầu đến cuối.

## Tự động hóa ngân hàng ở phase kế tiếp

Khi chọn nhà cung cấp webhook, luồng manual vẫn được giữ làm phương án dự phòng. Webhook phải có chữ ký HMAC, chống replay, idempotency theo transaction ID, kiểm tra đúng số tiền/mã đơn và lưu audit event trước khi chuyển đơn sang PAID.

## Các kênh chưa mở

- Binance Pay (USDT)
- USDT BEP20 (BSC)
- PayPal (USD)

Các kênh này chỉ hiển thị “Sắp mở”; chưa tạo địa chỉ nhận, chưa quy đổi tỷ giá và chưa chấp nhận thanh toán cho đến khi có thiết kế xác minh giao dịch riêng.

## Đối chiếu giao diện tham khảo

Từ ảnh tham khảo do chủ shop cung cấp, TADHub cũng dùng mô hình tạo đơn trước, hiển thị số tiền và mã thanh toán riêng, cho phép kiểm tra trạng thái sau khi chuyển và chỉ giao hàng khi giao dịch được xác nhận. Đây là quan sát từ giao diện công khai, không phải xác nhận về backend nội bộ của TADHub.
