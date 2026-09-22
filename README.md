# LNDHub Store - Catalog dịch vụ số

Dự án website thương mại điện tử cho các gói AI, sáng tạo, giải trí, VPN và dịch vụ số.

Giao diện áp dụng chuẩn thiết kế **Liquid Glassmorphism** hiện đại lấy cảm hứng từ **TADHub Store** (`tadhub.store`).

---

## 🚀 Tính năng nổi bật

- **Catalog không bắt khách đăng nhập**: Khách có thể xem, lọc và so sánh sản phẩm trực tiếp.
- **Thanh toán đang khóa an toàn**: `ENABLE_CHECKOUT=false` cho đến khi luồng thanh toán được duyệt.
- **Tra cứu đơn**: Hỗ trợ tra cứu bằng mã đơn khi hệ thống đơn hàng được mở.
- **Kho Key fail-safe**: Không tự sinh key giả khi hết kho và không seed dữ liệu demo nếu chưa bật cờ riêng.
- **Giao diện Liquid Glassmorphism**:
  - `Fredoka` & `Be Vietnam Pro` typography.
  - Thẻ kính mờ sâu (`backdrop-filter: blur(20px)`), viền hologram phản chiếu, nút gradient phát sáng `liquid-soft-sweep`.
  - Hiệu ứng pháo hoa chúc mừng (`canvas-confetti`) khi thanh toán hoàn tất.
- **Trang Quản trị Admin (`/lndhub-sysadmin`)**:
  - Bắt buộc Google Sign-In; tài khoản được phép phải khai báo trong `ADMIN_EMAILS`.
  - Thống kê doanh thu, tổng số đơn, số key khả dụng.
  - Bảng quản lý đơn hàng & duyệt đơn thủ công khi cần.
  - Giao diện nhập hàng loạt API Key vào kho.

---

## 🛠️ Cấu trúc Thư mục

```text
d:/lnhub/
├── backend/          # NestJS API + MongoDB (Mongoose)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── products/   # API Danh sách gói Gemini Pro
│   │   │   ├── orders/     # Tạo đơn, tra cứu, sinh VietQR
│   │   │   ├── keys/       # Quản lý kho API Key
│   │   │   └── admin/      # Quản trị viên & thống kê
│   │   └── schemas/        # MongoDB Schemas (Product, Order, ApiKey)
│   └── .env                # Cấu hình Port, MongoDB, Ngân hàng
└── frontend/         # Next.js 15 (App Router) + Tailwind CSS
    └── src/
        ├── app/
        │   ├── page.tsx    # Trang chủ bán hàng Liquid Glassmorphism
        │   └── lndhub-sysadmin/ # Trang quản trị Google Sign-In
        └── components/     # Navbar, HeroSection, ProductCard, CheckoutModal, Lookup...
```

---

## ⚡ Hướng dẫn Khởi chạy

### 1. Khởi chạy Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
Backend sẽ khởi chạy tại: `http://localhost:4000`

### 2. Khởi chạy Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:3000`
- Trang chủ: `http://localhost:3000`
- Trang quản trị: `http://localhost:3000/lndhub-sysadmin`

## Cấu hình Google Admin

Tạo **OAuth 2.0 Client ID loại Web application** trong Google Cloud Console. Không dùng API key.

- Backend `.env`: `GOOGLE_CLIENT_ID=<client-id>` và `ADMIN_EMAILS=<email Google của quản trị viên>`.
- Frontend `.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<cùng-client-id>`.
- Thêm origin local và domain thật của frontend vào Authorized JavaScript origins.

## Lệnh deploy

Backend dùng Node `22.22.3` hoặc `24.15.0+`:

```bash
cd backend
npm ci
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm ci
npm run build
npm start
```

Sao chép các biến cần thiết từ `backend/.env.example` và `frontend/.env.example` vào secret manager của nền tảng deploy. Đặt `CORS_ORIGINS` bằng đúng origin frontend production; giữ `ENABLE_CHECKOUT`, `ENABLE_PAYMENT_SIMULATION` và `ENABLE_DEMO_SEED` là `false` cho tới khi từng luồng được duyệt.

## Đồng bộ catalog công khai an toàn

Catalog production được quản lý trong MongoDB. Quy trình đồng bộ chỉ cập nhật tên/model/cấu trúc SKU, giữ nguyên giá, sale, tồn kho, nổi bật và trạng thái mà admin đã cấu hình.

```bash
cd backend

# 1. Lấy dữ liệu công khai và tạo snapshot; chỉ đọc DB.
npm run catalog:sync:dry -- --snapshot-out=data/tadhub-public-catalog-YYYY-MM-DD.json

# 2. Xem báo cáo, sau đó mới áp dụng đúng snapshot đã duyệt.
npm run catalog:sync -- --input=data/tadhub-public-catalog-YYYY-MM-DD.json
```

Trước khi ghi, script sao lưu toàn bộ collection `products` và `categories`. Sản phẩm mới luôn ở `DRAFT`, giá/tồn kho bằng 0 và không xuất hiện ngoài storefront cho tới khi admin duyệt. Không dùng `--refresh-copy` trong các lần đồng bộ thường lệ vì mô tả đã chỉnh trong admin phải được giữ nguyên.
