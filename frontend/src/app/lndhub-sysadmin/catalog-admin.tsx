'use client';
import { Archive, LayoutGrid, PackageOpen, Pencil, Plus, Save, Search, Sparkles, Star, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryIcon } from '../../components/CategoryIcon';
import { Category, Product, ProductVariant } from '../../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const PRESETS = [
  ['ChatGPT', 'chatgpt'], ['Gemini', 'gemini'], ['Claude', 'claude'], ['Grok', 'grok'],
  ['YouTube', 'youtube'], ['Netflix', 'netflix'], ['VPN', 'vpn'], ['Spotify', 'spotify'],
  ['CapCut', 'capcut'], ['Canva', 'canva'], ['Adobe', 'adobe'], ['Office', 'office'],
  ['JetBrains', 'jetbrains'], ['iLovePDF', 'ilovepdf'], ['Leonardo AI', 'leonardo'],
  ['Autodesk', 'autodesk'], ['Duolingo', 'duolingo'], ['Khác', 'other'],
] as const;
type NoticeFn = (tone: 'success' | 'error', message: string) => void;
type ProductFilter = 'all' | 'needs-price' | 'DRAFT' | 'PUBLISHED' | 'out-of-stock' | 'ARCHIVED';
type ProductForm = {
  name: string; slug: string; category: string; description: string; model: string;
  fulfillmentType: 'MANUAL_SERVICE' | 'API_KEY';
  price: number; originalPrice: number; stockCount: number; inStock: boolean;
  promotionEnabled: boolean; discountPercent: number; soldCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; featured: boolean; badge: string;
  iconType: string; deliveryLabel: string; sortOrder: number;
  featuresText: string; informationText: string; activationText: string; warrantyText: string;
  variants: ProductVariant[];
};
const EMPTY_PRODUCT: ProductForm = {
  name: '', slug: '', category: '', description: '', model: '', fulfillmentType: 'MANUAL_SERVICE', price: 0,
  originalPrice: 0, stockCount: 0, inStock: true, promotionEnabled: false, discountPercent: 0, soldCount: 0, status: 'DRAFT', featured: false,
  badge: '', iconType: 'sparkles', deliveryLabel: '', sortOrder: 0,
  featuresText: '', informationText: '', activationText: '', warrantyText: '', variants: [],
};
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
const needsPricing = (item: Product) => Number(item.price || 0) <= 0 && !(item.variants || []).some((variant) => Number(variant.price || 0) > 0);
const discountFromPrices = (price: number, originalPrice: number) => originalPrice > 0 && price >= 0 && price < originalPrice
  ? Math.round((1 - price / originalPrice) * 100)
  : 0;

function NumericInput({ value, onValueChange, ...props }: {
  value: number;
  onValueChange: (value: number) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [draft, setDraft] = useState(String(Number.isFinite(value) ? value : 0));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(Number.isFinite(value) ? value : 0));
  }, [value]);

  return (
    <input
      {...props}
      type="number"
      value={draft}
      onFocus={() => { focused.current = true; }}
      onChange={(event) => {
        const next = event.currentTarget.value;
        setDraft(next);
        onValueChange(next === '' ? 0 : Number(next));
      }}
      onBlur={() => {
        focused.current = false;
        const normalized = draft === '' || !Number.isFinite(Number(draft)) ? 0 : Number(draft);
        setDraft(String(normalized));
        onValueChange(normalized);
      }}
    />
  );
}

