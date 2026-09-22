# Đánh giá thư viện UI cho LNDHub

Cập nhật: 21/09/2026

## Quyết định hiện tại

Chỉ cài page-mascot cho điểm liên hệ cố định trên desktop. Phần thẻ sản phẩm, nhãn nổi bật và giảm giá vẫn dùng CSS để nhẹ và dễ bảo trì. Mobile giữ nút chat gọn như trước; các hiệu ứng tôn trọng thiết lập prefers-reduced-motion.

## Các lựa chọn đã kiểm tra

| Thư viện | Phiên bản kiểm tra | Phù hợp với LNDHub | Quyết định |
| --- | ---: | --- | --- |
| morphicons | 1.7.1 | Icon chuyển trạng thái cho menu, mở/đóng, chat và bộ lọc. SSR sạch, không có runtime dependency riêng, có chế độ giảm chuyển động. Cần cài thêm gói dữ liệu icon như lucide đúng phiên bản. | Nên thử ở giai đoạn tinh chỉnh icon; không cần cho thẻ sản phẩm hiện tại. |
| page-mascot | 0.1.0 | Mascot nhìn theo con trỏ, chớp mắt và phản hồi khi bấm. Gói rất nhỏ nhưng còn mới và cần chuẩn bị hai sprite sheet 3x3 cho từng mascot. | Đã dùng nhân vật cube làm nút liên hệ desktop; mobile không tải giao diện mascot vào vùng hiển thị và vẫn dùng nút chat cũ. |
| @formkit/auto-animate | 0.10.0 | Tự động animate khi lọc, thêm hoặc xóa item; API nhỏ và dễ gỡ. | Ứng viên tốt khi làm lại chuyển cảnh danh sách/danh mục. |
| motion | 13.4.0 | Animation orchestration mạnh, phù hợp hero/phân cảnh phức tạp. | Chưa cần; quá lớn so với nhu cầu micro-interaction hiện tại. |
| vaul | 1.1.2 | Drawer/sheet tốt trên mobile, phù hợp modal chi tiết hoặc checkout sau này. | Cân nhắc khi làm luồng thanh toán mobile. |

## Nguyên tắc áp dụng

- Không giấu hành động quan trọng sau hover vì người dùng mobile không có hover.
- Nhãn nổi bật và giảm giá luôn đọc được ở trạng thái tĩnh; chuyển động chỉ để tăng nhận biết.
- Chỉ animate transform và opacity để hạn chế giật layout.
- Mọi thư viện mới phải được kiểm tra bundle, SSR và khả năng tắt animation trước khi cài.

## Nguồn chính

- Page Mascot: https://github.com/nilbuild/page-mascot
- Morphicons: https://github.com/guillermolg00/morphicons
- Auto Animate: https://auto-animate.formkit.com/
- Motion: https://motion.dev/
- Vaul: https://vaul.emilkowal.ski/
