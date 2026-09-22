'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CircleHelp, Layers3, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, WifiOff } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ProductCatalog } from '../components/ProductCatalog';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderLookupModal } from '../components/OrderLookupModal';
import { ContactFloating } from '../components/ContactFloating';
import { NotificationCenter } from '../components/NotificationCenter';
import { GptPlusModal } from '../components/GptPlusModal';
import { WarrantyPolicyModal } from '../components/WarrantyPolicyModal';
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS } from '../lib/catalog-fixture';
import { DEFAULT_STORE_SETTINGS } from '../lib/contact';
import { Product, StorefrontData } from '../lib/types';
import { useStoreAvailability } from '../lib/store-hours';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const STOREFRONT_CACHE_KEY = 'lndhub-storefront-cache-v1';
const FALLBACK_STOREFRONT: StorefrontData = {
  products: CATALOG_PRODUCTS.filter((product) => product.category === 'chatgpt'), categories: CATALOG_CATEGORIES,
  settings: DEFAULT_STORE_SETTINGS, announcements: [],
};

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [gptPlusOpen, setGptPlusOpen] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [storefront, setStorefront] = useState<StorefrontData>(FALLBACK_STOREFRONT);
  const [connectionState, setConnectionState] = useState<'loading' | 'live' | 'offline'>('loading');
  const availability = useStoreAvailability(storefront.settings);

  const loadStorefront = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/storefront`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Storefront request failed: ${response.status}`);
      const result = await response.json() as { data?: StorefrontData };
      if (!result.data || !Array.isArray(result.data.products) || !Array.isArray(result.data.categories)) {
        throw new Error('Storefront payload is invalid');
      }
      setStorefront(result.data);
      setConnectionState('live');
      try {
        window.localStorage.setItem(STOREFRONT_CACHE_KEY, JSON.stringify(result.data));
      } catch {
        // The live storefront remains usable when browser storage is unavailable.
      }
    } catch {
      setConnectionState('offline');
    }
  }, []);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(STOREFRONT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as StorefrontData;
        if (Array.isArray(parsed.products) && Array.isArray(parsed.categories)) setStorefront(parsed);
      }
    } catch {
      // Ignore a missing or invalid cache and continue with the safe bundled catalog.
    }

    void loadStorefront();
    const events = new EventSource(`${API_BASE}/storefront/events`);
    let refreshTimer: number | undefined;
    const retryTimer = window.setInterval(() => void loadStorefront(), 30_000);
    events.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type !== 'heartbeat') {
          if (refreshTimer) window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => void loadStorefront(), 250);
        }
      } catch {
        if (refreshTimer) window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => void loadStorefront(), 250);
      }
    };
    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      window.clearInterval(retryTimer);
      events.close();
    };
  }, [loadStorefront]);

  const variantCount = useMemo(() => storefront.products.reduce((sum, product) => sum + (product.variants?.length || 1), 0), [storefront.products]);
  const visibleCategoryCount = useMemo(() => new Set(storefront.products.map((product) => product.category)).size, [storefront.products]);

  return (
    <main className="site-main">
      <Navbar onOpenLookup={() => setLookupOpen(true)} onOpenGptPlus={() => setGptPlusOpen(true)} onOpenWarranty={() => setWarrantyOpen(true)} />
      {connectionState === 'offline' && (
        <aside className="storefront-status page-shell" role="status">
          <span><WifiOff size={18} /></span>
          <div><strong>Máy chủ catalog đang tạm mất kết nối</strong><small>Đang hiển thị dữ liệu gần nhất đã lưu trên thiết bị. Giá và tồn kho có thể chưa được cập nhật.</small></div>
          <button type="button" onClick={() => void loadStorefront()}><RefreshCw size={16} /> Thử lại</button>
        </aside>
      )}
      <HeroSection onOpenLookup={() => setLookupOpen(true)} settings={storefront.settings} availability={availability} productCount={storefront.products.length} categoryCount={visibleCategoryCount} variantCount={variantCount} />

      <section className="trust-strip page-shell" aria-label="Thông tin catalog">
        <div><span><Layers3 size={20} /></span><p><strong>{storefront.products.length} thẻ sản phẩm</strong><small>Được phân loại rõ ràng</small></p></div>
        <div><span><Settings2 size={20} /></span><p><strong>{variantCount} gói linh hoạt</strong><small>Giá riêng cho từng SKU</small></p></div>
        <div><span><ShieldCheck size={20} /></span><p><strong>Chính sách minh bạch</strong><small>Hiển thị trước khi đặt</small></p></div>
      </section>

      <ProductCatalog products={storefront.products} categories={storefront.categories} availability={availability} onSelectProduct={setSelectedProduct} />

      <section id="guide" className="process-section page-shell">
        <div className="section-heading section-heading--compact"><div><span className="section-kicker"><Sparkles size={15} /> Trải nghiệm mua hàng</span><h2>Chọn đúng gói trong ba bước</h2><p>Luồng đặt hàng được thiết kế để khách biết mình mua gì, nhận gì và được hỗ trợ thế nào.</p></div></div>
        <div className="process-grid">
          <article><span>01</span><Search size={24} /><h3>Tìm và so sánh</h3><p>Lọc theo {visibleCategoryCount} danh mục đang bán, xem từng biến thể và điều kiện trước khi chọn.</p></article>
          <article><span>02</span><BadgeCheck size={24} /><h3>Xác nhận thông tin</h3><p>Giá, số lượng, cách nhận và bảo hành luôn nằm trong cùng một màn hình.</p></article>
          <article><span>03</span><CircleHelp size={24} /><h3>Tra cứu sau mua</h3><p>Theo dõi trạng thái bằng mã đơn khi hệ thống đơn hàng chính thức được mở.</p></article>
        </div>
      </section>

      <section id="warranty" className="policy-banner page-shell"><span className="policy-banner__icon"><ShieldCheck size={28} /></span><div><span>Chính sách lndhub</span><h2>Quyền lợi đi cùng từng sản phẩm</h2><p>Không dùng một lời hứa chung cho mọi gói. Thời hạn, phạm vi hỗ trợ và điều kiện đổi hoàn sẽ được lưu theo đúng SKU tại thời điểm khách đặt.</p></div><button type="button" onClick={() => setLookupOpen(true)}>Xem trạng thái hệ thống</button></section>

      <footer className="site-footer page-shell"><a href="#top" className="brand brand--footer"><span className="brand__mark"><Sparkles size={18} /></span><span className="brand__name">lnd<span>hub</span></span></a><p>Catalog dịch vụ số được xây dựng theo hướng rõ ràng, an toàn và dễ quản trị.</p><span>© 2026 lndhub</span></footer>

      <CheckoutModal product={selectedProduct} availability={availability} onClose={() => setSelectedProduct(null)} />
      <OrderLookupModal isOpen={lookupOpen} onClose={() => setLookupOpen(false)} />
      <GptPlusModal isOpen={gptPlusOpen} onClose={() => setGptPlusOpen(false)} />
      <WarrantyPolicyModal isOpen={warrantyOpen} onClose={() => setWarrantyOpen(false)} />
      <NotificationCenter announcements={storefront.announcements} />
      <ContactFloating settings={storefront.settings} />
    </main>
  );
}
