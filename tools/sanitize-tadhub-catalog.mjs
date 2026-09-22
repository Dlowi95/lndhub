import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] || 'tadhub-catalog.tmp.json';
const outputPath = process.argv[3] || 'backend/data/tadhub-reference-2026-09-21.json';
const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const products = source.products.map((item) => ({
  id: item.id,
  categoryId: item.categoryId,
  name: item.name,
  price: Number(item.price || 0),
  promoPrice: item.promoPrice == null ? null : Number(item.promoPrice),
  promoActive: Boolean(item.promoActive),
  sheetStock: Number(item.sheetStock || 0),
  isActive: Boolean(item.isActive),
  soldCount: Number(item.soldCount || 0),
  warrantyDays: Number(item.warrantyDays || 0),
  manualDelivery: Boolean(item.manualDelivery),
  isHighlight: Boolean(item.isHighlight),
  requiresCustomerEmail: Boolean(item.requiresCustomerEmail),
  webAutoDelivery: Boolean(item.webAutoDelivery),
}));

const snapshot = {
  sourceUrl: 'https://www.tadhub.store/',
  sourceAsset: '/_next/static/chunks/app/page-ec09a54e58f10e4d.js',
  sourceState: 'Public API offline; extracted statically from the storefront fallback bundle without executing it.',
  capturedAt: '2026-09-21T00:00:00+07:00',
  productCount: products.length,
  products,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputPath, productCount: products.length }));
