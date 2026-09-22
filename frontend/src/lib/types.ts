export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: 'gemini-pro' | 'gemini-flash' | 'enterprise' | 'other' | string;
  description: string;
  features: string[];
  model: string;
  fulfillmentType?: 'MANUAL_SERVICE' | 'API_KEY';
  price: number;
  originalPrice: number;
  promotionEnabled?: boolean;
  discountPercent?: number;
  soldCount?: number;
  badge?: string;
  stockCount: number;
  inStock: boolean;
  iconType?: string;
  categoryLabel?: string;
  featured?: boolean;
  deliveryLabel?: string;
  variants?: ProductVariant[];
  information?: string[];
  activationSteps?: string[];
  warrantyNotes?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortOrder?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  promotionEnabled?: boolean;
  discountPercent?: number;
  stockCount: number;
  inStock: boolean;
  duration?: string;
  deliveryLabel?: string;
  sku?: string;
  sortOrder?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  iconType?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettings {
  _id?: string;
  telegramUrl: string;
  telegramHandle: string;
  telegramDescription: string;
  zaloUrl: string;
  zaloLabel: string;
  zaloDescription: string;
  contactEnabled: boolean;
  businessHoursEnabled: boolean;
  restStart: string;
  restEnd: string;
  timeZone: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  isActive: boolean;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StorefrontData {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  announcements: Announcement[];
}

export interface GiftCampaignStatus {
  enabled: boolean;
  title: string;
  description: string;
  cooldownHours: number;
  total: number;
  claimed: number;
  remaining: number;
  claimAvailable: boolean;
}

export interface GiftAdminItem {
  _id: string;
  preview: string;
  status: 'AVAILABLE' | 'CLAIMED';
  claimedAt?: string;
  createdAt: string;
}

export interface GiftAdminData extends GiftCampaignStatus {
  encryptionConfigured: boolean;
  items: GiftAdminItem[];
}

export interface GiftClaimResult {
  content: string;
  alreadyClaimed: boolean;
  claimedAt: string;
  expiresAt: string;
}

export interface Order {
  _id?: string;
  orderCode: string;
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerEmail?: string;
  customerNote?: string;
  status?: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  fulfillmentStatus: 'UNFULFILLED' | 'PROCESSING' | 'FULFILLED' | 'NEEDS_REVIEW' | 'FAILED';
  paymentMethod?: 'BANK_TRANSFER' | 'BINANCE_PAY' | 'USDT_BEP20' | 'PAYPAL';
  paymentTransferContent: string;
  vietQrUrl: string;
  bankId?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  customerReportedPaidAt?: string;
  deliveryContent?: string;
  deliveredKeys?: string[];
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
}

export interface AdminStats {
  totalOrders: number;
  paidOrdersCount: number;
  totalRevenue: number;
  totalProducts: number;
  availableKeysCount: number;
  recentOrders: Order[];
  publishedProductsCount?: number;
  draftProductsCount?: number;
  activeCategoriesCount?: number;
}
