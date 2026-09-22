import { Category, Product, ProductVariant } from './types';

type ProductSeed = {
  id: string; name: string; category: string; categoryLabel: string; variants?: string[];
  variantDetails?: ProductVariant[]; featured?: boolean; delivery?: string; description?: string;
  price?: number; originalPrice?: number; promotionEnabled?: boolean; discountPercent?: number;
  stockCount?: number; inStock?: boolean; soldCount?: number;
};

const defaultFeatures = [
  'Thông tin gói được hiển thị rõ trước khi đặt',
  'Giá và tồn kho do quản trị viên lndhub cập nhật',
  'Chính sách bảo hành được lưu theo từng đơn hàng',
];

function makeVariants(productId: string, names: string[], deliveryLabel: string): ProductVariant[] {
  return names.map((name, index) => ({ id: `${productId}-v${index + 1}`, name, price: 0, stockCount: 0, inStock: false, deliveryLabel }));
}

function createProduct(seed: ProductSeed): Product {
  const deliveryLabel = seed.delivery || 'Hình thức giao sẽ được cập nhật';
  return {
    _id: seed.id, slug: seed.id, name: seed.name, category: seed.category, categoryLabel: seed.categoryLabel,
    description: seed.description || `Các lựa chọn ${seed.name} đang được lndhub chuẩn hóa nội dung, giá và chính sách trước khi mở bán.`,
    features: defaultFeatures, model: seed.category, price: seed.price || 0, originalPrice: seed.originalPrice || 0,
    promotionEnabled: Boolean(seed.promotionEnabled), discountPercent: seed.discountPercent || 0, soldCount: seed.soldCount || 0,
    badge: seed.featured ? 'NỔI BẬT' : undefined, stockCount: seed.stockCount || 0, inStock: Boolean(seed.inStock),
    iconType: seed.category, featured: seed.featured, deliveryLabel,
    variants: seed.variantDetails || makeVariants(seed.id, seed.variants || [seed.name], deliveryLabel),
    information: ['Mỗi lựa chọn là một SKU riêng, có giá và tồn kho độc lập.', 'Quyền lợi chỉ hiển thị sau khi được quản trị viên duyệt.'],
    activationSteps: ['Chọn đúng gói và đọc điều kiện sử dụng.', 'Nhập thông tin nhận hàng theo yêu cầu.', 'Làm theo hướng dẫn được lưu cùng đơn hàng.'],
    warrantyNotes: ['Bảo hành được cấu hình riêng cho từng SKU.', 'lndhub không yêu cầu mật khẩu, cookie phiên hoặc mã 2FA bí mật.'],
  };
}

