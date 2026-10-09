'use client';
import Link from 'next/link';
import { Bell, FolderTree, Gift, KeyRound, LayoutDashboard, Link2, LogOut, MessageCircle, Package, ReceiptText, ShieldCheck, Store, X } from 'lucide-react';
export type AdminSection = 'overview' | 'products' | 'categories' | 'contacts' | 'announcements' | 'chat' | 'orders' | 'gifts' | 'inventory';
const navClass = (active: boolean) => "relative mb-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold " + (active ? "bg-cyan-300/10 text-cyan-100" : "text-slate-400 hover:bg-white/[0.04] hover:text-white");
const NAV = [
  { id: 'overview', label: 'Bảng điều khiển', group: 'Tổng quan', icon: LayoutDashboard },
  { id: 'products', label: 'Sản phẩm', group: 'Catalog', icon: Package },
  { id: 'categories', label: 'Danh mục', group: 'Catalog', icon: FolderTree },
  { id: 'contacts', label: 'Liên hệ', group: 'Nội dung', icon: Link2 },
  { id: 'announcements', label: 'Thông báo', group: 'Nội dung', icon: Bell },
  { id: 'chat', label: 'Hội thoại', group: 'Hỗ trợ', icon: MessageCircle },
  { id: 'orders', label: 'Đơn hàng', group: 'Bán hàng', icon: ReceiptText },
  { id: 'gifts', label: 'Kho quà', group: 'Vận hành', icon: Gift },
  { id: 'inventory', label: 'Kho key', group: 'Vận hành', icon: KeyRound },
] as const;
export function AdminSidebar({ active, mobileOpen, counts, onClose, onSelect, onLogout }: {
  active: AdminSection; mobileOpen: boolean;
  counts: Record<'products' | 'categories' | 'announcements' | 'chat' | 'orders' | 'gifts', number>;
  onClose: () => void; onSelect: (value: AdminSection) => void; onLogout: () => void;
}) {
  let previousGroup = '';
  const content = <aside className="flex h-full w-72 flex-col border-r border-white/[0.07] bg-[#070912]/95">
    <div className="flex h-20 items-center gap-3 border-b border-white/[0.07] px-5">
      <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Store className="size-5" /></span>
      <div><p className="text-sm font-black">LNDHub</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">Quản trị</p></div>
      <button type="button" onClick={onClose} className="ml-auto text-slate-400 lg:hidden" aria-label="Đóng menu"><X /></button>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-5">
      {NAV.map((item) => {
        const Icon = item.icon; const showGroup = item.group !== previousGroup; previousGroup = item.group;
        const count = item.id === 'products' ? counts.products : item.id === 'categories' ? counts.categories : item.id === 'announcements' ? counts.announcements : item.id === 'chat' ? counts.chat : item.id === 'orders' ? counts.orders : item.id === 'gifts' ? counts.gifts : null;
        return <div key={item.id}>{showGroup && <h2 className="mb-2 mt-5 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 first:mt-0">{item.group}</h2>}
          <button type="button" onClick={() => onSelect(item.id)} className={navClass(active === item.id)}>
            {active === item.id && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-cyan-300" />}
            <Icon className={active === item.id ? "size-[18px] text-cyan-300" : "size-[18px] text-slate-500"} /><span className="flex-1">{item.label}</span>
            {count !== null && <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px]">{count}</span>}
          </button>
        </div>;
      })}
    </nav>
    <div className="border-t border-white/[0.07] p-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.025] p-3"><ShieldCheck className="size-5 text-violet-200" /><div className="flex-1"><p className="text-xs font-bold">LNDHub Admin</p><p className="text-[10px] text-emerald-300">Đã xác thực</p></div><button type="button" onClick={onLogout} aria-label="Đăng xuất"><LogOut className="size-4 text-slate-500" /></button></div>
      <Link href="/" className="mt-2 flex min-h-10 items-center justify-center text-xs font-bold text-slate-500 hover:text-white">Về trang shop</Link>
    </div>
  </aside>;
  return <><div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{content}</div>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" onClick={onClose} className="absolute inset-0 bg-black/70" aria-label="Đóng menu" /><div className="absolute inset-y-0 left-0">{content}</div></div>}</>;
}
