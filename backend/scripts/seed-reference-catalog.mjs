import dns from 'node:dns';
import fs from 'node:fs';
import mongoose from 'mongoose';

try { process.loadEnvFile('.env'); } catch {}
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gemini_hub';
if (uri.startsWith('mongodb+srv://')) dns.setServers(['1.1.1.1', '1.0.0.1']);

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
const snapshot = JSON.parse(fs.readFileSync(new URL('../data/tadhub-reference-2026-09-21.json', import.meta.url), 'utf8'));
const sourceById = new Map(snapshot.products.map((item) => [item.id, item]));
const categoryDefinitions = [
  ['ChatGPT', 'chatgpt'], ['Gemini', 'gemini'], ['Claude', 'claude'], ['Grok', 'grok'],
  ['YouTube', 'youtube'], ['Netflix', 'netflix'], ['VPN', 'vpn'], ['Spotify', 'spotify'],
  ['CapCut', 'capcut'], ['Canva', 'canva'], ['Adobe', 'adobe'], ['Office', 'office'],
  ['JetBrains', 'jetbrains'], ['iLovePDF', 'ilovepdf'], ['Leonardo AI', 'leonardo'],
  ['Autodesk', 'autodesk'], ['Duolingo', 'duolingo'], ['Khác', 'other'],
];
const categoryById = new Map([
  [2, ['youtube', 'YouTube']], [3, ['claude', 'Claude']], [4, ['gemini', 'Gemini']],
  [5, ['netflix', 'Netflix']], [6, ['spotify', 'Spotify']], [7, ['vpn', 'VPN']],
  [8, ['grok', 'Grok']], [9, ['adobe', 'Adobe']], [10, ['office', 'Office']],
  [11, ['capcut', 'CapCut']], [12, ['canva', 'Canva']], [13, ['other', 'Khác']],
]);
const groupedIds = new Set([7, 13, 14, 15, 25, 55, 11, 28, 35, 36, 37, 38, 39, 9, 10, 52]);
const groups = [
  { slug: 'gemini-18m', name: 'Gemini Pro 18 Tháng (thêm vào email của bạn)', category: 'gemini', categoryLabel: 'Gemini', sourceIds: [10], gemini18: true },
  { slug: 'gemini-1y', name: 'Gemini Pro 1 Năm (Cấp tài khoản)', category: 'gemini', categoryLabel: 'Gemini', sourceIds: [9], gemini1y: true },
  { slug: 'youtube-premium', name: 'YouTube Premium', category: 'youtube', categoryLabel: 'YouTube', sourceIds: [7, 13, 14, 15] },
  { slug: 'netflix-premium', name: 'Netflix Premium 4K', category: 'netflix', categoryLabel: 'Netflix', sourceIds: [25, 55] },
  { slug: 'nordvpn', name: 'NordVPN', category: 'vpn', categoryLabel: 'VPN', sourceIds: [11, 28] },
  { slug: 'capcut-pro', name: 'CapCut Pro', category: 'capcut', categoryLabel: 'CapCut', sourceIds: [35, 36] },
  { slug: 'canva-pro-edu', name: 'Canva Pro & Edu', category: 'canva', categoryLabel: 'Canva', sourceIds: [37, 38, 39] },
  { slug: 'leonardo-ai-credits', name: 'Leonardo AI 8.500 Credits (1 Tháng)', category: 'leonardo', categoryLabel: 'Leonardo AI', sourceIds: [52] },
];