const seeds: ProductSeed[] = [
  {
    id: 'chatgpt-personal', name: 'ChatGPT Plus cá nhân 1 tháng', category: 'chatgpt', categoryLabel: 'ChatGPT', featured: true,
    description: 'Tài khoản ChatGPT Plus cá nhân dùng riêng trong 1 tháng. Chọn mức bảo hành phù hợp với nhu cầu và ngân sách.',
    price: 6000, originalPrice: 6000, stockCount: 999, inStock: true, soldCount: 11086,
    variantDetails: [
      { id: 'chatgpt-free-250', name: 'Free 250 Codex credits', price: 6000, originalPrice: 6000, stockCount: 999, inStock: true },
      { id: 'chatgpt-free-json', name: 'Free Codex JSON', price: 10000, originalPrice: 10000, stockCount: 999, inStock: true },
      { id: 'chatgpt-plus-kbh', name: 'ChatGPT Plus 1 tháng cá nhân KBH', price: 30000, originalPrice: 79000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 62 },
      { id: 'chatgpt-plus-bh24h', name: 'ChatGPT Plus 1 tháng cá nhân BH24H', price: 78000, originalPrice: 78000, stockCount: 999, inStock: true },
      { id: 'chatgpt-plus-bh2d', name: 'ChatGPT Plus 1 tháng cá nhân BH2D', price: 115000, originalPrice: 150000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 23 },
      { id: 'chatgpt-plus-full', name: 'ChatGPT Plus 1 tháng cá nhân Bảo hành Full', price: 256000, originalPrice: 299000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 14 },
      { id: 'chatgpt-plus-aged', name: 'ChatGPT Plus đã ngâm 2 tuần - KBH', price: 18000, originalPrice: 50000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 64 },
    ],
  },
  {
    id: 'chatgpt-shared', name: 'ChatGPT Plus dùng chung 1 tháng (5 slot chat, 1 codex)', category: 'chatgpt', categoryLabel: 'ChatGPT',
    description: 'Gói ChatGPT Plus dùng chung tiết kiệm chi phí.', price: 15000, originalPrice: 19000,
    promotionEnabled: true, discountPercent: 21, stockCount: 0, inStock: false, soldCount: 777,
    variantDetails: [{ id: 'chatgpt-shared-slot', name: 'Slot dùng chung 1 tháng', price: 15000, originalPrice: 19000, stockCount: 0, inStock: false, promotionEnabled: true, discountPercent: 21 }],
  },
  {
    id: 'chatgpt-k12', name: 'ChatGPT Plus K12', category: 'chatgpt', categoryLabel: 'ChatGPT',
    description: 'Các gói ChatGPT K12 gồm gói 12 tháng và K12 Edu đến năm 2028. Chọn đúng sản phẩm theo thời hạn và chính sách bảo hành.',
    price: 29000, originalPrice: 30000, promotionEnabled: true, discountPercent: 3, stockCount: 999, inStock: true, soldCount: 635,
    variantDetails: [
      { id: 'chatgpt-k12-12m', name: 'ChatGPT plus K12 (12 tháng, dùng Codex không cần SĐT)', price: 29000, originalPrice: 30000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 3 },
      { id: 'chatgpt-k12-2028', name: 'ChatGPT plus K12 đến 2028 - Bảo hành Full', price: 149000, originalPrice: 200000, stockCount: 999, inStock: true, promotionEnabled: true, discountPercent: 26 },
    ],
  },
  {
    id: 'chatgpt-business', name: 'ChatGPT Business 1 Tháng (Đang hết slot) (Bảo hành Full)', category: 'chatgpt', categoryLabel: 'ChatGPT',
    description: 'ChatGPT Business 1 tháng mỗi slot, bao gồm ChatGPT và Codex. Shop thêm email tài khoản của khách vào Business Team.',
    price: 389000, originalPrice: 425000, promotionEnabled: true, discountPercent: 8, stockCount: 0, inStock: false, soldCount: 552,
    variantDetails: [{ id: 'chatgpt-business-1m', name: 'ChatGPT Business 1 Tháng (Bảo hành Full)', price: 389000, originalPrice: 425000, stockCount: 0, inStock: false, promotionEnabled: true, discountPercent: 8 }],
  },
  { id: 'gemini-18m', name: 'Gemini Pro 18 tháng', category: 'gemini', categoryLabel: 'Gemini', featured: true, delivery: 'Kích hoạt vào email của khách' },
  { id: 'gemini-1y', name: 'Gemini Pro 1 năm', category: 'gemini', categoryLabel: 'Gemini', delivery: 'Cấp tài khoản' },
  { id: 'claude-team-standard', name: 'Claude Team Standard', category: 'claude', categoryLabel: 'Claude', featured: true },
  { id: 'claude-pro', name: 'Claude Pro chính chủ', category: 'claude', categoryLabel: 'Claude' },
  { id: 'claude-team-premium', name: 'Claude Team Premium', category: 'claude', categoryLabel: 'Claude' },
  { id: 'claude-max-owner', name: 'Claude Max x20 chính chủ', category: 'claude', categoryLabel: 'Claude' },
  { id: 'claude-max-account', name: 'Claude Max x20 tài khoản', category: 'claude', categoryLabel: 'Claude' },
  { id: 'grok-super', name: 'Grok Super', category: 'grok', categoryLabel: 'Grok', variants: ['Gói 7–10 ngày', 'Gói 1 tháng'] },
  { id: 'grok-free', name: 'Grok Free', category: 'grok', categoryLabel: 'Grok' },
  { id: 'grok-json', name: 'Grok Free JSON + account', category: 'grok', categoryLabel: 'Grok' },
  { id: 'youtube-premium', name: 'YouTube Premium', category: 'youtube', categoryLabel: 'YouTube', featured: true },
  { id: 'netflix-premium', name: 'Netflix Premium 4K', category: 'netflix', categoryLabel: 'Netflix' },
  { id: 'nordvpn-gift', name: 'NordVPN Gift', category: 'vpn', categoryLabel: 'VPN' },
  { id: 'nordvpn-account', name: 'NordVPN tài khoản', category: 'vpn', categoryLabel: 'VPN' },
  { id: 'spotify-premium', name: 'Spotify Premium', category: 'spotify', categoryLabel: 'Spotify' },
  { id: 'capcut-pro', name: 'CapCut Pro', category: 'capcut', categoryLabel: 'CapCut', variants: ['Gói 5–7 ngày', 'Gói 30 ngày'] },
  { id: 'canva', name: 'Canva Pro & Edu', category: 'canva', categoryLabel: 'Canva', variants: ['Canva Pro 30 ngày', 'Canva Edu 2 năm', 'Canva Edu Team 1 năm'] },
  { id: 'adobe-express', name: 'Adobe Express Premium', category: 'adobe', categoryLabel: 'Adobe' },
  { id: 'adobe-cc-1m', name: 'Adobe Creative Cloud 1 tháng', category: 'adobe', categoryLabel: 'Adobe' },
  { id: 'adobe-full-app', name: 'Adobe Full App 2 tháng', category: 'adobe', categoryLabel: 'Adobe' },
  { id: 'adobe-cc-pro', name: 'Adobe CC Pro', category: 'adobe', categoryLabel: 'Adobe' },
  { id: 'adobe-cc-3m', name: 'Adobe Creative Cloud 3 tháng', category: 'adobe', categoryLabel: 'Adobe' },
  { id: 'adobe-trial', name: 'Adobe Creative Cloud Trial', category: 'adobe', categoryLabel: 'Adobe' },
  { id: 'microsoft-365', name: 'Microsoft 365 cá nhân', category: 'office', categoryLabel: 'Office' },
  { id: 'office-2024', name: 'Office 2024 Pro Plus', category: 'office', categoryLabel: 'Office' },
  { id: 'office-365-6y', name: 'Office 365 dài hạn', category: 'office', categoryLabel: 'Office' },
  { id: 'jetbrains-edu', name: 'JetBrains Edu Pack', category: 'jetbrains', categoryLabel: 'JetBrains' },
  { id: 'ilovepdf', name: 'iLovePDF Premium', category: 'ilovepdf', categoryLabel: 'iLovePDF' },
  { id: 'leonardo', name: 'Leonardo AI Credits', category: 'leonardo', categoryLabel: 'Leonardo AI' },
  { id: 'autodesk', name: 'Autodesk 1 năm', category: 'autodesk', categoryLabel: 'Autodesk' },
  { id: 'duolingo', name: 'Duolingo Super', category: 'duolingo', categoryLabel: 'Duolingo' },
  { id: 'windows-pro', name: 'Windows 10/11 Pro', category: 'other', categoryLabel: 'Khác' },
];

export const CATALOG_PRODUCTS = seeds.map(createProduct);
export const CATALOG_CATEGORIES: Category[] = Array.from(new Map(seeds.map((seed) => [seed.category, seed.categoryLabel])).entries()).map(([slug, name], index) => ({
  _id: `fixture-${slug}`, name, slug, description: '', iconType: slug, sortOrder: index, isActive: true,
}));
export const CATALOG_SUMMARY = { cards: CATALOG_PRODUCTS.length, variants: CATALOG_PRODUCTS.reduce((sum, product) => sum + (product.variants?.length || 1), 0) };
