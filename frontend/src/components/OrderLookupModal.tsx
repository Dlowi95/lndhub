'use client';

import { Modal } from '@mantine/core';
import { AlertTriangle, BadgeCheck, Clock3, Copy, LoaderCircle, PackageCheck, Search, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { lookupOrder } from '../lib/api';
import { Order } from '../lib/types';

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, value || 0)) + 'đ';

export function OrderLookupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || orderCode) return;
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (!key?.startsWith('lndhub-active-order-')) continue;
      try {
        const saved = JSON.parse(window.sessionStorage.getItem(key) || '{}') as { orderCode?: string };
        if (saved.orderCode) {
          setOrderCode(saved.orderCode);
          break;
        }
      } catch {
        // Ignore stale browser data and let the customer enter the order code.
      }
    }
  }, [isOpen, orderCode]);

  const submitLookup = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedCode = orderCode.trim().toUpperCase();
    setOrder(null);
    setError('');
    if (!/^LH[0-9A-F]{12}$/.test(normalizedCode)) {
      setError('Mã đơn chưa đúng định dạng. Ví dụ: LH5894CC1CF2ED.');
      return;
    }
    const token = window.sessionStorage.getItem(`lndhub-order-${normalizedCode}`);
    if (!token) {
      setError('Thiết bị này không có mã tra cứu riêng của đơn. Hãy mở đúng trình duyệt đã tạo đơn hoặc liên hệ hỗ trợ.');
      return;
    }
    setLoading(true);
    try {
      setOrder(await lookupOrder(normalizedCode, token));
      setOrderCode(normalizedCode);
    } catch (lookupError) {
      setError((lookupError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const status = order?.fulfillmentStatus === 'FULFILLED'
    ? 'Đã giao hàng'
    : order?.paymentStatus === 'PAID'
      ? 'Đã nhận tiền · đang xử lý giao hàng'
      : order?.paymentStatus === 'EXPIRED'
        ? 'Đơn đã hết hạn'
        : order?.customerReportedPaidAt
          ? 'Đang chờ admin đối soát'
          : 'Đang chờ chuyển khoản';

  return (
    <Modal opened={isOpen} onClose={onClose} size="md" title={null} centered classNames={{ content: 'status-modal', body: 'status-modal__body' }}>
      <div className="status-modal__icon"><Search size={27} aria-hidden="true" /></div>
      <span className="section-kicker"><Clock3 size={14} aria-hidden="true" /> Theo dõi đơn hàng</span>
      <h2>Tra cứu trạng thái đơn</h2>
      <p>Nhập mã đơn trên đúng thiết bị đã tạo thanh toán. Dữ liệu giao hàng chỉ mở bằng mã tra cứu riêng được lưu trong trình duyệt này.</p>

      <form className="order-lookup-form" onSubmit={submitLookup}>
        <label htmlFor="order-code">Mã đơn hàng</label>
        <div>
          <input id="order-code" value={orderCode} onChange={(event) => setOrderCode(event.currentTarget.value.toUpperCase())} placeholder="LH5894CC1CF2ED" autoComplete="off" spellCheck={false} />
          <button type="submit" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Search size={18} />} Tra cứu</button>
        </div>
      </form>

      {error && <div className="order-lookup-error" role="alert"><AlertTriangle size={18} /> <span>{error}</span></div>}

      {order && <section className="order-lookup-result" aria-live="polite">
        <header><BadgeCheck size={21} aria-hidden="true" /><div><small>{order.orderCode}</small><strong>{status}</strong></div></header>
        <dl>
          <div><dt>Sản phẩm</dt><dd>{order.productName}{order.variantName ? ` · ${order.variantName}` : ''}</dd></div>
          <div><dt>Số lượng</dt><dd>×{order.quantity}</dd></div>
          <div><dt>Tổng tiền</dt><dd>{formatMoney(order.totalPrice)}</dd></div>
        </dl>
        {order.deliveryContent
          ? <div className="order-lookup-delivery"><PackageCheck size={19} /><strong>Thông tin nhận hàng</strong><pre>{order.deliveryContent}</pre><button type="button" onClick={async () => { await navigator.clipboard.writeText(order.deliveryContent || ''); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}><Copy size={15} /> {copied ? 'Đã sao chép' : 'Sao chép'}</button></div>
          : <div className="status-modal__note"><ShieldCheck size={18} /><span>{order.paymentStatus === 'EXPIRED' ? 'Không chuyển tiền vào QR cũ. Hãy mở lại sản phẩm để tạo mã thanh toán mới.' : 'Trang checkout tự cập nhật mỗi 5 giây. Admin chỉ giao hàng sau khi kiểm tra tiền thực tế vào tài khoản.'}</span></div>}
      </section>}

      <button type="button" onClick={onClose}>Đóng</button>
    </Modal>
  );
}
