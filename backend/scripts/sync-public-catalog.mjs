import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

try { process.loadEnvFile('.env'); } catch {}

const SOURCE_URL = 'https://www.tadhub.store/api/products';
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const inputArg = args.find((item) => item.startsWith('--input='));
const snapshotArg = args.find((item) => item.startsWith('--snapshot-out='));
const inputPath = inputArg ? inputArg.slice('--input='.length) : '';
const snapshotOut = snapshotArg ? snapshotArg.slice('--snapshot-out='.length) : '';
const refreshCopy = args.includes('--refresh-copy');
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gemini_hub';

if (uri.startsWith('mongodb+srv://')) dns.setServers(['1.1.1.1', '1.0.0.1']);
if (apply && !inputPath) {
  throw new Error('Apply requires a reviewed snapshot. Run dry-run with --snapshot-out=... then apply with --input=...');
}

const categoryDefinitions = [
  ['ChatGPT', 'chatgpt'], ['Gemini', 'gemini'], ['Claude', 'claude'], ['Grok', 'grok'],
  ['YouTube', 'youtube'], ['Netflix', 'netflix'], ['VPN', 'vpn'], ['Spotify', 'spotify'],
  ['CapCut', 'capcut'], ['Canva', 'canva'], ['Adobe', 'adobe'], ['Office', 'office'],
  ['JetBrains', 'jetbrains'], ['iLovePDF', 'ilovepdf'], ['Leonardo AI', 'leonardo'],
  ['Autodesk', 'autodesk'], ['Duolingo', 'duolingo'], ['Khác', 'other'],
];

const categorySlugs = new Map(categoryDefinitions.map(([name, slug]) => [name.toLocaleLowerCase('vi'), slug]));
const groupSlugs = new Map([
  [1, 'chatgpt-personal'],
  [2, 'chatgpt-shared'],
  [3, 'chatgpt-k12'],
  [4, 'capcut-pro'],
  [5, 'canva-pro-edu'],
  [6, 'grok-super-1-thang'],
  [7, 'claude-team-premium-1-thang-bao-hanh-7-ngay'],
]);
const productSlugs = new Map([
  [7, 'youtube-premium'],
  [9, 'gemini-1y'],
  [10, 'gemini-18m'],
  [11, 'nordvpn'],
  [25, 'netflix-premium'],
  [26, 'chatgpt-business'],
  [28, 'nordvpn-3-thang-link-gift'],
  [52, 'leonardo-ai-credits'],
]);
const legacyVariantIds = new Map([
  [2, 'chatgpt-plus-kbh'],
  [3, 'chatgpt-free-250'],
  [6, 'chatgpt-plus-full'],
  [22, 'chatgpt-shared-slot'],
  [26, 'chatgpt-business-1m'],
  [31, 'chatgpt-k12-2028'],
  [70, 'chatgpt-free-json'],
]);
const legacySourceByVariantId = new Map([...legacyVariantIds.entries()].map(([sourceId, variantId]) => [variantId, sourceId]));

const slugify = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const safeName = (value, fallback) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
};

const sanitizeSource = (items) => ({
  sourceUrl: SOURCE_URL,
  capturedAt: new Date().toISOString(),
  productCount: items.length,
  products: items.map((item) => ({
    id: Number(item.id),
    name: safeName(item.name, 'Sản phẩm ' + item.id),
    categoryName: safeName(item.categoryName, 'Khác'),
    quantityPricingMode: item.quantityPricingMode === 'tiered' ? 'tiered' : 'standard',
    quantityTiers: Array.isArray(item.quantityTiers) ? item.quantityTiers
      .map((tier) => ({ quantity: Number(tier.quantity) }))
      .filter((tier) => Number.isInteger(tier.quantity) && tier.quantity > 1) : [],
    group: item.group ? {
      id: Number(item.group.id),
      name: safeName(item.group.name, 'Nhóm ' + item.group.id),
      sortOrder: Number(item.group.sortOrder || 0),
      isHighlight: Boolean(item.group.isHighlight),
    } : null,
    variant: item.variant ? {
      label: safeName(item.variant.label, item.name),
      sortOrder: Number(item.variant.sortOrder || 0),
      isActive: item.variant.isActive !== false,
    } : null,
  })),
});

