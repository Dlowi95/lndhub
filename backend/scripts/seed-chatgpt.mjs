import dns from 'node:dns';
import mongoose from 'mongoose';

try { process.loadEnvFile('.env'); } catch {}
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gemini_hub';
if (uri.startsWith('mongodb+srv://')) dns.setServers(['1.1.1.1', '1.0.0.1']);

const common = {
  category: 'chatgpt', categoryLabel: 'ChatGPT', model: 'chatgpt', iconType: 'chatgpt',
  status: 'PUBLISHED', deliveryLabel: 'Thông tin nhận hàng hiển thị theo từng lựa chọn',
  features: ['Thông tin gói được hiển thị rõ trước khi đặt', 'Giá và tồn kho do quản trị viên LNDHub cập nhật', 'Chính sách bảo hành được lưu theo từng đơn hàng'],
  information: ['Mỗi lựa chọn là một SKU riêng, có giá và tồn kho độc lập.', 'Không cung cấp mật khẩu, cookie phiên hoặc mã 2FA bí mật cho người khác.'],
  activationSteps: ['Chọn đúng gói và đọc kỹ điều kiện sử dụng.', 'Nhập thông tin nhận hàng theo yêu cầu của lựa chọn.', 'Làm theo hướng dẫn được lưu cùng đơn hàng.'],
  warrantyNotes: ['Bảo hành được cấu hình riêng cho từng SKU.', 'Phạm vi bảo hành hiển thị trước khi đặt hàng.'],
};
const products = [
  {
    ...common, slug: 'chatgpt-personal', name: 'ChatGPT Plus cá nhân 1 tháng',
    description: 'Tài khoản ChatGPT Plus cá nhân dùng riêng trong 1 tháng. Chọn mức bảo hành phù hợp với nhu cầu và ngân sách.',
    price: 6000, originalPrice: 6000, promotionEnabled: false, discountPercent: 0,
    stockCount: 999, inStock: true, soldCount: 11086, featured: true, badge: 'MUA NHIỀU GIẢM GIÁ', sortOrder: 0,
    variants: [
      { id: 'chatgpt-free-250', name: 'Free 250 Codex credits', price: 6000, originalPrice: 6000, stockCount: 999, inStock: true, promotionEnabled: false, discountPercent: 0, sortOrder: 0 },
      { id: 'chatgpt-free-json', name: 'Free Codex JSON', price: 10000, originalPrice: 10000, stockCount: 999, inStock: true, promotionEnabled: false, discountPercent: 0, sortOrder: 1 },
      { id: 'chatgpt-plus-kbh', name: 'ChatGPT Plus 1 tháng cá nhân KBH', price: 30000, originalPrice: 79000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 62, sortOrder: 2 },
      { id: 'chatgpt-plus-bh24h', name: 'ChatGPT Plus 1 tháng cá nhân BH24H', price: 78000, originalPrice: 78000, stockCount: 999, inStock: true, promotionEnabled: false, discountPercent: 0, sortOrder: 3 },
      { id: 'chatgpt-plus-bh2d', name: 'ChatGPT Plus 1 tháng cá nhân BH2D', price: 115000, originalPrice: 150000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 23, sortOrder: 4 },
      { id: 'chatgpt-plus-full', name: 'ChatGPT Plus 1 tháng cá nhân Bảo hành Full', price: 256000, originalPrice: 299000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 14, sortOrder: 5 },
      { id: 'chatgpt-plus-aged', name: 'ChatGPT Plus đã ngâm 2 tuần - KBH', price: 18000, originalPrice: 50000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 64, sortOrder: 6 },
    ],
  },
  {
    ...common, slug: 'chatgpt-shared', name: 'ChatGPT Plus dùng chung 1 tháng (5 slot chat, 1 codex)',
    description: 'Gói ChatGPT Plus dùng chung tiết kiệm chi phí.',
    price: 15000, originalPrice: 19000, promotionEnabled: true, discountPercent: 21,
    stockCount: 0, inStock: false, soldCount: 777, featured: false, sortOrder: 1,
    variants: [{ id: 'chatgpt-shared-slot', name: 'ChatGPT Plus dùng chung 1 tháng (5 slot chat, 1 codex)', price: 15000, originalPrice: 19000, stockCount: 0, inStock: false, promotionEnabled: true, discountPercent: 21, sortOrder: 0 }],
  },
  {
    ...common, slug: 'chatgpt-k12', name: 'ChatGPT Plus K12',
    description: 'Các gói ChatGPT K12 gồm gói 12 tháng và K12 Edu đến năm 2028. Chọn đúng sản phẩm theo thời hạn và chính sách bảo hành.',
    price: 29000, originalPrice: 30000, promotionEnabled: true, discountPercent: 3,
    stockCount: 999, inStock: true, soldCount: 635, featured: false, sortOrder: 2,
    variants: [
      { id: 'chatgpt-k12-12m', name: 'ChatGPT plus K12 (12 tháng, dùng Codex không cần SĐT)', price: 29000, originalPrice: 30000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 3, sortOrder: 0 },
      { id: 'chatgpt-k12-2028', name: 'ChatGPT plus K12 đến 2028 - Bảo hành Full', price: 149000, originalPrice: 200000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 26, sortOrder: 1 },
    ],
  },
  {
    ...common, slug: 'chatgpt-business', name: 'ChatGPT Business 1 Tháng (Đang hết slot) (Bảo hành Full)',
    description: 'ChatGPT Business 1 tháng mỗi slot, bao gồm ChatGPT và Codex. Shop thêm email tài khoản của khách vào Business Team.',
    price: 389000, originalPrice: 425000, promotionEnabled: true, discountPercent: 8,
    stockCount: 0, inStock: false, soldCount: 552, featured: false, sortOrder: 3,
    variants: [{ id: 'chatgpt-business-1m', name: 'ChatGPT Business 1 Tháng (Bảo hành Full)', price: 389000, originalPrice: 425000, stockCount: 0, inStock: false, promotionEnabled: true, discountPercent: 8, sortOrder: 0 }],
  },
];

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const now = new Date();
await db.collection('categories').updateOne(
  { slug: 'chatgpt' },
  { $set: { name: 'ChatGPT', slug: 'chatgpt', description: 'Các gói ChatGPT', iconType: 'chatgpt', sortOrder: 0, isActive: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
  { upsert: true },
);
for (const product of products) {
  await db.collection('products').updateOne(
    { slug: product.slug },
    { $set: { ...product, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}
await db.collection('storesettings').updateOne(
  { key: 'public' },
  { $set: { businessHoursEnabled: true, restStart: '23:30', restEnd: '07:00', timeZone: 'Asia/Ho_Chi_Minh', updatedAt: now }, $setOnInsert: { key: 'public', contactEnabled: true, createdAt: now } },
  { upsert: true },
);
console.log(JSON.stringify({ success: true, category: 'chatgpt', products: products.length, schedule: '23:30-07:00 Asia/Ho_Chi_Minh' }));
await mongoose.disconnect();
