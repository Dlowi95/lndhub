'use client';

import { Accordion, Modal } from '@mantine/core';
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock3, Copy, CreditCard, Gift, Info, Landmark, LoaderCircle, Minus, PackageCheck, Plus, Rocket, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { createCheckout, lookupOrder, reportPayment } from '../lib/api';
import { Order, Product, ProductVariant } from '../lib/types';
import { StoreAvailability } from '../lib/store-hours';
import { CategoryIcon } from './CategoryIcon';

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, value || 0)) + 'đ';

const getVariantQuantity = (variant?: ProductVariant) => {
  if (!variant) return null;
  const nameMatch = variant.name.trim().match(/^x\s*(\d+)$/i);
  const idMatch = variant.id.match(/-x(\d+)$/i);
  const parsed = Number(nameMatch?.[1] || idMatch?.[1] || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export function CheckoutModal({ product, availability, onClose }: { product: Product | null; availability: StoreAvailability; onClose: () => void }) {
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quantityDraft, setQuantityDraft] = useState('1');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [lookupToken, setLookupToken] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [copied, setCopied] = useState('');
  const [qrImageFailed, setQrImageFailed] = useState(false);

  useEffect(() => {
    const firstVariant = product?.variants?.[0];
    setVariantId(firstVariant?.id || '');
    const initialQuantity = getVariantQuantity(firstVariant) || 1;
    setQuantity(initialQuantity);
    setQuantityDraft(String(initialQuantity));
    setCustomerEmail('');
    setCustomerNote('');
    setOrder(null);
    setLookupToken('');
    setConfirming(false);
    setCheckoutError('');
    setQrImageFailed(false);
    if (typeof window !== 'undefined') {
      const bytes = new Uint8Array(18);
      window.crypto.getRandomValues(bytes);
      setIdempotencyKey(Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join(''));
    }
  }, [product]);

  useEffect(() => {
    if (!order || !lookupToken || order.fulfillmentStatus === 'FULFILLED' || order.paymentStatus === 'EXPIRED') return;
    const timer = window.setInterval(async () => {
      try {
        const updated = await lookupOrder(order.orderCode, lookupToken);
        setOrder(updated);
      } catch {
        // Keep the current receipt visible during a temporary network interruption.
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [order, lookupToken]);

  const tierVariants = useMemo(() => {
    const variants = product?.variants || [];
    return variants
      .map((variant) => ({ variant, quantity: getVariantQuantity(variant) }))
      .filter((item): item is { variant: ProductVariant; quantity: number } => item.quantity !== null)
      .sort((a, b) => a.quantity - b.quantity);
  }, [product]);

  const isQuantityTierProduct = Boolean(product?.variants?.length && product.variants.length > 1 && tierVariants.length === product.variants.length);
  const selectedVariant = useMemo(
    () => product?.variants?.find((item) => item.id === variantId) || product?.variants?.[0],
    [product, variantId],
  );

  if (!product) return null;

  const activeTier = isQuantityTierProduct ? tierVariants.find((item) => item.quantity === quantity) : undefined;
  const baseTier = isQuantityTierProduct ? (tierVariants.find((item) => item.quantity === 1) || tierVariants[0]) : undefined;
  const variant = activeTier?.variant || selectedVariant;
  const baseUnitPrice = baseTier ? baseTier.variant.price / baseTier.quantity : (selectedVariant?.price || product.price);
  const total = isQuantityTierProduct
    ? (activeTier?.variant.price || baseUnitPrice * quantity)
    : (selectedVariant?.price || product.price) * quantity;
  const unitPrice = quantity > 0 ? total / quantity : total;
  const originalTotal = isQuantityTierProduct
    ? (activeTier?.variant.originalPrice || (baseTier?.variant.originalPrice || 0) * quantity)
    : (selectedVariant?.originalPrice || product.originalPrice || 0) * quantity;
  const hasSale = Boolean((variant?.promotionEnabled || product.promotionEnabled) && originalTotal > total && total > 0);
  const priceText = total > 0 ? formatMoney(total) : 'Chờ cập nhật';
  const isAvailable = variant ? variant.inStock : product.inStock;
  const availableQuantityOptions = isQuantityTierProduct ? tierVariants.map((item) => item.quantity) : [1, 2, 5, 10];
  const productVariants = product.variants || [];
  const showVariantSelector = !isQuantityTierProduct && productVariants.length > 1;
  const informationItems = (product.information?.length ? product.information : product.features?.length ? product.features : [product.description]).filter(Boolean);
  const sections = [
    { value: 'information', icon: Info, title: 'Thông tin sản phẩm', items: informationItems },
    { value: 'activation', icon: Rocket, title: 'Cách kích hoạt', items: (product.activationSteps || []).filter(Boolean) },
    { value: 'warranty', icon: ShieldCheck, title: 'Chính sách bảo hành', items: (product.warrantyNotes || []).filter(Boolean) },
  ].filter((section) => section.items.length > 0);

  const selectQuantity = (value: number) => {
    const safeValue = Math.max(1, Math.min(100, value));
    setQuantity(safeValue);
    setQuantityDraft(String(safeValue));
    const matchingTier = tierVariants.find((item) => item.quantity === safeValue);
    if (matchingTier) setVariantId(matchingTier.variant.id);
    else if (baseTier) setVariantId(baseTier.variant.id);
  };

  const copyText = async (label: string, value?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1400);
  };

  const startCheckout = async () => {
    setSubmitting(true);
    setCheckoutError('');
    try {
      const result = await createCheckout({
        productId: product._id,
        variantId: variant?.id,
        quantity,
        customerEmail: customerEmail.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
        paymentMethod: 'BANK_TRANSFER',
      }, idempotencyKey);
      setOrder(result.order);
      setLookupToken(result.lookupToken);
      setQrImageFailed(false);
      window.sessionStorage.setItem(`lndhub-order-${result.order.orderCode}`, result.lookupToken);
      setConfirming(false);
      window.setTimeout(() => document.querySelector('.bank-transfer-sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (error) {
      const message = (error as Error).message;
      const isNetworkError = error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(message);
      setCheckoutError(
        message.includes('not available')
          ? 'Thanh toán đang được quản trị viên khóa an toàn. Vui lòng thử lại sau.'
          : isNetworkError
            ? 'Không kết nối được máy chủ thanh toán. Vui lòng đợi vài giây rồi bấm tạo mã chuyển khoản lại.'
            : message,
      );
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  const notifyTransferred = async () => {
    if (!order || !lookupToken) return;
    setSubmitting(true);
    setCheckoutError('');
    try {
      setOrder(await reportPayment(order.orderCode, lookupToken));
    } catch (error) {
      setCheckoutError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={Boolean(product)}
      onClose={onClose}
      size="min(900px, calc(100vw - 24px))"
      padding={0}
      title={null}
      centered
      overlayProps={{ backgroundOpacity: 0.72, blur: 10 }}
      closeButtonProps={{ 'aria-label': 'Đóng chi tiết sản phẩm' }}
      classNames={{ content: 'product-modal', body: 'product-modal__body', header: 'product-modal__header' }}
    >
      <div className="modal-product-summary">
        <span className={'product-logo product-logo--' + product.category}><CategoryIcon category={product.category} size={27} /></span>
        <div className="modal-summary-copy">
          <div className="modal-eyebrow"><span>{product.categoryLabel}</span><i aria-hidden="true" /><small>{isAvailable ? 'Còn hàng' : 'Hết hàng'}</small></div>
          <h2>{product.name}</h2>
          <p>{variant?.deliveryLabel || product.deliveryLabel || product.description}</p>
        </div>
        <div className="modal-price" aria-live="polite">
          <span>Tổng dự kiến</span>
          <strong>{priceText}</strong>
          {hasSale && <del>{formatMoney(originalTotal)}</del>}
          <small>{quantity} × {unitPrice > 0 ? formatMoney(unitPrice) : 'chưa có giá'}</small>
        </div>
      </div>

      <div className="modal-content">
        <section className="modal-section modal-section--details">
          <div className="modal-section__heading">
            <Sparkles size={19} aria-hidden="true" />
            <div><h3>Những điều cần biết</h3><p>Kiểm tra thông tin, kích hoạt và bảo hành trước khi đặt hàng.</p></div>
          </div>
          <Accordion variant="separated" radius="lg" defaultValue="information" className="product-accordion">
            {sections.map(({ value, icon: Icon, title, items }) => (
              <Accordion.Item value={value} key={value} className={'product-accordion__item product-accordion__item--' + value}>
                <Accordion.Control icon={<Icon size={18} aria-hidden="true" />}>{title}</Accordion.Control>
                <Accordion.Panel><ul>{items.map((item, index) => <li key={item + index}>{item}</li>)}</ul></Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </section>

        {showVariantSelector && (
          <section className="variant-selector" aria-labelledby="variant-selector-title">
            <div className="variant-selector__title"><PackageCheck size={19} aria-hidden="true" /><div><strong id="variant-selector-title">Lựa chọn sản phẩm</strong><span>Giá và tồn kho được quản lý riêng theo từng lựa chọn.</span></div></div>
            <div className="variant-grid" role="radiogroup" aria-label="Lựa chọn sản phẩm">
              {productVariants.map((item) => (
                <button key={item.id} type="button" className="variant-option" role="radio" aria-checked={variant?.id === item.id} onClick={() => setVariantId(item.id)} disabled={!item.inStock}>
                  <span>{item.name}</span>
                  <strong>{item.price > 0 ? formatMoney(item.price) : 'Chờ giá'}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="coupon-preview">
          <span className="coupon-preview__icon"><Gift size={19} aria-hidden="true" /></span>
          <div><strong>Mã giảm giá</strong><span>Sẽ được mở cùng hệ thống thanh toán chính thức.</span></div>
          <span className="soon-badge">Sắp có</span>
        </section>

        <section className="modal-section modal-section--quantity">
          <div className="modal-section__heading">
            <span>1</span>
            <div><h3>Số lượng</h3><p>Chọn nhanh mức có sẵn hoặc nhập số lượng mong muốn.</p></div>
          </div>
          <div className="quantity-presets" role="radiogroup" aria-label="Chọn số lượng">
            {availableQuantityOptions.map((value) => {
              const tier = tierVariants.find((item) => item.quantity === value);
              const optionTotal = tier?.variant.price || baseUnitPrice * value;
              const optionUnit = value > 0 ? optionTotal / value : optionTotal;
              return (
                <button type="button" key={value} role="radio" aria-checked={quantity === value} onClick={() => selectQuantity(value)}>
                  <strong>×{value}</strong>
                  <span>{optionTotal > 0 ? formatMoney(optionTotal) : 'Chờ giá'}</span>
                  {value > 1 && optionUnit > 0 && <small>{formatMoney(optionUnit)}/cái</small>}
                </button>
              );
            })}
          </div>
          <div className="quantity-stepper">
            <button type="button" onClick={() => selectQuantity(quantity - 1)} aria-label="Giảm số lượng"><Minus size={18} aria-hidden="true" /></button>
            <label><span>Nhập số lượng</span><input type="number" min={1} max={100} value={quantityDraft} onChange={(event) => { const next = event.currentTarget.value; setQuantityDraft(next); if (next !== '') selectQuantity(Number(next)); }} onBlur={() => selectQuantity(Number(quantityDraft) || 1)} /></label>
            <button type="button" onClick={() => selectQuantity(quantity + 1)} aria-label="Tăng số lượng"><Plus size={18} aria-hidden="true" /></button>
          </div>
          <div className="quantity-summary"><BadgeCheck size={17} aria-hidden="true" /><span>Đang chọn <strong>×{quantity}</strong></span><span className="quantity-summary__price">{priceText}</span></div>
        </section>

        {!order && (
          <section className="modal-section payment-method-section" aria-labelledby="payment-method-title">
            <div className="modal-section__heading">
              <span>2</span>
              <div><h3 id="payment-method-title">Phương thức thanh toán</h3><p>Chuyển khoản ngân hàng được mở trước; các kênh quốc tế sẽ bổ sung sau khi kiểm thử.</p></div>
            </div>
            <div className="checkout-contact-grid">
              <label><span>Email nhận thông báo <small>(không bắt buộc)</small></span><input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.currentTarget.value)} placeholder="ban@example.com" /></label>
              <label><span>Ghi chú cho admin <small>(không bắt buộc)</small></span><input value={customerNote} onChange={(event) => setCustomerNote(event.currentTarget.value)} maxLength={500} placeholder="Thông tin cần lưu ý..." /></label>
            </div>
            <div className="payment-method-grid" role="radiogroup" aria-label="Phương thức thanh toán">
              <button type="button" role="radio" aria-checked="true" className="payment-method-card payment-method-card--active">
                <Landmark size={22} /><strong>Chuyển khoản</strong><small>VND · VietQR</small><BadgeCheck size={16} className="payment-method-card__check" />
              </button>
              <button type="button" disabled className="payment-method-card"><WalletCards size={22} /><strong>Binance Pay</strong><small>USDT · Sắp mở</small></button>
              <button type="button" disabled className="payment-method-card"><CreditCard size={22} /><strong>USDT BEP20</strong><small>BSC · Sắp mở</small></button>
              <button type="button" disabled className="payment-method-card"><CreditCard size={22} /><strong>PayPal</strong><small>USD · Sắp mở</small></button>
            </div>
            <div className="payment-safety-note"><ShieldCheck size={18} /><span>Đơn chỉ được xác nhận khi admin hoặc webhook ngân hàng kiểm tra đúng số tiền và đúng mã chuyển khoản.</span></div>
          </section>
        )}

        {order && (
          <section className="bank-transfer-sheet" aria-live="polite">
            <header>
              <span><CheckCircle2 size={22} /></span>
              <div><small>Đơn đã được tạo</small><h3>{order.orderCode}</h3><p>Chuyển chính xác số tiền và nội dung bên dưới để đối soát.</p></div>
              <button type="button" onClick={() => void copyText('order', order.orderCode)}><Copy size={15} /> {copied === 'order' ? 'Đã chép' : 'Chép mã'}</button>
            </header>

            <div className="bank-payment-status">
              <strong>{order.fulfillmentStatus === 'FULFILLED' ? 'Đã giao hàng' : order.paymentStatus === 'PAID' ? 'Đã nhận tiền · đang giao hàng' : order.customerReportedPaidAt ? 'Đang chờ admin kiểm tra giao dịch' : 'Đang chờ chuyển khoản'}</strong>
              <span>{order.fulfillmentStatus === 'FULFILLED' ? 'Nội dung giao hàng đã được mở khóa bên dưới.' : order.customerReportedPaidAt ? 'Trang tự cập nhật mỗi 5 giây, anh không cần tải lại.' : 'Đơn có hiệu lực trong 30 phút.'}</span>
            </div>

            <div className="bank-qr">
              <Image
                src={!qrImageFailed && order.vietQrUrl ? order.vietQrUrl : '/images/payment-bank-qr.png'}
                alt={`Mã QR chuyển khoản cho đơn ${order.orderCode}`}
                width={520}
                height={520}
                priority
                unoptimized={Boolean(order.vietQrUrl)}
                onError={() => setQrImageFailed(true)}
              />
              <p className="mt-2 text-center text-[9px] font-bold leading-4 text-slate-600">
                {!qrImageFailed && order.vietQrUrl
                  ? `QR động đã điền sẵn ${formatMoney(order.totalPrice)} và nội dung ${order.paymentTransferContent}. Hãy kiểm tra đúng người nhận trước khi xác nhận.`
                  : 'QR dự phòng của shop · vui lòng nhập chính xác số tiền và nội dung chuyển khoản bên dưới.'}
              </p>
            </div>

            <dl className="bank-details">
              {[
                ['Ngân hàng', order.bankName || order.bankId || 'Theo mã QR', 'bank'],
                ['Số tài khoản', order.bankAccountNo || '', 'account'],
                ['Chủ tài khoản', order.bankAccountName || '', 'name'],
                ['Số tiền', formatMoney(order.totalPrice), 'amount'],
                ['Nội dung', order.paymentTransferContent, 'content'],
              ].map(([label, value, key]) => <div key={key}><dt>{label}</dt><dd>{value}</dd><button type="button" onClick={() => void copyText(key, value)}><Copy size={14} /> {copied === key ? 'Đã chép' : 'Chép'}</button></div>)}
            </dl>

            {order.deliveryContent ? (
              <div className="delivery-result"><BadgeCheck size={20} /><div><strong>Thông tin nhận hàng</strong><p>Chỉ hiển thị trong phiên tra cứu riêng của đơn này.</p></div><pre>{order.deliveryContent}</pre><button type="button" onClick={() => void copyText('delivery', order.deliveryContent)}><Copy size={15} /> {copied === 'delivery' ? 'Đã chép' : 'Sao chép nội dung'}</button></div>
            ) : (
              <div className="bank-confirm-actions">
                <p><AlertTriangle size={17} /> Bấm bên dưới sau khi ngân hàng báo chuyển thành công. Thao tác này chỉ gửi yêu cầu kiểm tra, không tự xác nhận đã thanh toán.</p>
                <button type="button" onClick={() => void notifyTransferred()} disabled={submitting || Boolean(order.customerReportedPaidAt) || order.paymentStatus === 'PAID'}>
                  {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <BadgeCheck size={18} />}
                  {order.paymentStatus === 'PAID' ? 'Admin đã xác nhận tiền' : order.customerReportedPaidAt ? 'Đã báo admin kiểm tra' : 'Tôi đã chuyển khoản'}
                </button>
              </div>
            )}
          </section>
        )}

        {checkoutError && <div className="checkout-error" role="alert"><AlertTriangle size={18} />{checkoutError}</div>}
      </div>

      <div className="modal-sticky-footer">
        <div><span>Tổng cộng</span><strong>{priceText}</strong><small>{quantity} sản phẩm</small></div>
        <button type="button" disabled={availability.isResting || !isAvailable || total <= 0 || submitting || Boolean(order)} onClick={() => setConfirming(true)}>
          {availability.isResting
            ? <><Clock3 size={19} aria-hidden="true" /> Tạm nghỉ, mở lại {availability.reopensLabel.replace('Mở lại lúc ', '')}</>
            : order
              ? <><BadgeCheck size={19} aria-hidden="true" /> Theo dõi đơn {order.orderCode}</>
              : <><Landmark size={19} aria-hidden="true" /> Tạo mã chuyển khoản</>}
        </button>
      </div>

      {confirming && (
        <div className="checkout-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="checkout-confirm-title">
          <section>
            <span><AlertTriangle size={27} /></span>
            <small>LƯU Ý TRƯỚC KHI CHUYỂN KHOẢN</small>
            <h3 id="checkout-confirm-title">Kiểm tra đơn hàng</h3>
            <ul>
              <li>Chỉ chuyển đúng <strong>{priceText}</strong> và đúng nội dung do hệ thống tạo.</li>
              <li>Không dùng tài khoản mới tạo hoặc mua hộ nếu sản phẩm có điều kiện kích hoạt riêng.</li>
              <li>Admin chỉ giao hàng sau khi tiền thực tế vào tài khoản.</li>
            </ul>
            <div><button type="button" onClick={() => setConfirming(false)}>Quay lại</button><button type="button" onClick={() => void startCheckout()} disabled={submitting}>{submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Landmark size={18} />} Tôi hiểu, tạo mã QR</button></div>
          </section>
        </div>
      )}
    </Modal>
  );
}
