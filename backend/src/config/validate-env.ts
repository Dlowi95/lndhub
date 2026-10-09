const REQUIRED_PRODUCTION_VALUES = [
  'MONGODB_URI',
  'CORS_ORIGINS',
  'GOOGLE_CLIENT_ID',
  'ADMIN_EMAILS',
  'ORDER_LOOKUP_SECRET',
  'GIFT_ENCRYPTION_KEY',
  'INVENTORY_ENCRYPTION_KEY',
  'DELIVERY_ENCRYPTION_KEY',
] as const;

const enabled = (value: unknown) => String(value || '').trim().toLowerCase() === 'true';

export function isAes256Key(value: unknown): boolean {
  const configured = String(value || '').trim();
  if (/^[0-9a-f]{64}$/i.test(configured)) return true;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(configured) || configured.length % 4 !== 0) return false;
  try {
    return Buffer.from(configured, 'base64').length === 32;
  } catch {
    return false;
  }
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = String(config.NODE_ENV || 'development').trim().toLowerCase();
  const trustProxyHops = Number(config.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
    throw new Error('TRUST_PROXY_HOPS phải là số nguyên từ 0 đến 10');
  }

  if (nodeEnv !== 'production') return config;

  const missing = REQUIRED_PRODUCTION_VALUES.filter((name) => !String(config[name] || '').trim());
  if (enabled(config.ENABLE_CHECKOUT)) {
    for (const name of ['BANK_ID', 'BANK_NAME', 'ACCOUNT_NO', 'ACCOUNT_NAME']) {
      if (!String(config[name] || '').trim()) missing.push(name as typeof REQUIRED_PRODUCTION_VALUES[number]);
    }
  }
  if (missing.length) throw new Error(`Thiếu biến môi trường production: ${[...new Set(missing)].join(', ')}`);

  const mongoUri = String(config.MONGODB_URI);
  if (/localhost|127\.0\.0\.1/i.test(mongoUri)) {
    throw new Error('MONGODB_URI production không được trỏ vào localhost');
  }

  const origins = String(config.CORS_ORIGINS).split(',').map((value) => value.trim()).filter(Boolean);
  if (origins.some((origin) => origin === '*' || !origin.startsWith('https://') || /localhost|127\.0\.0\.1/i.test(origin))) {
    throw new Error('CORS_ORIGINS production chỉ được chứa các origin HTTPS cụ thể');
  }

  if (enabled(config.ENABLE_PAYMENT_SIMULATION) || enabled(config.ENABLE_DEMO_SEED)) {
    throw new Error('Không được bật mô phỏng thanh toán hoặc demo seed trong production');
  }

  if (enabled(config.TRUST_CLOUDFLARE_HEADERS) && trustProxyHops < 1) {
    throw new Error('TRUST_CLOUDFLARE_HEADERS chỉ được bật khi TRUST_PROXY_HOPS đã cấu hình');
  }

  if (enabled(config.ENABLE_CHECKOUT) && !/^\d{6,19}$/.test(String(config.ACCOUNT_NO || '').trim())) {
    throw new Error('ACCOUNT_NO phải gồm 6 đến 19 chữ số');
  }

  const secretNames = ['ORDER_LOOKUP_SECRET', 'GIFT_ENCRYPTION_KEY', 'INVENTORY_ENCRYPTION_KEY', 'DELIVERY_ENCRYPTION_KEY'];
  const secrets = secretNames.map((name) => String(config[name] || '').trim());
  if (secrets.some((secret) => secret.length < 32)) {
    throw new Error('Các khóa mã hóa production phải dài tối thiểu 32 ký tự');
  }
  if (new Set(secrets).size !== secrets.length) {
    throw new Error('Mỗi chức năng production phải dùng một khóa mã hóa riêng');
  }
  if (!isAes256Key(config.GIFT_ENCRYPTION_KEY) || !isAes256Key(config.INVENTORY_ENCRYPTION_KEY)) {
    throw new Error('GIFT_ENCRYPTION_KEY và INVENTORY_ENCRYPTION_KEY phải là khóa AES-256 (64 ký tự hex hoặc base64 của 32 byte)');
  }

  return config;
}
