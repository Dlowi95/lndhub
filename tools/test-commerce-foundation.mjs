import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { OrdersService } = require(path.join(root, 'backend/dist/modules/orders/orders.service.js'));
const { KeysService } = require(path.join(root, 'backend/dist/modules/keys/keys.service.js'));
const { FulfillmentStatus, PaymentStatus } = require(path.join(root, 'backend/dist/schemas/order.schema.js'));
const { FulfillmentType } = require(path.join(root, 'backend/dist/schemas/product.schema.js'));
const { KeyStatus } = require(path.join(root, 'backend/dist/schemas/api-key.schema.js'));

function queryResult(value) {
  return {
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    exec: async () => value,
  };
}

const savedOrders = [];
function OrderModel(data) {
  Object.assign(this, data);
  this._id = `order-${savedOrders.length + 1}`;
  this.createdAt = new Date();
  this.save = async () => {
    if (!savedOrders.includes(this)) savedOrders.push(this);
    return this;
  };
}
OrderModel.findOne = (filter) => {
  const item = savedOrders.find((order) => (
    (filter.orderCode && order.orderCode === filter.orderCode)
    || (filter.idempotencyKeyHash && order.idempotencyKeyHash === filter.idempotencyKeyHash)
  )) || null;
  return queryResult(item);
};
OrderModel.find = () => queryResult(savedOrders);
OrderModel.updateMany = (filter, update) => {
  for (const order of savedOrders) {
    const stale = order.paymentStatus === filter.paymentStatus
      && !order.customerReportedPaidAt
      && order.expiresAt <= filter.expiresAt.$lte;
    if (stale) {
      Object.assign(order, update.$set || {});
      if (update.$push?.auditTrail) order.auditTrail.push(update.$push.auditTrail);
    }
  }
  return queryResult({ acknowledged: true });
};

const tierProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Gemini Pro 18 tháng',
  slug: 'gemini-pro-18m',
  category: 'gemini',
  model: 'gemini-pro-18m',
  fulfillmentType: FulfillmentType.MANUAL_SERVICE,
  inStock: true,
  stockCount: 11,
  price: 59000,
  deliveryLabel: 'Kích hoạt vào email',
  warrantyNotes: ['Bảo hành theo chính sách tại thời điểm đặt'],
  variants: [
    { id: 'gemini-18m-x1', name: 'x1', price: 59000, stockCount: 11, inStock: true },
    { id: 'gemini-18m-x5', name: 'x5', price: 250000, stockCount: 11, inStock: true },
  ],
};
const products = { findById: async () => tierProduct };
let keyAssignments = 0;
const keys = { assignKeys: async () => { keyAssignments += 1; return ['secret']; } };
const configValues = {
  ORDER_LOOKUP_SECRET: 'commerce-test-secret-that-is-longer-than-thirty-two-characters',
  BANK_ID: 'MB',
  ACCOUNT_NO: '123456789',
  ACCOUNT_NAME: 'LNDHUB STORE',
  BANK_NAME: 'MB Bank',
  DELIVERY_ENCRYPTION_KEY: 'delivery-test-secret-that-is-longer-than-thirty-two-characters',
};
const config = { get: (name, fallback = '') => configValues[name] ?? fallback };
const orders = new OrdersService(OrderModel, products, keys, config);

const created = await orders.createOrder({
  productId: tierProduct._id,
  variantId: 'gemini-18m-x5',
  quantity: 5,
  customerEmail: 'buyer@example.com',
}, 'commerce-idempotency-key-0001');
assert.match(created.order.orderCode, /^LH[0-9A-F]{12}$/);
assert.equal(created.order.totalPrice, 250000);
assert.equal(created.order.unitPrice, 50000);
assert.equal(created.order.quantity, 5);
assert.equal(created.order.variantName, 'x5');
assert.ok(created.lookupToken.length >= 40);
assert.equal('deliveredKeys' in created.order, false);
const dynamicQrUrl = new URL(created.order.vietQrUrl);
assert.equal(dynamicQrUrl.hostname, 'img.vietqr.io');
assert.equal(dynamicQrUrl.searchParams.get('amount'), '250000');
assert.equal(dynamicQrUrl.searchParams.get('addInfo'), created.order.orderCode);
assert.equal(dynamicQrUrl.searchParams.get('accountName'), 'LNDHUB STORE');