export default function CatalogAdmin({ mode, credential, products, categories, refresh, notify }: {
  mode: 'products' | 'categories'; credential: string; products: Product[]; categories: Category[];
  refresh: () => Promise<void>; notify: NoticeFn;
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', iconType: 'sparkles', sortOrder: 0, isActive: true });
  const [busy, setBusy] = useState(false);
  const api = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${credential}`, ...init.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Yêu cầu không thành công');
    return data;
  };
  const categoryCounts = useMemo(() => products.reduce<Record<string, number>>((result, product) => {
    if (product.status !== 'ARCHIVED') result[product.category] = (result[product.category] || 0) + 1;
    return result;
  }, {}), [products]);
  const activeProductCount = useMemo(() => products.filter((item) => item.status !== 'ARCHIVED').length, [products]);
  const productStats = useMemo(() => ({
    active: products.filter((item) => item.status !== 'ARCHIVED').length,
    needsPrice: products.filter((item) => item.status !== 'ARCHIVED' && needsPricing(item)).length,
    draft: products.filter((item) => item.status === 'DRAFT').length,
    published: products.filter((item) => item.status === 'PUBLISHED').length,
    sale: products.filter((item) => item.status !== 'ARCHIVED' && (item.promotionEnabled || (item.variants || []).some((variant) => variant.promotionEnabled))).length,
  }), [products]);
  const orderedCategories = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('vi');
    return products.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesFilter = productFilter === 'all'
        || (productFilter === 'needs-price' && item.status !== 'ARCHIVED' && needsPricing(item))
        || (productFilter === 'out-of-stock' && item.status !== 'ARCHIVED' && !item.inStock)
        || item.status === productFilter;
      const searchable = `${item.name} ${item.slug} ${item.categoryLabel || ''}`.toLocaleLowerCase('vi');
      return matchesCategory && matchesFilter && (!q || searchable.includes(q));
    });
  }, [activeCategory, productFilter, products, query]);
  const activeCategoryInfo = categories.find((item) => item.slug === activeCategory);
  const openNew = (categorySlug?: string) => {
    const selectedCategory = categorySlug || (activeCategory !== 'all' ? activeCategory : categories.find((item) => item.isActive)?.slug) || '';
    setEditingProduct(null);
    setProductForm({ ...EMPTY_PRODUCT, category: selectedCategory, iconType: selectedCategory || 'sparkles' });
    setProductOpen(true);
  };
  const openEdit = (item: Product) => {
    setEditingProduct(item._id);
    setProductForm({
      name: item.name, slug: item.slug, category: item.category, description: item.description, model: item.model || '', fulfillmentType: item.fulfillmentType || 'MANUAL_SERVICE',
      price: item.price || 0, originalPrice: item.originalPrice || 0, stockCount: item.stockCount || 0, inStock: item.inStock,
      promotionEnabled: Boolean(item.promotionEnabled), discountPercent: discountFromPrices(item.price || 0, item.originalPrice || 0), soldCount: item.soldCount || 0,
      status: item.status || 'DRAFT', featured: Boolean(item.featured), badge: item.badge || '', iconType: item.iconType || item.category,
      deliveryLabel: item.deliveryLabel || '', sortOrder: item.sortOrder || 0, featuresText: (item.features || []).join('\n'),
      informationText: (item.information || []).join('\n'), activationText: (item.activationSteps || []).join('\n'), warrantyText: (item.warrantyNotes || []).join('\n'),
      variants: (item.variants || []).map((variant) => ({ ...variant, discountPercent: discountFromPrices(variant.price || 0, variant.originalPrice || 0) })),
    });
    setProductOpen(true);
  };
  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    const category = categories.find((item) => item.slug === productForm.category);
    const { featuresText, informationText, activationText, warrantyText, ...base } = productForm;
    const body = {
      ...base,
      discountPercent: discountFromPrices(base.price, base.originalPrice),
      variants: base.variants.map((variant) => ({ ...variant, discountPercent: discountFromPrices(variant.price, variant.originalPrice || 0) })),
      categoryLabel: category?.name || productForm.category,
      features: lines(featuresText),
      information: lines(informationText),
      activationSteps: lines(activationText),
      warrantyNotes: lines(warrantyText),
    };
    try { await api(editingProduct ? `/admin/products/${editingProduct}` : '/admin/products', { method: editingProduct ? 'PUT' : 'POST', body: JSON.stringify(body) }); setProductOpen(false); notify('success', editingProduct ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm mới.'); await refresh(); }
    catch (error) { notify('error', (error as Error).message); } finally { setBusy(false); }
  };
  const archiveProduct = async (item: Product) => {
    if (!window.confirm(`Lưu trữ “${item.name}”? Dữ liệu vẫn được giữ lại.`)) return;
    try { await api(`/admin/products/${item._id}`, { method: 'DELETE' }); notify('success', 'Đã lưu trữ sản phẩm.'); await refresh(); } catch (error) { notify('error', (error as Error).message); }
  };
  const toggleFeatured = async (item: Product) => {
    try {
      await api(`/admin/products/${item._id}`, { method: 'PUT', body: JSON.stringify({ featured: !item.featured }) });
      notify('success', item.featured ? 'Đã bỏ sản phẩm khỏi mục nổi bật.' : 'Đã thêm sản phẩm vào mục nổi bật.');
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
  };
  const addVariant = () => setProductForm((prev) => ({ ...prev, variants: [...prev.variants, { id: `option-${Date.now()}`, name: 'Lựa chọn mới', price: 0, originalPrice: 0, stockCount: 0, inStock: false, promotionEnabled: false, discountPercent: 0 }] }));
  const updateVariant = <K extends keyof ProductVariant>(index: number, key: K, value: ProductVariant[K]) => setProductForm((prev) => ({ ...prev, variants: prev.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, [key]: value } : variant) }));
  const updateProductNumber = (key: 'price' | 'originalPrice' | 'stockCount' | 'soldCount' | 'sortOrder', value: number) => setProductForm((prev) => {
    const next = { ...prev, [key]: value };
    if (key === 'price' || key === 'originalPrice') next.discountPercent = discountFromPrices(next.price, next.originalPrice);
    return next;
  });
  const updateVariantPrice = (index: number, key: 'price' | 'originalPrice', value: number) => setProductForm((prev) => ({
    ...prev,
    variants: prev.variants.map((variant, variantIndex) => {
      if (variantIndex !== index) return variant;
      const next = { ...variant, [key]: value };
      next.discountPercent = discountFromPrices(next.price, next.originalPrice || 0);
      return next;
    }),
  }));
  const removeVariant = (index: number) => setProductForm((prev) => ({ ...prev, variants: prev.variants.filter((_, variantIndex) => variantIndex !== index) }));
  const resetCategory = () => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', description: '', iconType: 'sparkles', sortOrder: categories.length, isActive: true }); };
  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await api(editingCategory ? `/admin/categories/${editingCategory}` : '/admin/categories', { method: editingCategory ? 'PUT' : 'POST', body: JSON.stringify(categoryForm) }); notify('success', editingCategory ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.'); resetCategory(); await refresh(); }
    catch (error) { notify('error', (error as Error).message); } finally { setBusy(false); }
  };
  const editCategory = (item: Category) => { setEditingCategory(item._id); setCategoryForm({ name: item.name, slug: item.slug, description: item.description || '', iconType: item.iconType || item.slug, sortOrder: item.sortOrder || 0, isActive: item.isActive }); };
  const toggleCategory = async (item: Category) => { try { await api(`/admin/categories/${item._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !item.isActive }) }); await refresh(); } catch (error) { notify('error', (error as Error).message); } };
  const removeCategory = async (item: Category) => {
    if (!window.confirm(`Xóa danh mục trống “${item.name}”?`)) return;
    try { await api(`/admin/categories/${item._id}`, { method: 'DELETE' }); notify('success', 'Đã xóa danh mục trống.'); await refresh(); } catch (error) { notify('error', (error as Error).message); }
  };
  const createPresets = async () => {
    const current = new Set(categories.map((item) => item.slug)); const missing = PRESETS.filter(([, slug]) => !current.has(slug));
    if (!missing.length) return notify('success', '18 danh mục chuẩn đã có đầy đủ.');
    setBusy(true);
    try { await Promise.all(missing.map(([name, slug], index) => api('/admin/categories', { method: 'POST', body: JSON.stringify({ name, slug, iconType: slug, sortOrder: categories.length + index, isActive: true }) }))); notify('success', `Đã thêm ${missing.length} danh mục chuẩn.`); await refresh(); }
    catch (error) { notify('error', (error as Error).message); } finally { setBusy(false); }
  };
  const inputClass = 'min-h-11 w-full rounded-xl border border-white/10 bg-[#070912] px-3 text-sm outline-none focus:border-cyan-300/50';
  const labelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500';
  if (mode === 'categories') return (
    <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={saveCategory} className="h-fit rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5 xl:sticky xl:top-24">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="font-black">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</h2><p className="mt-1 text-xs text-slate-500">Slug được dùng để liên kết sản phẩm.</p></div>{editingCategory && <button type="button" onClick={resetCategory}><X className="size-4" /></button>}</div>
        <div className="space-y-4">
          <label><span className={labelClass}>Tên danh mục *</span><input required minLength={2} value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value, slug: editingCategory || prev.slug ? prev.slug : slugify(e.target.value) }))} className={inputClass} /></label>
          <label><span className={labelClass}>Slug *</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={categoryForm.slug} onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))} className={inputClass + ' font-mono'} /></label>
          <label><span className={labelClass}>Mô tả</span><textarea rows={3} maxLength={240} value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} className={inputClass + ' py-3'} /></label>
          <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Icon type</span><input value={categoryForm.iconType} onChange={(e) => setCategoryForm((prev) => ({ ...prev, iconType: e.target.value }))} className={inputClass} /></label><label><span className={labelClass}>Thứ tự</span><NumericInput min={0} value={categoryForm.sortOrder} onValueChange={(value) => setCategoryForm((prev) => ({ ...prev, sortOrder: value }))} className={inputClass} /></label></div>
          <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-[#070912] px-3 text-sm"><span>Hiển thị ngoài shop</span><input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="size-4 accent-cyan-300" /></label>
          <button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 text-sm font-black text-slate-950 disabled:opacity-50"><Save className="size-4" /> {busy ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}</button>
        </div>
      </form>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black">Danh mục catalog</h2><p className="mt-1 text-sm text-slate-500">Quản lý thanh lọc sản phẩm ngoài trang chủ.</p></div><button type="button" onClick={() => void createPresets()} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 text-sm font-bold text-violet-100"><Sparkles className="size-4" /> Tạo bộ 18 danh mục</button></div>
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0f121d]"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="p-4">Danh mục</th><th className="p-4">Sản phẩm</th><th className="p-4">Thứ tự</th><th className="p-4">Hiển thị</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-white/[0.06]">
          {categories.map((item) => { const count = products.filter((product) => product.category === item.slug && product.status !== 'ARCHIVED').length; return <tr key={item._id}><td className="p-4"><p className="font-bold">{item.name}</p><p className="font-mono text-[10px] text-slate-600">{item.slug}</p></td><td className="p-4">{count}</td><td className="p-4 text-slate-400">{item.sortOrder}</td><td className="p-4"><button type="button" onClick={() => void toggleCategory(item)} className={item.isActive ? 'rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-200' : 'rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-500'}>{item.isActive ? 'Đang hiện' : 'Đang ẩn'}</button></td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => editCategory(item)} className="grid size-9 place-items-center rounded-xl border border-white/10"><Pencil className="size-4" /></button><button type="button" disabled={count > 0} onClick={() => void removeCategory(item)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-500 hover:text-rose-200 disabled:opacity-20"><Trash2 className="size-4" /></button></div></td></tr>; })}
          {!categories.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500">Chưa có danh mục. Hãy tạo bộ 18 danh mục chuẩn.</td></tr>}
        </tbody></table></div>
      </div>
    </section>
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black">Quản lý sản phẩm</h2><p className="mt-1 text-sm text-slate-500">Model đã đồng bộ an toàn; giá, sale, tồn kho và xuất bản chỉ đổi khi admin lưu.</p></div><button type="button" onClick={() => openNew()} disabled={!categories.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950 disabled:opacity-40"><Plus className="size-4" /> Thêm sản phẩm</button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Tổng quan trạng thái catalog">
        {[
          ['Đang quản lý', productStats.active, 'text-cyan-200'],
          ['Chờ định giá', productStats.needsPrice, 'text-amber-200'],
          ['Bản nháp', productStats.draft, 'text-violet-200'],
          ['Đang bán', productStats.published, 'text-emerald-200'],
          ['Có giảm giá', productStats.sale, 'text-fuchsia-200'],
        ].map(([label, value, tone]) => <div key={String(label)} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p></div>)}
      </div>
      {!categories.length && <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">Hãy tạo danh mục trước khi thêm sản phẩm.</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-3 xl:sticky xl:top-24">
          <div className="mb-3 flex items-center justify-between px-2"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">Danh mục</p><p className="mt-1 text-xs text-slate-500">Chọn để lọc sản phẩm</p></div><span className="rounded-lg bg-white/5 px-2 py-1 text-xs font-black text-slate-300">{activeProductCount}</span></div>
          <label className="block xl:hidden"><span className="sr-only">Chọn danh mục sản phẩm</span><select value={activeCategory} onChange={(event) => { setActiveCategory(event.target.value); setQuery(''); }} className={inputClass}><option value="all">Tất cả ({activeProductCount})</option>{orderedCategories.map((item) => <option key={item._id} value={item.slug}>{item.name} ({categoryCounts[item.slug] || 0})</option>)}</select></label>
          <nav className="hidden max-h-[calc(100vh-14rem)] space-y-1 overflow-y-auto pr-1 xl:block" aria-label="Danh mục sản phẩm quản trị">
            <button type="button" aria-pressed={activeCategory === 'all'} onClick={() => { setActiveCategory('all'); setQuery(''); }} className={activeCategory === 'all' ? 'flex min-h-11 w-full items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-left text-sm font-black text-cyan-100' : 'flex min-h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-sm font-bold text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white'}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.06]"><LayoutGrid className="size-4" /></span><span className="min-w-0 flex-1 truncate">Tất cả</span><strong className="text-xs">{activeProductCount}</strong></button>
            {orderedCategories.map((item) => <button key={item._id} type="button" aria-pressed={activeCategory === item.slug} onClick={() => { setActiveCategory(item.slug); setQuery(''); }} className={activeCategory === item.slug ? 'flex min-h-11 w-full items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-left text-sm font-black text-cyan-100' : 'flex min-h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3 text-left text-sm font-bold text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white'}><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04]"><CategoryIcon category={item.iconType || item.slug} size={17} /></span><span className="min-w-0 flex-1 truncate">{item.name}</span><strong className={categoryCounts[item.slug] ? 'text-xs text-slate-200' : 'text-xs text-slate-600'}>{categoryCounts[item.slug] || 0}</strong></button>)}
          </nav>
        </aside>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><label className="relative block min-w-0 flex-1"><Search className="absolute left-3 top-3.5 size-4 text-slate-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={activeCategoryInfo ? `Tìm trong ${activeCategoryInfo.name}...` : 'Tìm theo tên hoặc slug...'} className={inputClass + ' pl-10'} /></label><label className="lg:w-52"><span className="sr-only">Lọc trạng thái sản phẩm</span><select value={productFilter} onChange={(event) => setProductFilter(event.target.value as ProductFilter)} className={inputClass}><option value="all">Tất cả trạng thái</option><option value="needs-price">Chờ định giá</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đang bán</option><option value="out-of-stock">Hết hàng</option><option value="ARCHIVED">Lưu trữ</option></select></label><p className="shrink-0 text-xs text-slate-500" role="status" aria-atomic="true"><strong className="text-slate-200">{filtered.length}</strong> sản phẩm</p></div>
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0f121d]"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="p-4">Sản phẩm</th><th className="p-4">Danh mục</th><th className="p-4">Giá</th><th className="p-4">Tồn</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-white/[0.06]">
        {filtered.map((item) => <tr key={item._id} className="hover:bg-white/[0.02]"><td className="p-4"><div className="flex items-start gap-2"><div className="min-w-0"><p className="max-w-xs font-bold">{item.name}</p><p className="font-mono text-[10px] text-slate-600">{item.slug}</p></div>{item.featured && <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black text-amber-200"><Star className="size-3 fill-current" /> NỔI BẬT</span>}</div></td><td className="p-4 text-slate-400">{item.categoryLabel || item.category}</td><td className="p-4">{needsPricing(item) ? <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black text-amber-100">CHỜ ĐỊNH GIÁ</span> : <><p className="font-bold text-cyan-200">{item.price > 0 ? money(item.price) : 'Giá theo lựa chọn'}</p>{item.promotionEnabled && item.originalPrice > item.price && <p className="mt-1 text-[10px] text-amber-200">-{discountFromPrices(item.price, item.originalPrice)}% · <span className="line-through text-slate-600">{money(item.originalPrice)}</span></p>}</>}</td><td className="p-4"><span className={item.inStock ? 'text-emerald-200' : 'text-rose-200'}>{item.inStock ? `${item.stockCount} · Còn` : 'Hết hàng'}</span></td><td className="p-4"><span className={item.status === 'PUBLISHED' ? 'rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-200' : item.status === 'ARCHIVED' ? 'rounded-full bg-slate-400/10 px-2.5 py-1 text-[10px] font-black text-slate-300' : 'rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] font-black text-amber-100'}>{item.status === 'PUBLISHED' ? 'ĐANG BÁN' : item.status === 'ARCHIVED' ? 'LƯU TRỮ' : 'BẢN NHÁP'}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => void toggleFeatured(item)} aria-pressed={Boolean(item.featured)} aria-label={item.featured ? `Bỏ nổi bật ${item.name}` : `Đặt nổi bật ${item.name}`} title={item.featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'} className={item.featured ? 'grid size-11 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200' : 'grid size-11 place-items-center rounded-xl border border-white/10 text-slate-500 hover:text-amber-200'}><Star className={item.featured ? 'size-4 fill-current' : 'size-4'} /></button><button type="button" onClick={() => openEdit(item)} aria-label={`Sửa ${item.name}`} title="Sửa sản phẩm" className="grid size-11 place-items-center rounded-xl border border-white/10"><Pencil className="size-4" /></button>{item.status !== 'ARCHIVED' && <button type="button" onClick={() => void archiveProduct(item)} aria-label={`Lưu trữ ${item.name}`} title="Lưu trữ sản phẩm" className="grid size-11 place-items-center rounded-xl border border-white/10 text-slate-400 hover:text-amber-200"><Archive className="size-4" /></button>}</div></td></tr>)}
        {!filtered.length && <tr><td colSpan={6} className="p-10 text-center"><PackageOpen className="mx-auto size-8 text-slate-600" /><p className="mt-3 font-bold text-slate-300">{activeCategoryInfo ? `${activeCategoryInfo.name} chưa có sản phẩm` : 'Chưa có sản phẩm phù hợp'}</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-600">{activeCategoryInfo ? 'Tạo sản phẩm đầu tiên, lưu vào database rồi sản phẩm sẽ xuất hiện trong danh mục này.' : 'Hãy thử từ khóa khác hoặc chọn một danh mục.'}</p>{activeCategoryInfo && <button type="button" onClick={() => openNew(activeCategoryInfo.slug)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black text-slate-950"><Plus className="size-4" /> Thêm vào {activeCategoryInfo.name}</button>}</td></tr>}
      </tbody></table></div>
        </div>
      </div>

      {productOpen && <div className="fixed inset-0 z-[70] flex justify-end bg-black/70 backdrop-blur-sm"><button type="button" onClick={() => setProductOpen(false)} className="absolute inset-0" aria-label="Đóng" /><form onSubmit={saveProduct} className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0c0f18]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0c0f18]/95 p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Catalog editor</p><h2 className="text-lg font-black">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2></div><button type="button" onClick={() => setProductOpen(false)}><X /></button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={labelClass}>Tên sản phẩm *</span><input required minLength={3} value={productForm.name} onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value, slug: editingProduct || prev.slug ? prev.slug : slugify(e.target.value) }))} className={inputClass} /></label>
          <label><span className={labelClass}>Slug *</span><input required value={productForm.slug} onChange={(e) => setProductForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))} className={inputClass + ' font-mono'} /></label>
          <label><span className={labelClass}>Danh mục *</span><select required value={productForm.category} onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value, iconType: e.target.value }))} className={inputClass}><option value="">Chọn danh mục</option>{categories.filter((item) => item.isActive).map((item) => <option key={item._id} value={item.slug}>{item.name}</option>)}</select></label>
          <label className="sm:col-span-2"><span className={labelClass}>Mô tả *</span><textarea required minLength={10} rows={4} value={productForm.description} onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))} className={inputClass + ' py-3'} /></label>
          <label><span className={labelClass}>Giá bán (VND)</span><NumericInput min={0} value={productForm.price} onValueChange={(value) => updateProductNumber('price', value)} className={inputClass} /></label>
          <label><span className={labelClass}>Giá gốc (VND)</span><NumericInput min={0} value={productForm.originalPrice} onValueChange={(value) => updateProductNumber('originalPrice', value)} className={inputClass} /></label>
          <label><span className={labelClass}>% giảm tự động</span><div className="relative"><input readOnly value={productForm.discountPercent} className={inputClass + ' cursor-default pr-20 text-amber-200'} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-amber-300/10 px-2 py-1 text-[9px] font-black text-amber-200">TỰ TÍNH</span></div></label>
          <label><span className={labelClass}>Tồn kho</span><NumericInput min={0} value={productForm.stockCount} onValueChange={(value) => updateProductNumber('stockCount', value)} className={inputClass} /></label>
          <label><span className={labelClass}>Đã bán</span><NumericInput min={0} value={productForm.soldCount} onValueChange={(value) => updateProductNumber('soldCount', value)} className={inputClass} /></label>
          <label><span className={labelClass}>Thứ tự</span><NumericInput min={0} value={productForm.sortOrder} onValueChange={(value) => updateProductNumber('sortOrder', value)} className={inputClass} /></label>
          <label><span className={labelClass}>Trạng thái</span><select value={productForm.status} onChange={(e) => setProductForm((prev) => ({ ...prev, status: e.target.value as ProductForm['status'] }))} className={inputClass}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đang bán</option><option value="ARCHIVED">Lưu trữ</option></select></label>
          <label><span className={labelClass}>Model / mã cấp phát</span><input value={productForm.model} onChange={(e) => setProductForm((prev) => ({ ...prev, model: e.target.value }))} className={inputClass} /></label>
          <label><span className={labelClass}>Hình thức giao hàng</span><select value={productForm.fulfillmentType} onChange={(e) => setProductForm((prev) => ({ ...prev, fulfillmentType: e.target.value as ProductForm['fulfillmentType'] }))} className={inputClass}><option value="MANUAL_SERVICE">Admin xử lý thủ công</option><option value="API_KEY">Tự động cấp từ kho key</option></select></label>
          <label><span className={labelClass}>Badge</span><input value={productForm.badge} onChange={(e) => setProductForm((prev) => ({ ...prev, badge: e.target.value }))} className={inputClass} /></label>
          <label><span className={labelClass}>Nhãn giao hàng</span><input value={productForm.deliveryLabel} onChange={(e) => setProductForm((prev) => ({ ...prev, deliveryLabel: e.target.value }))} className={inputClass} /></label>
          {[['Thông tin sản phẩm · mỗi dòng một ý', 'featuresText'], ['Quyền lợi / thông tin thêm', 'informationText'], ['Các bước kích hoạt', 'activationText'], ['Chính sách bảo hành', 'warrantyText']].map(([label, key]) => <label key={key}><span className={labelClass}>{label}</span><textarea rows={5} value={productForm[key as 'featuresText']} onChange={(e) => setProductForm((prev) => ({ ...prev, [key]: e.target.value }))} className={inputClass + ' py-3'} /></label>)}
          <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-[#070912] px-3 text-sm"><span>Còn hàng</span><input type="checkbox" checked={productForm.inStock} onChange={(e) => setProductForm((prev) => ({ ...prev, inStock: e.target.checked }))} /></label>
          <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-[#070912] px-3 text-sm"><span>Bật hiển thị giảm giá</span><input type="checkbox" checked={productForm.promotionEnabled} onChange={(e) => setProductForm((prev) => ({ ...prev, promotionEnabled: e.target.checked }))} /></label>
          <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-[#070912] px-3 text-sm"><span>Nổi bật</span><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm((prev) => ({ ...prev, featured: e.target.checked }))} /></label>
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-sm font-black">Các lựa chọn / SKU</h3><p className="mt-1 text-xs text-slate-500">Giá và tồn kho riêng cho từng lựa chọn.</p></div><button type="button" onClick={addVariant} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 text-xs font-bold text-cyan-100"><Plus className="size-3.5" /> Thêm lựa chọn</button></div>
            <div className="space-y-3">
              {productForm.variants.map((variant, index) => (
                <div key={variant.id} className="rounded-xl border border-white/[0.08] bg-[#070912] p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2"><span className={labelClass}>Tên lựa chọn</span><input required value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} className={inputClass} /></label>
                    <label><span className={labelClass}>Giá bán</span><NumericInput min={0} value={variant.price} onValueChange={(value) => updateVariantPrice(index, 'price', value)} className={inputClass} /></label>
                    <label><span className={labelClass}>Giá gốc</span><NumericInput min={0} value={variant.originalPrice || 0} onValueChange={(value) => updateVariantPrice(index, 'originalPrice', value)} className={inputClass} /></label>
                    <label><span className={labelClass}>Tồn kho</span><NumericInput min={0} value={variant.stockCount || 0} onValueChange={(value) => updateVariant(index, 'stockCount', value)} className={inputClass} /></label>
                    <label><span className={labelClass}>% giảm tự động</span><div className="relative"><input readOnly value={discountFromPrices(variant.price, variant.originalPrice || 0)} className={inputClass + ' cursor-default pr-20 text-amber-200'} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-amber-300/10 px-2 py-1 text-[9px] font-black text-amber-200">TỰ TÍNH</span></div></label>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-4"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(variant.inStock)} onChange={(e) => updateVariant(index, 'inStock', e.target.checked)} /> Còn hàng</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(variant.promotionEnabled)} onChange={(e) => updateVariant(index, 'promotionEnabled', e.target.checked)} /> Giảm giá</label></div>
                    <button type="button" onClick={() => removeVariant(index)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-500 hover:text-rose-200" aria-label={'Xóa lựa chọn ' + variant.name}><Trash2 className="size-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-white/10 bg-[#0c0f18]/95 p-4"><button type="button" onClick={() => setProductOpen(false)} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold">Hủy</button><button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-black text-slate-950 disabled:opacity-50"><Save className="size-4" /> Lưu sản phẩm</button></div>
      </form></div>}
    </section>
  );
}
