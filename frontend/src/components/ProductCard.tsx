'use client';

import { ArrowUpRight, BadgePercent, Clock3, Layers3, Sparkles } from 'lucide-react';
import { Product } from '../lib/types';
import { StoreAvailability } from '../lib/store-hours';
import { CategoryIcon } from './CategoryIcon';
import { motion, useReducedMotion } from 'motion/react';

export function ProductCard({ product, availability, onSelect }: { product: Product; availability: StoreAvailability; onSelect: (product: Product) => void }) {
  const reduceMotion = useReducedMotion();
  const variantCount = product.variants?.length || 1;
  const variantPrices = (product.variants || []).map((variant) => variant.price).filter((price) => price > 0);
  const displayPrice = product.price > 0 ? product.price : variantPrices.length ? Math.min(...variantPrices) : 0;
  const isAvailable = product.inStock && displayPrice > 0;
  const discount = product.promotionEnabled && product.originalPrice > displayPrice
    ? Math.round((1 - displayPrice / product.originalPrice) * 100) : 0;
  const actionDisabled = !isAvailable || availability.isResting;
  const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
  const customBadge = product.badge?.trim();
  const showCustomBadge = customBadge && !/^nổi bật$/i.test(customBadge);

  return (
    <motion.article
      className={`product-card${product.featured ? ' product-card--featured' : ''}${discount > 0 ? ' product-card--sale' : ''}${!isAvailable ? ' product-card--soldout' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-card__glow" aria-hidden="true" />
      <div className="product-card__shine" aria-hidden="true" />
      <div className="product-card__top">
        <span className={`product-logo product-logo--${product.category}`}>
          <CategoryIcon category={product.category} size={25} />
        </span>
        <div className="product-card__badges">
          {product.featured && <span className="badge badge--featured"><Sparkles size={12} aria-hidden="true" /> Nổi bật</span>}
          {showCustomBadge && <span className="badge badge--custom">{customBadge}</span>}
        </div>
      </div>

      <div className="product-card__content">
        <p className="product-card__category">{product.categoryLabel}</p>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>

      <div className={`product-card__price ${discount > 0 ? 'product-card__price--sale' : ''}`} aria-label={discount > 0 ? `Giảm ${discount} phần trăm, giá ${formatMoney(displayPrice)} đồng` : displayPrice ? `Giá từ ${formatMoney(displayPrice)} đồng` : 'Giá đang cập nhật'}>
        {discount > 0 ? <>
          <span className="discount-seal"><BadgePercent size={17} aria-hidden="true" /><strong>-{discount}%</strong></span>
          <span className="price-stack"><small>Giá ưu đãi</small><span><del>{formatMoney(product.originalPrice)}đ</del><strong>{formatMoney(displayPrice)}đ</strong></span></span>
        </> : <span className="price-stack"><small>{variantCount > 1 ? 'Giá từ' : 'Giá bán'}</small><strong>{displayPrice ? `${formatMoney(displayPrice)}đ` : 'Chờ cập nhật'}</strong></span>}
      </div>

      <div className="product-card__meta">
        <span><Layers3 size={15} aria-hidden="true" /> {variantCount} {variantCount > 1 ? 'lựa chọn' : 'gói'}</span>
        <span>Đã bán: {new Intl.NumberFormat('vi-VN').format(product.soldCount || 0)}</span>
      </div>

      <div className="product-card__footer">
        <div className={`stock-state ${isAvailable ? 'stock-state--available' : 'stock-state--soldout'}`} role="status"><i />{isAvailable ? 'Còn hàng' : 'Hết hàng'}</div>
        <button type="button" className="card-action" disabled={actionDisabled} onClick={() => onSelect(product)} aria-label={actionDisabled ? (isAvailable ? `${product.name} đang tạm nghỉ` : `${product.name} đã hết hàng`) : `Mua ngay ${product.name}`}>
          {availability.isResting && isAvailable ? <><Clock3 size={16} /> Tạm nghỉ, thử lại sau</> : !isAvailable ? 'Hết hàng' : <><span>Mua ngay</span><ArrowUpRight size={18} aria-hidden="true" /></>}
        </button>
      </div>
    </motion.article>
  );
}