const replay = await orders.createOrder({
  productId: tierProduct._id,
  variantId: 'gemini-18m-x5',
  quantity: 5,
}, 'commerce-idempotency-key-0001');
assert.equal(replay.order.orderCode, created.order.orderCode);
assert.equal(replay.lookupToken, created.lookupToken);
assert.equal(replay.idempotentReplay, true);
assert.equal(savedOrders.length, 1);

await assert.rejects(
  () => orders.createOrder({
    productId: tierProduct._id,
    variantId: 'gemini-18m-x5',
    quantity: 2,
  }, 'commerce-idempotency-key-0002'),
  /Số lượng không khớp/,
);

const lookedUp = await orders.lookupOrder(created.order.orderCode, created.lookupToken);
assert.equal(lookedUp.customerEmail, 'bu***@example.com');
assert.equal('deliveredKeys' in lookedUp, false);
await assert.rejects(() => orders.lookupOrder(created.order.orderCode, 'invalid-token-that-is-long-enough'), /không hợp lệ/);

const reported = await orders.reportPayment(created.order.orderCode, created.lookupToken);
assert.equal(reported.paymentStatus, PaymentStatus.PENDING);
assert.ok(reported.customerReportedPaidAt);

const paid = await orders.completeOrder(created.order.orderCode);
assert.equal(paid.paymentStatus, PaymentStatus.PAID);
assert.equal(paid.fulfillmentStatus, FulfillmentStatus.NEEDS_REVIEW);
assert.equal(keyAssignments, 0);

const fulfilled = await orders.fulfillOrder(created.order.orderCode, 'MANUAL-SECRET-KEY');
assert.equal(fulfilled.fulfillmentStatus, FulfillmentStatus.FULFILLED);
assert.notEqual(fulfilled.deliveryCiphertext, 'MANUAL-SECRET-KEY');
const deliveredLookup = await orders.lookupOrder(created.order.orderCode, created.lookupToken);
assert.equal(deliveredLookup.deliveryContent, 'MANUAL-SECRET-KEY');

const inventory = [
  { _id: 'key-1', key: 'KEY_ONE', model: 'api-model', status: KeyStatus.AVAILABLE, orderCode: '' },
  { _id: 'key-2', key: 'KEY_TWO', model: 'api-model', status: KeyStatus.AVAILABLE, orderCode: '' },
];
const inventoryModel = {
  find(filter) {
    const matches = inventory.filter((item) => item.orderCode === filter.orderCode && filter.status.$in.includes(item.status));
    return queryResult(matches);
  },
  findOneAndUpdate(filter, update) {
    const item = inventory.find((entry) => entry.model === filter.model && entry.status === filter.status);
    if (item) Object.assign(item, update.$set);
    return queryResult(item || null);
  },
  updateMany(filter, update) {
    const ids = filter._id?.$in || [];
    for (const item of inventory) {
      if (ids.includes(item._id) && (!filter.orderCode || item.orderCode === filter.orderCode) && (!filter.status || item.status === filter.status)) {
        if (update.$set) Object.assign(item, update.$set);
        if (update.$unset) for (const key of Object.keys(update.$unset)) delete item[key];
      }
    }
    return queryResult({ acknowledged: true });
  },
};
const keyService = new KeysService(inventoryModel, { get: () => 'false' });
const [firstAssignment, secondAssignment] = await Promise.all([
  keyService.assignKeys('api-model', 1, 'ORDER-A'),
  keyService.assignKeys('api-model', 1, 'ORDER-B'),
]);
assert.notEqual(firstAssignment[0], secondAssignment[0]);
assert.equal(new Set(inventory.filter((item) => item.status === KeyStatus.SOLD).map((item) => item.orderCode)).size, 2);

const clientApi = fs.readFileSync(path.join(root, 'frontend/src/lib/api.ts'), 'utf8');
assert.equal(clientApi.includes('mock_'), false);
assert.equal(clientApi.includes('Math.random'), false);
assert.equal(clientApi.includes('LiveGeminiPro'), false);

console.log(JSON.stringify({
  passed: true,
  assertions: [
    'server-side tier quote',
    'dynamic VietQR contains exact amount and transfer content',
    'cryptographic order code and private lookup token',
    'idempotent create order',
    'lookup privacy',
    'manual fulfillment separation',
    'customer payment report stays pending',
    'encrypted manual delivery requires lookup token',
    'atomic inventory assignment',
    'no client mock order or fake key',
  ],
}, null, 2));