const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const effectivePrice = (item) => item.promoActive && item.promoPrice ? item.promoPrice : item.price;
const discount = (item) => item.promoActive && item.promoPrice && item.price > item.promoPrice ? Math.round((1 - item.promoPrice / item.price) * 100) : 0;
const deliveryLabel = (items) => items.some((item) => item.requiresCustomerEmail) ? 'Nâng cấp hoặc kích hoạt trên email của bạn' : items.some((item) => item.webAutoDelivery) ? 'Giao tự động trên web' : items.some((item) => item.manualDelivery) ? 'Shop xử lý thủ công sau khi nhận đủ thông tin' : 'Cấp tài khoản hoặc thông tin sử dụng';
const makeVariant = (item, index) => ({
  id: `reference-${item.id}`,
  name: item.name,
  price: effectivePrice(item),
  originalPrice: item.price,
  stockCount: item.sheetStock,
  inStock: item.sheetStock > 0,
  promotionEnabled: Boolean(item.promoActive && item.promoPrice && item.price > item.promoPrice),
  discountPercent: discount(item),
  deliveryLabel: deliveryLabel([item]),
  sortOrder: index,
});
const genericContent = (categoryLabel, name) => ({
  description: `${name}. Giá, tồn kho và trạng thái được đối chiếu từ catalog công khai và có thể được quản trị viên LNDHub điều chỉnh trước khi bán.`,
  features: [`Gói ${categoryLabel} được phân loại rõ theo thời hạn và hình thức nhận`, 'Giá và tồn kho được quản lý trực tiếp trong admin LNDHub', 'Mỗi lựa chọn có trạng thái bán và mức giá riêng'],
  information: ['Đọc kỹ tên lựa chọn, thời hạn và hình thức giao trước khi đặt.', 'Không cung cấp mật khẩu, cookie phiên hoặc mã 2FA cho người không có thẩm quyền.'],
  activationSteps: ['Chọn đúng gói cần mua.', 'Cung cấp thông tin nhận hàng theo yêu cầu hiển thị.', 'Làm theo hướng dẫn được lưu cùng đơn hàng.'],
  warrantyNotes: ['Thời hạn bảo hành phụ thuộc từng lựa chọn.', 'Admin có thể cập nhật chính sách trước khi mở bán.'],
});

const products = [];
for (const group of groups) {
  const sourceItems = group.sourceIds.map((id) => sourceById.get(id)).filter(Boolean);
  if (group.gemini18) {
    const source = sourceItems[0];
    products.push({
      slug: group.slug, name: group.name, category: group.category, categoryLabel: group.categoryLabel,
      description: 'Google Gemini Pro / AI Pro trong 18 tháng, kích hoạt trực tiếp trên tài khoản Google của bạn qua link gift.',
      price: 45000, originalPrice: 59000, promotionEnabled: false, discountPercent: 0,
      stockCount: source.sheetStock, inStock: source.sheetStock > 0, soldCount: source.soldCount,
      featured: true, badge: 'MUA NHIỀU GIẢM GIÁ', iconType: 'gemini', model: 'gemini-pro-18m',
      deliveryLabel: 'Kích hoạt vào email Google của bạn', status: 'PUBLISHED', sortOrder: 100,
      variants: [
        { id: 'gemini-18m-x1', name: 'x1', price: 59000, originalPrice: 59000, stockCount: source.sheetStock, inStock: source.sheetStock > 0, promotionEnabled: false, discountPercent: 0, sortOrder: 0 },
        { id: 'gemini-18m-x2', name: 'x2 · 55.000đ/cái', price: 110000, originalPrice: 118000, stockCount: source.sheetStock, inStock: source.sheetStock > 0, promotionEnabled: true, discountPercent: 7, sortOrder: 1 },
        { id: 'gemini-18m-x5', name: 'x5 · 50.000đ/cái', price: 250000, originalPrice: 295000, stockCount: source.sheetStock, inStock: source.sheetStock > 0, promotionEnabled: true, discountPercent: 15, sortOrder: 2 },
        { id: 'gemini-18m-x10', name: 'x10 · 45.000đ/cái', price: 450000, originalPrice: 590000, stockCount: source.sheetStock, inStock: source.sheetStock > 0, promotionEnabled: true, discountPercent: 24, sortOrder: 3 },
      ],
      features: ['Google Gemini Pro / AI Pro', 'Thời hạn sử dụng 18 tháng', 'Kích hoạt trực tiếp trên tài khoản Google của bạn qua link gift', 'Hỗ trợ Google Antigravity', 'Có model Opus 4.6', 'Dung lượng Google One 5TB'],
      information: ['Đây là nâng cấp chính chủ trên email của bạn, không phải tài khoản cấp sẵn.', 'Bạn là admin và có thể mời thêm tối đa 5 người khác.'],
      activationSteps: ['Mở Google Chrome và đăng nhập đúng tài khoản Google muốn thêm Gemini Pro.', 'Mở link kích hoạt do shop cung cấp.', 'Nhấn Kích hoạt để hoàn tất.'],
      warrantyNotes: ['Kích hoạt ngay sau khi nhận link để tránh link hết hạn.', 'Bảo hành theo chính sách được admin LNDHub công bố tại thời điểm đặt.'],
    });
    continue;
  }
  const variants = sourceItems.map(makeVariant);
  const first = sourceItems[0];
  const content = genericContent(group.categoryLabel, group.name);
  products.push({
    slug: group.slug, name: group.name, category: group.category, categoryLabel: group.categoryLabel,
    ...content, price: Math.min(...variants.map((item) => item.price)), originalPrice: Math.min(...variants.map((item) => item.originalPrice || item.price)),
    promotionEnabled: variants.some((item) => item.promotionEnabled), discountPercent: Math.max(0, ...variants.map((item) => item.discountPercent || 0)),
    stockCount: sourceItems.reduce((sum, item) => sum + item.sheetStock, 0), inStock: sourceItems.some((item) => item.sheetStock > 0),
    soldCount: sourceItems.reduce((sum, item) => sum + item.soldCount, 0), featured: sourceItems.some((item) => item.isHighlight),
    badge: sourceItems.some((item) => item.isHighlight) ? 'NỔI BẬT' : '', iconType: group.category, model: group.slug,
    deliveryLabel: deliveryLabel(sourceItems), status: 'PUBLISHED', sortOrder: first.id, variants,
  });
}