const readSource = async () => {
  if (inputPath) return JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  const response = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'LNDHub-Catalog-Sync/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Public catalog request failed with HTTP ' + response.status);
  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : payload.products;
  if (!Array.isArray(items) || items.length < 30 || items.length > 100) {
    throw new Error('Unexpected public catalog size: ' + (Array.isArray(items) ? items.length : 'not-an-array'));
  }
  return sanitizeSource(items);
};

const source = await readSource();
if (!Array.isArray(source.products) || source.products.length !== Number(source.productCount)) {
  throw new Error('Invalid sanitized snapshot');
}
if (new Set(source.products.map((item) => item.id)).size !== source.products.length) {
  throw new Error('Duplicate source product id detected');
}

if (snapshotOut) {
  const target = path.resolve(snapshotOut);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(source, null, 2) + '\n', 'utf8');
}

const categoryFor = (item) => {
  if (/leonardo/i.test(item.name)) return ['leonardo', 'Leonardo AI'];
  const label = safeName(item.categoryName, 'Khác');
  return [categorySlugs.get(label.toLocaleLowerCase('vi')) || 'other', label];
};

const cardsByKey = new Map();
for (const item of source.products.filter((candidate) => candidate.variant?.isActive !== false)) {
  const key = item.group ? 'group-' + item.group.id : 'product-' + item.id;
  if (!cardsByKey.has(key)) {
    const [category, categoryLabel] = categoryFor(item);
    cardsByKey.set(key, {
      key,
      slug: item.group ? (groupSlugs.get(item.group.id) || slugify(item.group.name)) : (productSlugs.get(item.id) || slugify(item.name)),
      name: item.group ? item.group.name : item.name,
      category,
      categoryLabel,
      sourceItems: [],
      sourceOrder: item.group ? Number(item.group.sortOrder || 0) : Number(item.id),
    });
  }
  cardsByKey.get(key).sourceItems.push(item);
}

const cards = [...cardsByKey.values()]
  .map((card) => ({ ...card, sourceItems: card.sourceItems.sort((a, b) => Number(a.variant?.sortOrder || a.id) - Number(b.variant?.sortOrder || b.id)) }))
  .sort((a, b) => {
    const categoryA = categoryDefinitions.findIndex(([, slug]) => slug === a.category);
    const categoryB = categoryDefinitions.findIndex(([, slug]) => slug === b.category);
    return categoryA - categoryB || a.sourceOrder - b.sourceOrder || a.name.localeCompare(b.name, 'vi');
  });

