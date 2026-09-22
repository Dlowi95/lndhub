'use client';
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { ArrowLeft, Boxes, Check, CircleDollarSign, FolderTree, KeyRound, Menu, Package, RefreshCw, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { DEFAULT_STORE_SETTINGS } from '../../lib/contact';
import { AdminStats, Announcement, Category, GiftAdminData, Order, Product, StoreSettings } from '../../lib/types';
import { AdminSection, AdminSidebar } from './admin-sidebar';
import CatalogAdmin from './catalog-admin';
import StorefrontAdmin from './storefront-admin';
import GiftAdmin from './gift-admin';
import OrdersAdmin from './orders-admin';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const EMPTY_STATS: AdminStats = { totalOrders: 0, paidOrdersCount: 0, totalRevenue: 0, totalProducts: 0, availableKeysCount: 0, recentOrders: [] };
const EMPTY_GIFTS: GiftAdminData = { enabled: false, title: 'Nhận ChatGPT Plus Miễn Phí', description: 'Mỗi địa chỉ IP được nhận tối đa 1 phần quà trong vòng 24 giờ.', cooldownHours: 24, total: 0, claimed: 0, remaining: 0, claimAvailable: false, encryptionConfigured: false, items: [] };
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

function AdminConsole({ credential, onLogout }: { credential: string; onLogout: (message?: string) => void }) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gifts, setGifts] = useState<GiftAdminData>(EMPTY_GIFTS);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [importModel, setImportModel] = useState('gemini-1.5-pro');
  const [importKeys, setImportKeys] = useState('');
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, string>>({});

  const api = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${credential}`, ...init.headers } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) { onLogout(response.status === 403 ? 'Tài khoản Google này không có quyền quản trị.' : 'Phiên đăng nhập đã hết hạn.'); throw new Error('AUTH'); }
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Yêu cầu không thành công');
    return data as T;
  }, [credential, onLogout]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, p, c, storeSettings, announcementList, giftData] = await Promise.all([
        api<{ data: AdminStats }>('/admin/stats'), api<{ data: Order[] }>('/admin/orders'),
        api<{ data: Product[] }>('/admin/products'), api<{ data: Category[] }>('/admin/categories'),
        api<{ data: StoreSettings }>('/admin/store-settings'), api<{ data: Announcement[] }>('/admin/announcements'),
        api<{ data: GiftAdminData }>('/admin/gifts'),
      ]);
      setStats(s.data); setOrders(o.data); setProducts(p.data); setCategories(c.data);
      setSettings(storeSettings.data); setAnnouncements(announcementList.data); setGifts(giftData.data);
    } catch (error) { if ((error as Error).message !== 'AUTH') setNotice({ tone: 'error', message: 'Không tải được dữ liệu quản trị. Kiểm tra backend.' }); }
    finally { setLoading(false); }
  }, [api]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const notify = (tone: 'success' | 'error', message: string) => setNotice({ tone, message });
  const markPaid = async (code: string) => {
    if (!window.confirm(`Chỉ xác nhận khi tiền của đơn ${code} đã thực tế vào tài khoản. Tiếp tục?`)) return;
    try { await api(`/admin/orders/${encodeURIComponent(code)}/confirm-payment`, { method: 'POST' }); notify('success', `Đã xác nhận thanh toán đơn ${code}; giao hàng được xử lý riêng.`); await refresh(); }
    catch (error) { notify('error', (error as Error).message); }
  };
  const fulfillOrder = async (code: string) => {
    const deliveryContent = (deliveryDrafts[code] || '').trim();
    if (!deliveryContent) return notify('error', 'Nhập key hoặc nội dung giao hàng trước khi gửi.');
    try {
      await api(`/admin/orders/${encodeURIComponent(code)}/fulfill`, { method: 'POST', body: JSON.stringify({ deliveryContent }) });
      setDeliveryDrafts((current) => ({ ...current, [code]: '' }));
      notify('success', `Đã mã hóa và giao hàng cho đơn ${code}.`);
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
  };
  const importInventory = async (event: React.FormEvent) => {
    event.preventDefault(); const keys = importKeys.split('\n').map((item) => item.trim()).filter(Boolean); if (!keys.length) return;
    try { const result = await api<{ imported: number }>('/admin/inventory/import', { method: 'POST', body: JSON.stringify({ keys, model: importModel }) }); setImportKeys(''); notify('success', `Đã nạp ${result.imported} key vào kho.`); await refresh(); }
    catch (error) { notify('error', (error as Error).message); }
  };
  const selectSection = (value: AdminSection) => { setSection(value); setMobileOpen(false); setNotice(null); };
  const titles: Record<AdminSection, string> = { overview: 'Bảng điều khiển', products: 'Sản phẩm', categories: 'Danh mục', contacts: 'Liên hệ', announcements: 'Thông báo', orders: 'Đơn hàng', gifts: 'Kho quà', inventory: 'Kho key' };
  const paymentReviewCount = orders.filter((item) => item.customerReportedPaidAt && item.paymentStatus === 'PENDING').length;

  return <div className="min-h-screen bg-[#090b14] text-white">
    <AdminSidebar active={section} mobileOpen={mobileOpen} counts={{ products: products.length, categories: categories.length, announcements: announcements.length, orders: paymentReviewCount, gifts: gifts.remaining }} onClose={() => setMobileOpen(false)} onSelect={selectSection} onLogout={() => onLogout()} />
    <div className="min-h-screen lg:ml-72">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.07] bg-[#090b14]/90 px-4 backdrop-blur-xl sm:px-6">
        <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-xl border border-white/10 lg:hidden" aria-label="Mở menu"><Menu className="size-5" /></button>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Admin / <span className="text-cyan-300/80">{titles[section]}</span></p><h1 className="truncate text-base font-black">{titles[section]}</h1></div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold text-slate-300 disabled:opacity-50"><RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} /><span className="hidden sm:inline">Làm mới</span></button>
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-3 text-xs font-black text-slate-950"><ArrowLeft className="size-4" /><span className="hidden sm:inline">Về shop</span></Link>
      </header>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {notice && <div className={notice.tone === 'success' ? 'mb-5 flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100' : 'mb-5 flex items-center justify-between rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100'}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)}><X className="size-4" /></button></div>}

        {section === 'overview' && <section className="space-y-6">
          <p className="text-sm text-slate-400">Số liệu lấy trực tiếp từ backend, không còn giá trị giả trên dashboard.</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Doanh thu hoàn tất', money(stats.totalRevenue), `${stats.paidOrdersCount}/${stats.totalOrders} đơn hoàn tất`, CircleDollarSign, 'text-emerald-300 bg-emerald-400/10'],
              ['Sản phẩm đang bán', stats.publishedProductsCount || 0, `${stats.draftProductsCount || 0} bản nháp`, ShoppingBag, 'text-cyan-300 bg-cyan-400/10'],
              ['Danh mục hoạt động', stats.activeCategoriesCount || 0, `${categories.length} danh mục tổng cộng`, FolderTree, 'text-violet-300 bg-violet-400/10'],
              ['Key sẵn sàng', stats.availableKeysCount, 'Dữ liệu thật trong kho', KeyRound, 'text-amber-200 bg-amber-300/10'],
            ].map(([label, value, detail, Icon, tone]) => <article key={String(label)} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5"><div className="flex items-start justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{String(label)}</p><span className={`grid size-9 place-items-center rounded-xl ${tone}`}>{React.createElement(Icon as React.ElementType, { className: 'size-4' })}</span></div><p className="mt-3 text-2xl font-black">{String(value)}</p><p className="mt-1 text-xs text-slate-500">{String(detail)}</p></article>)}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5"><h2 className="font-black">Lộ trình sẵn sàng bán</h2><p className="mb-4 text-xs text-slate-500">Làm lần lượt để tránh sai dữ liệu khi mở thanh toán.</p>
              {[['Thiết lập 18 danh mục', categories.length >= 18, 'categories'], ['Nhập đủ 36 sản phẩm', products.length >= 36, 'products'], ['Xuất bản sản phẩm đã chốt giá', (stats.publishedProductsCount || 0) > 0, 'products'], ['Chốt luồng thanh toán', false, 'orders']].map(([label, done, target]) => <button type="button" key={String(label)} onClick={() => selectSection(target as AdminSection)} className="mb-2 flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-left"><span className={done ? 'grid size-6 place-items-center rounded-full bg-emerald-400/10 text-emerald-300' : 'size-6 rounded-full border border-white/10'}>{done && <Check className="size-3.5" />}</span><span className="text-sm font-semibold text-slate-300">{String(label)}</span></button>)}
            </article>
            <article className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5"><ShieldCheck className="size-8 text-amber-200" /><h2 className="mt-4 font-black text-amber-100">Thanh toán đang khóa</h2><p className="mt-2 text-sm leading-6 text-slate-400">Catalog, giá, tồn kho và chính sách sẽ được hoàn thiện trước. Checkout chưa được mở trong giai đoạn này.</p></article>
          </div>
        </section>}

        {(section === 'products' || section === 'categories') && <CatalogAdmin mode={section} credential={credential} products={products} categories={categories} refresh={refresh} notify={notify} />}

        {(section === 'contacts' || section === 'announcements') && <StorefrontAdmin mode={section} credential={credential} settings={settings} announcements={announcements} refresh={refresh} notify={notify} />}

        {section === 'gifts' && <GiftAdmin credential={credential} data={gifts} refresh={refresh} notify={notify} />}

        {section === 'orders' && <OrdersAdmin orders={orders} paymentReviewCount={paymentReviewCount} deliveryDrafts={deliveryDrafts} setDeliveryDrafts={setDeliveryDrafts} markPaid={markPaid} fulfillOrder={fulfillOrder} />}

        {section === 'inventory' && <section className="grid gap-5 xl:grid-cols-[1fr_360px]"><form onSubmit={importInventory} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5"><h2 className="text-xl font-black">Nạp kho key</h2><p className="mb-5 mt-1 text-sm text-slate-500">Mỗi dòng một key; dữ liệu gửi đến API admin đã xác thực.</p><label className="mb-4 block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Model cấp phát</span><input value={importModel} onChange={(e) => setImportModel(e.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-[#070912] px-3 text-sm" /></label><label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">Danh sách key</span><textarea required rows={10} value={importKeys} onChange={(e) => setImportKeys(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#070912] p-3 font-mono text-sm text-cyan-100" /></label><button type="submit" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-black text-slate-950"><Package className="size-4" /> Nạp vào kho</button></form><aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5"><Boxes className="size-8 text-amber-200" /><p className="mt-4 text-3xl font-black">{stats.availableKeysCount}</p><p className="text-sm text-slate-500">key sẵn sàng cấp phát</p><p className="mt-5 rounded-xl bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80">Không đưa key thật vào ảnh chụp, log hoặc commit Git.</p></aside></section>}
      </main>
    </div>
  </div>;
}

function AdminGate() {
  const [credential, setCredential] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (credential) return <AdminConsole credential={credential} onLogout={(message) => { setCredential(null); setError(message || null); }} />;
  const success = (response: CredentialResponse) => { if (!response.credential) return setError('Google không trả về thông tin xác thực.'); setError(null); setCredential(response.credential); };
  return <main className="grid min-h-screen place-items-center p-6 text-white"><section className="liquid-card w-full max-w-md rounded-3xl border border-white/10 p-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200"><ShieldCheck className="size-7" /></span><p className="mt-5 text-[10px] font-black uppercase tracking-wider text-cyan-300">Khu vực bảo vệ</p><h1 className="mt-2 text-2xl font-black">Quản trị LNDHub</h1><p className="mt-2 text-sm leading-6 text-slate-400">Đăng nhập bằng tài khoản Google đã được cấp quyền.</p><div className="mt-6 flex justify-center"><GoogleLogin onSuccess={success} onError={() => setError('Đăng nhập Google không thành công.')} theme="filled_black" shape="pill" /></div>{error && <p className="mt-4 rounded-xl bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}<Link href="/" className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-cyan-200"><ArrowLeft className="size-4" /> Về trang chủ</Link></section></main>;
}
export default function AdminPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return <main className="grid min-h-screen place-items-center p-6 text-white"><section className="liquid-card max-w-lg rounded-3xl p-8 text-center"><ShieldCheck className="mx-auto size-10 text-amber-200" /><h1 className="mt-4 text-xl font-black">Google Admin chưa được cấu hình</h1><p className="mt-2 text-sm text-slate-400">Thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID rồi build lại frontend.</p></section></main>;
  return <GoogleOAuthProvider clientId={clientId}><AdminGate /></GoogleOAuthProvider>;
}
