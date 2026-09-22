'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { Category, Product } from '../lib/types';
import { CategoryIcon } from './CategoryIcon';
import { ProductCard } from './ProductCard';
import { StoreAvailability } from '../lib/store-hours';

export function ProductCatalog({ products, categories, availability, onSelectProduct }: { products: Product[]; categories: Category[]; availability: StoreAvailability; onSelectProduct: (product: Product) => void }) {
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => products.reduce<Record<string, number>>((result, product) => {
    result[product.category] = (result[product.category] || 0) + 1;
    return result;
  }, { all: products.length }), [products]);
  const categoryOrder = useMemo(() => [
    { slug: 'all', name: 'Tất cả', iconType: 'all' },
    ...categories.filter((item) => item.isActive && (counts[item.slug] || 0) > 0).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({ slug: item.slug, name: item.name, iconType: item.iconType || item.slug })),
  ], [categories, counts]);

  useEffect(() => {
    if (!categoryOrder.some((item) => item.slug === activeTab)) setActiveTab('all');
  }, [activeTab, categoryOrder]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    return products.filter((product) => {
      const inCategory = activeTab === 'all' || product.category === activeTab;
      const searchable = `${product.name} ${product.categoryLabel || ''} ${(product.variants || []).map((variant) => variant.name).join(' ')}`.toLocaleLowerCase('vi');
      return inCategory && (!normalized || searchable.includes(normalized));
    }).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [activeTab, products, query]);
  const availableProducts = filtered.filter((product) => product.inStock && (product.price > 0 || (product.variants || []).some((variant) => variant.inStock && variant.price > 0)));
  const soldOutProducts = filtered.filter((product) => !availableProducts.includes(product));

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => { observer.disconnect(); el.removeEventListener('scroll', updateArrows); };
  }, [products]);

  const scrollCategories = (direction: number) => {
    scrollerRef.current?.scrollBy({ left: direction * Math.min(560, window.innerWidth * 0.72), behavior: 'smooth' });
  };

  return (
    <section id="products" className="catalog-section page-shell" aria-labelledby="catalog-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker"><SlidersHorizontal size={15} aria-hidden="true" /> Catalog lndhub</span>
          <h2 id="catalog-title">Sản phẩm đang mở bán</h2>
          <p>Khám phá toàn bộ dịch vụ số theo danh mục. Giá và chính sách sẽ được công bố sau khi quản trị viên duyệt.</p>
        </div>
        <div className="featured-counter"><strong>{products.filter((product) => product.featured).length}</strong><span>sản phẩm nổi bật</span></div>
      </div>

      <div className="category-rail-wrap">
        <button className="rail-arrow rail-arrow--left" type="button" onClick={() => scrollCategories(-1)} disabled={!canScrollLeft} aria-label="Xem danh mục phía trước">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div ref={scrollerRef} className="category-rail" role="toolbar" aria-label="Lọc theo danh mục">
          {categoryOrder.map((item) => (
            <button key={item.slug} type="button" className="category-chip" aria-pressed={activeTab === item.slug} onClick={() => setActiveTab(item.slug)}>
              <span className={`category-chip__icon category-chip__icon--${item.slug}`}><CategoryIcon category={item.iconType} size={19} /></span>
              <span>{item.name}</span><strong>{counts[item.slug] || 0}</strong>
            </button>
          ))}
        </div>
        <button className="rail-arrow rail-arrow--right" type="button" onClick={() => scrollCategories(1)} disabled={!canScrollRight} aria-label="Xem thêm danh mục">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="catalog-controls">
        <label className="catalog-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Tìm sản phẩm</span>
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Tìm ChatGPT, Gemini, Adobe..." />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa từ khóa"><X size={17} aria-hidden="true" /></button>}
        </label>
        <p><strong>{filtered.length}</strong> thẻ phù hợp</p>
      </div>

      {filtered.length > 0 ? (
        <div className="stock-groups">
          {availableProducts.length > 0 && <section className="stock-group" aria-labelledby="available-title"><div className="stock-group__heading"><span className="stock-state stock-state--available"><i />Còn hàng</span><strong id="available-title">{availableProducts.length} sản phẩm sẵn sàng</strong></div><div className="product-grid">{availableProducts.map((product) => <ProductCard key={product._id} product={product} availability={availability} onSelect={onSelectProduct} />)}</div></section>}
          {soldOutProducts.length > 0 && <section className="stock-group" aria-labelledby="soldout-title"><div className="stock-group__heading"><span className="stock-state stock-state--soldout"><i />Hết hàng</span><strong id="soldout-title">{soldOutProducts.length} sản phẩm tạm hết</strong></div><div className="product-grid">{soldOutProducts.map((product) => <ProductCard key={product._id} product={product} availability={availability} onSelect={onSelectProduct} />)}</div></section>}
        </div>
      ) : (
        <div className="catalog-empty"><Search size={24} aria-hidden="true" /><h3>Chưa tìm thấy sản phẩm</h3><p>Hãy thử từ khóa ngắn hơn hoặc chọn danh mục khác.</p><button type="button" onClick={() => { setQuery(''); setActiveTab('all'); }}>Xem tất cả sản phẩm</button></div>
      )}
    </section>
  );
}