for (const source of snapshot.products.filter((item) => item.categoryId !== 1 && !groupedIds.has(item.id))) {
  const [category, categoryLabel] = categoryById.get(source.categoryId) || ['other', 'Khác'];
  const variant = makeVariant(source, 0);
  const content = genericContent(categoryLabel, source.name);
  products.push({
    slug: slugify(source.name), name: source.name, category, categoryLabel, ...content,
    price: variant.price, originalPrice: variant.originalPrice, promotionEnabled: variant.promotionEnabled,
    discountPercent: variant.discountPercent, stockCount: source.sheetStock, inStock: source.sheetStock > 0,
    soldCount: source.soldCount, featured: source.isHighlight, badge: source.isHighlight ? 'NỔI BẬT' : '',
    iconType: category, model: slugify(source.name), deliveryLabel: deliveryLabel([source]), status: 'PUBLISHED',
    sortOrder: source.id, variants: [variant],
  });
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const productCollection = db.collection('products');
const categoryCollection = db.collection('categories');
const existing = await productCollection.find({}, { projection: { slug: 1 } }).toArray();
const existingSlugs = new Set(existing.map((item) => item.slug));
const report = {
  mode: apply ? (force ? 'apply-force' : 'apply-insert-only') : 'dry-run',
  sourceProducts: snapshot.productCount,
  groupedCards: products.length,
  existingProducts: existing.length,
  toInsert: products.filter((item) => !existingSlugs.has(item.slug)).map((item) => item.slug),
  toUpdate: force ? products.filter((item) => existingSlugs.has(item.slug)).map((item) => item.slug) : [],
  categoriesWithProducts: [...new Set(products.map((item) => item.category))],
};

if (apply) {
  const now = new Date();
  for (const [index, [name, slug]] of categoryDefinitions.entries()) {
    await categoryCollection.updateOne({ slug }, { $setOnInsert: { name, slug, description: '', iconType: slug, sortOrder: index, isActive: true, createdAt: now }, $set: { updatedAt: now } }, { upsert: true });
  }
  for (const product of products) {
    const update = force ? { $set: { ...product, updatedAt: now }, $setOnInsert: { createdAt: now } } : { $setOnInsert: { ...product, createdAt: now, updatedAt: now } };
    await productCollection.updateOne({ slug: product.slug }, update, { upsert: true });
  }
  report.totalAfter = await productCollection.countDocuments({ status: { $ne: 'ARCHIVED' } });
}

console.log(JSON.stringify(report, null, 2));
await mongoose.disconnect();
