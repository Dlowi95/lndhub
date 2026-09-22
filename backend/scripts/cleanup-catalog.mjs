import dns from 'node:dns';
import mongoose from 'mongoose';

try { process.loadEnvFile('.env'); } catch {}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gemini_hub';
if (uri.startsWith('mongodb+srv://')) dns.setServers(['1.1.1.1', '1.0.0.1']);

const apply = process.argv.includes('--apply');
const keepSlugs = [
  'chatgpt-personal',
  'chatgpt-shared',
  'chatgpt-k12',
  'chatgpt-business',
];

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const collection = db.collection('products');
const documents = await collection.find({}, { projection: { slug: 1, name: 1, category: 1, status: 1 } }).toArray();
const kept = documents.filter((item) => keepSlugs.includes(item.slug));
const removed = documents.filter((item) => !keepSlugs.includes(item.slug));
const byCategory = documents.reduce((result, item) => {
  const category = item.category || 'uncategorized';
  result[category] = (result[category] || 0) + 1;
  return result;
}, {});

const report = {
  mode: apply ? 'apply' : 'dry-run',
  totalBefore: documents.length,
  keep: kept.map((item) => item.slug),
  removeCount: removed.length,
  removeSample: removed.slice(0, 12).map((item) => ({ slug: item.slug, category: item.category })),
  byCategory,
};

if (!apply) {
  console.log(JSON.stringify(report, null, 2));
  console.log('Dry run only. Run `npm run catalog:cleanup` to back up and remove the listed records.');
  await mongoose.disconnect();
  process.exit(0);
}

let backupCollection = null;
if (removed.length) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  backupCollection = `products_cleanup_backup_${timestamp}`;
  const fullDocuments = await collection.find({ _id: { $in: removed.map((item) => item._id) } }).toArray();
  await db.collection(backupCollection).insertMany(fullDocuments);
  await collection.deleteMany({ _id: { $in: removed.map((item) => item._id) } });
}

const remaining = await collection.find({}, { projection: { slug: 1 } }).toArray();
console.log(JSON.stringify({ ...report, backupCollection, totalAfter: remaining.length, remaining: remaining.map((item) => item.slug) }, null, 2));
await mongoose.disconnect();
