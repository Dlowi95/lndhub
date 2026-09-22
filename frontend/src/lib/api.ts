import { Order, Product } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function apiJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { success?: boolean; data?: T; message?: string | string[] };
  if (!response.ok || payload.success === false || payload.data === undefined) {
    const message = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
    throw new Error(message || 'Yêu cầu không thành công');
  }
  return payload.data;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
  return apiJson<Product[]>(response);
}

export async function createCheckout(payload: {
  productId: string;
  variantId?: string;
  quantity?: number;
  customerEmail?: string;
  customerNote?: string;
  paymentMethod?: 'BANK_TRANSFER';
}, idempotencyKey: string): Promise<{ order: Order; lookupToken: string; idempotentReplay: boolean }> {
  const response = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  return apiJson(response);
}

export async function lookupOrder(orderCode: string, lookupToken: string): Promise<Order> {
  const params = new URLSearchParams({ token: lookupToken });
  const response = await fetch(`${API_BASE}/orders/lookup/${encodeURIComponent(orderCode)}?${params}`, {
    cache: 'no-store',
  });
  return apiJson<Order>(response);
}

export async function reportPayment(orderCode: string, lookupToken: string): Promise<Order> {
  const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderCode)}/report-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: lookupToken }),
  });
  return apiJson<Order>(response);
}