if (source.productCount !== 47 || cards.length !== 36) {
  throw new Error('Reference guard failed: expected 47 SKU / 36 cards, received ' + source.productCount + ' SKU / ' + cards.length + ' cards');
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const productCollection = db.collection('products');
const categoryCollection = db.collection('categories');
const existingProducts = await productCollection.find({}).toArray();
const existingBySlug = new Map(existingProducts.map((item) => [item.slug, item]));
const existingBySourceKey = new Map(existingProducts.filter((item) => item.sourceKey).map((item) => [item.sourceKey, item]));

const sourceIdFromVariant = (variant) => {
  if (legacySourceByVariantId.has(variant.id)) return legacySourceByVariantId.get(variant.id);
  const match = String(variant.id || '').match(/^reference-(\d+)$/);
  return match ? Number(match[1]) : null;
};

const productSourceIds = (product) => {
  const ids = new Set(Array.isArray(product.sourceIds) ? product.sourceIds.map(Number) : []);
  for (const variant of product.variants || []) {
    const id = sourceIdFromVariant(variant);
    if (id) ids.add(id);
  }
  for (const card of cards) {
    if (card.slug === product.slug) card.sourceItems.forEach((item) => ids.add(item.id));
  }
  return [...ids].filter(Number.isFinite);
};

const commercialBySourceId = new Map();
for (const product of existingProducts) {
  for (const variant of product.variants || []) {
    const sourceId = sourceIdFromVariant(variant);
    if (sourceId && !commercialBySourceId.has(sourceId)) commercialBySourceId.set(sourceId, variant);
  }
}

const descriptionsBySlug = new Map(Object.entries({
  'chatgpt-personal': 'Nhóm ChatGPT Plus cá nhân 1 tháng và Codex, gồm nhiều lựa chọn bảo hành để quản trị viên cấu hình và công bố riêng.',
  'chatgpt-shared': 'ChatGPT Plus dùng chung theo từng loại slot. Mỗi lựa chọn được quản lý độc lập về giá, tồn kho và trạng thái bán.',
  'chatgpt-k12': 'Các lựa chọn ChatGPT Plus K12 theo thời hạn hiển thị trong từng SKU. Khách cần chọn đúng gói trước khi tạo đơn.',
  'chatgpt-business': 'ChatGPT Business 1 tháng theo slot. Sản phẩm chỉ được mở bán khi quản trị viên xác nhận còn suất.',
  'gemini-18m': 'Gói Gemini Pro 18 tháng được thêm vào email Google của khách. Hệ thống hỗ trợ các mức số lượng do quản trị viên cấu hình.',
  'gemini-1y': 'Tài khoản Gemini Pro 1 năm được cấp theo thông tin của từng đơn hàng. Trạng thái và hướng dẫn nhận hàng được công bố khi mở bán.',
  'youtube-premium': 'YouTube Premium 1 tháng theo hình thức nâng cấp chính chủ. Điều kiện tài khoản và thời gian xử lý được ghi rõ trước khi thanh toán.',
  'netflix-premium': 'Netflix Premium 4K trong 1 tháng, hỗ trợ đầy đủ nhóm thiết bị theo cấu hình sản phẩm được quản trị viên công bố.',
  'spotify-premium-3-thang-cap-tai-khoan': 'Spotify Premium 3 tháng theo hình thức cấp tài khoản. Thông tin nhận hàng và phạm vi bảo hành được hiển thị theo từng đơn.',
  'nordvpn': 'NordVPN 1 tháng theo hình thức cấp tài khoản. Khách kiểm tra thời hạn và hướng dẫn sử dụng trước khi đặt hàng.',
  'nordvpn-3-thang-link-gift': 'NordVPN 3 tháng qua liên kết quà tặng. Sản phẩm chỉ mở bán sau khi quản trị viên xác nhận khả dụng.',
  'grok-super-1-thang': 'Nhóm Grok Super với các lựa chọn được tách thành SKU riêng để quản lý thời hạn, giá và tồn kho chính xác.',
  'grok-free': 'Tài khoản Grok Free theo cấu hình công bố tại thời điểm mở bán. Khách xem kỹ nội dung bàn giao trước khi tạo đơn.',
  'grok-free-json-account-co-model-4-6': 'Gói Grok Free kèm dữ liệu JSON và tài khoản theo tên model công bố. Hướng dẫn nhận hàng được quản trị viên bổ sung trước khi bán.',
  'claude-team-standard-1-thang-bao-hanh-7-ngay': 'Claude Team Standard 1 tháng, bảo hành 7 ngày theo điều kiện được công bố trong chi tiết sản phẩm.',
  'claude-team-premium-1-thang-bao-hanh-7-ngay': 'Claude Team 1 tháng với các lựa chọn trong cùng nhóm. Giá, tồn kho và chính sách được quản lý riêng theo từng SKU.',
  'claude-pro-1-thang-chinh-chu-het': 'Claude Pro 1 tháng theo hình thức chính chủ. Sản phẩm được giữ ở trạng thái hết hàng cho tới khi quản trị viên mở bán lại.',
  'claude-pro-max-x20-nang-cap-chinh-chu-khong-bh': 'Claude Pro Max x20 theo hình thức nâng cấp chính chủ, không bảo hành. Điều kiện tài khoản sẽ được nêu rõ trước khi mở bán.',
  'claude-pro-max-x20-cap-tai-khoan-khong-bh': 'Claude Pro Max x20 theo hình thức cấp tài khoản, không bảo hành. Thông tin bàn giao được hiển thị trong chi tiết đơn hàng.',
  'capcut-pro': 'Nhóm CapCut Pro gồm các lựa chọn theo hình thức và thời hạn khác nhau. Mỗi SKU có giá và tồn kho riêng.',
  'canva-pro-edu': 'Nhóm Canva Pro và Canva Edu với nhiều lựa chọn sử dụng. Khách chọn đúng SKU theo nhu cầu trước khi đặt hàng.',
  'adobe-express-premium-12-thang-link-gift': 'Adobe Express Premium 12 tháng qua liên kết quà tặng. Điều kiện kích hoạt được công bố trong hướng dẫn sản phẩm.',
  'adobe-creative-cloud-1-thang-cap-tai-khoan': 'Adobe Creative Cloud 1 tháng theo hình thức cấp tài khoản. Danh sách ứng dụng và chính sách được nêu khi sản phẩm mở bán.',
  'adobe-full-app-2thang-bh-7d': 'Adobe Full App 2 tháng, bảo hành 7 ngày theo điều kiện của sản phẩm tại thời điểm đặt hàng.',
  'adobe-cc-pro-1-thang-bao-hanh-full': 'Adobe CC Pro 1 tháng với chính sách bảo hành đầy đủ theo nội dung được quản trị viên công bố.',
  'adobe-creative-cloud-3-thang-khong-bao-hanh': 'Adobe Creative Cloud 3 tháng, không bảo hành. Khách cần xem kỹ điều kiện sử dụng trước khi tạo đơn.',
  'adobe-creative-cloud-trial-14-ngay-bao-hanh-7-ngay': 'Adobe Creative Cloud Trial 14 ngày, bảo hành 7 ngày theo điều kiện hiển thị trong chi tiết sản phẩm.',
  'microsoft-365-ca-nhan-1-nam-win-mac': 'Microsoft 365 cá nhân 1 năm dành cho Windows và macOS. Hình thức bàn giao được xác nhận trước khi mở bán.',
  'key-microsoft-office-2024-pro-plus-vinh-vien': 'Khóa Microsoft Office 2024 Pro Plus vĩnh viễn theo phạm vi kích hoạt được công bố trong chi tiết sản phẩm.',
  'office-365-100gb-5-thiet-bi-6-nam-bh2-nam': 'Office 365 dung lượng 100GB, hỗ trợ 5 thiết bị trong thời hạn công bố và bảo hành 2 năm theo điều kiện sản phẩm.',
  'key-windows-10-11-pro-chinh-hang-vinh-vien-1-pc': 'Khóa Windows 10/11 Pro vĩnh viễn cho 1 PC theo phạm vi kích hoạt được công bố trước khi bán.',
  'leonardo-ai-credits': 'Leonardo AI với 8.500 credits trong 1 tháng. Sản phẩm được quản lý riêng về tồn kho và hình thức bàn giao.',
  'jetbrains-edu-pack-12-thang': 'JetBrains Edu Pack 12 tháng theo cấu hình sản phẩm được công bố. Khách kiểm tra phạm vi sử dụng trước khi đặt hàng.',
  'ilovepdf-premium-1-nam': 'iLovePDF Premium 1 năm theo hình thức bàn giao được quản trị viên xác nhận trước khi mở bán.',
  'autodesk-1-nam': 'Autodesk 1 năm theo cấu hình và phạm vi ứng dụng ghi trong chi tiết sản phẩm.',
  'duolingo-super-12-thang': 'Duolingo Super 12 tháng theo hình thức bàn giao được công bố tại thời điểm sản phẩm mở bán.',
}));
const missingDescriptionSlugs = cards.filter((card) => !descriptionsBySlug.has(card.slug)).map((card) => card.slug);
if (missingDescriptionSlugs.length) {
  throw new Error('Missing LNDHub product summaries for: ' + missingDescriptionSlugs.join(', '));
}

const genericContent = (card) => ({
  description: descriptionsBySlug.get(card.slug) || (card.name + '. Các lựa chọn, giá, tồn kho và trạng thái bán do quản trị viên LNDHub cấu hình riêng.'),
  features: [
    'Các lựa chọn được tách thành SKU để quản lý độc lập',
    'Giá và khuyến mãi chỉ thay đổi khi quản trị viên LNDHub lưu',
    'Sản phẩm mới ở trạng thái bản nháp cho tới khi được kiểm tra',
  ],
  information: [
    'Đọc kỹ tên lựa chọn, thời hạn và hình thức nhận trước khi mở bán.',
    'Không yêu cầu khách cung cấp mật khẩu, cookie phiên hoặc mã 2FA.',
  ],
  activationSteps: [
    'Quản trị viên kiểm tra model và cấu hình giá.',
    'Bổ sung hướng dẫn nhận hàng phù hợp trước khi xuất bản.',
  ],
  warrantyNotes: [
    'Chính sách bảo hành được cấu hình riêng cho từng sản phẩm.',
    'Không tự động sao chép cam kết hoặc chính sách từ nguồn tham khảo.',
  ],
});

const makeStandardVariants = (card, canonical) => card.sourceItems.map((item, index) => {
  const variantId = legacyVariantIds.get(item.id) || 'reference-' + item.id;
  const localMatch = (canonical?.variants || []).find((variant) => variant.id === variantId);
  const preserved = localMatch || commercialBySourceId.get(item.id);
  return {
    id: variantId,
    name: safeName(item.variant?.label, item.name),
    sku: preserved?.sku || '',
    price: Number(preserved?.price || 0),
    originalPrice: Number(preserved?.originalPrice || 0),
    promotionEnabled: Boolean(preserved?.promotionEnabled),
    discountPercent: Number(preserved?.discountPercent || 0),
    stockCount: Number(preserved?.stockCount || 0),
    inStock: Boolean(preserved?.inStock && Number(preserved?.price || 0) > 0),
    duration: preserved?.duration || '',
    deliveryLabel: preserved?.deliveryLabel || '',
    sortOrder: Number(item.variant?.sortOrder ?? index),
  };
});

const makeGeminiTiers = (item, canonical) => {
  const quantities = [1, ...item.quantityTiers.map((tier) => tier.quantity)];
  return quantities.map((quantity, index) => {
    const id = 'gemini-18m-x' + quantity;
    const preserved = (canonical?.variants || []).find((variant) => variant.id === id);
    return {
      id,
      name: 'x' + quantity,
      sku: preserved?.sku || '',
      price: Number(preserved?.price || 0),
      originalPrice: Number(preserved?.originalPrice || 0),
      promotionEnabled: Boolean(preserved?.promotionEnabled),
      discountPercent: Number(preserved?.discountPercent || 0),
      stockCount: Number(preserved?.stockCount || 0),
      inStock: Boolean(preserved?.inStock && Number(preserved?.price || 0) > 0),
      duration: preserved?.duration || '',
      deliveryLabel: preserved?.deliveryLabel || '',
      sortOrder: index,
    };
  });
};

const planned = cards.map((card, cardIndex) => {
  const canonical = existingBySourceKey.get(card.key) || existingBySlug.get(card.slug);
  const generic = genericContent(card);
  const variants = card.slug === 'gemini-18m'
    ? makeGeminiTiers(card.sourceItems[0], canonical)
    : makeStandardVariants(card, canonical);
  const sourceIds = card.sourceItems.map((item) => item.id);
  const isNew = !canonical;
  return {
    card,
    canonical,
    isNew,
    document: {
      name: card.name,
      slug: card.slug,
      category: card.category,
      categoryLabel: card.categoryLabel,
      description: refreshCopy || isNew ? generic.description : (canonical?.description || generic.description),
      features: canonical?.features?.length ? canonical.features : generic.features,
      information: canonical?.information?.length ? canonical.information : generic.information,
      activationSteps: canonical?.activationSteps?.length ? canonical.activationSteps : generic.activationSteps,
      warrantyNotes: canonical?.warrantyNotes?.length ? canonical.warrantyNotes : generic.warrantyNotes,
      model: canonical?.model || card.key,
      iconType: canonical?.iconType || card.category,
      deliveryLabel: canonical?.deliveryLabel || '',
      price: Number(canonical?.price || 0),
      originalPrice: Number(canonical?.originalPrice || 0),
      promotionEnabled: Boolean(canonical?.promotionEnabled),
      discountPercent: Number(canonical?.discountPercent || 0),
      stockCount: Number(canonical?.stockCount || 0),
      inStock: Boolean(canonical?.inStock && Number(canonical?.price || 0) > 0),
      soldCount: Number(canonical?.soldCount || 0),
      featured: Boolean(canonical?.featured),
      badge: canonical?.badge || '',
      status: canonical?.status || 'DRAFT',
      sortOrder: Number.isFinite(canonical?.sortOrder) ? canonical.sortOrder : cardIndex,
      variants,
      sourceProvider: 'tadhub-public-reference',
      sourceKey: card.key,
      sourceIds,
      sourceSyncedAt: new Date(source.capturedAt),
    },
  };
});

const targetSlugBySourceId = new Map();
for (const item of planned) item.document.sourceIds.forEach((sourceId) => targetSlugBySourceId.set(sourceId, item.document.slug));
const canonicalIds = new Set(planned.filter((item) => item.canonical).map((item) => String(item.canonical._id)));
const staleProducts = existingProducts.filter((product) => {
  if (canonicalIds.has(String(product._id)) || product.status === 'ARCHIVED') return false;
  const sourceIds = productSourceIds(product);
  if (!sourceIds.length) return false;
  return sourceIds.every((sourceId) => !targetSlugBySourceId.has(sourceId) || targetSlugBySourceId.get(sourceId) !== product.slug);
});

const categoryCounts = planned.reduce((result, item) => {
  result[item.document.category] = (result[item.document.category] || 0) + 1;
  return result;
}, {});
const report = {
  mode: apply ? 'apply' : 'dry-run',
  sourceUrl: source.sourceUrl,
  capturedAt: source.capturedAt,
  sourceSkuCount: source.productCount,
  targetCardCount: planned.length,
  existingProductCount: existingProducts.length,
  newDrafts: planned.filter((item) => item.isNew).map((item) => ({ slug: item.document.slug, name: item.document.name, category: item.document.category })),
  updateCount: planned.filter((item) => !item.isNew).length,
  archiveCandidates: staleProducts.map((item) => ({ slug: item.slug, name: item.name, sourceIds: productSourceIds(item) })),
  categoryCounts,
  commercialPolicy: 'Preserve existing product and SKU price/sale/stock/status. New cards and SKU start at zero in DRAFT.',
  copyPolicy: refreshCopy ? 'Refresh LNDHub-authored product summaries; future syncs preserve admin edits.' : 'Preserve admin-edited product summaries; create LNDHub-authored copy for new cards.',
  snapshotWritten: snapshotOut ? path.resolve(snapshotOut) : null,
};

if (apply) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const productBackup = 'products_catalog_sync_backup_' + stamp;
  const categoryBackup = 'categories_catalog_sync_backup_' + stamp;
  const categoriesBefore = await categoryCollection.find({}).toArray();
  if (existingProducts.length) await db.collection(productBackup).insertMany(existingProducts);
  if (categoriesBefore.length) await db.collection(categoryBackup).insertMany(categoriesBefore);

  for (const [index, [name, slug]] of categoryDefinitions.entries()) {
    await categoryCollection.updateOne(
      { slug },
      {
        $setOnInsert: { name, slug, description: '', iconType: slug, sortOrder: index, isActive: true, createdAt: now },
        $set: { updatedAt: now },
      },
      { upsert: true },
    );
  }

  for (const item of planned) {
    if (item.canonical) {
      await productCollection.updateOne({ _id: item.canonical._id }, { $set: { ...item.document, updatedAt: now } });
    } else {
      await productCollection.insertOne({ ...item.document, createdAt: now, updatedAt: now });
    }
  }
  if (staleProducts.length) {
    await productCollection.updateMany(
      { _id: { $in: staleProducts.map((item) => item._id) } },
      { $set: { status: 'ARCHIVED', updatedAt: now, archivedReason: 'public-catalog-sync' } },
    );
  }

  report.backupCollections = { products: productBackup, categories: categoryBackup };
  report.totalAfter = await productCollection.countDocuments({ status: { $ne: 'ARCHIVED' } });
  report.publishedAfter = await productCollection.countDocuments({ status: 'PUBLISHED' });
  report.draftAfter = await productCollection.countDocuments({ status: 'DRAFT' });
}

console.log(JSON.stringify(report, null, 2));
await mongoose.disconnect();
