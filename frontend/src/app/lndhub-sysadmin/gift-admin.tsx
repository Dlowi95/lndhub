'use client';

import { Gift, PackagePlus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GiftAdminData, GiftAdminItem } from '../../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const inputClass = 'min-h-11 w-full rounded-xl border border-white/10 bg-[#070912] px-3 text-sm outline-none focus:border-cyan-300/50';
const labelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500';

export default function GiftAdmin({ credential, data, refresh, notify }: {
  credential: string;
  data: GiftAdminData;
  refresh: () => Promise<void>;
  notify: (tone: 'success' | 'error', message: string) => void;
}) {
  const [form, setForm] = useState({ enabled: data.enabled, title: data.title, description: data.description, cooldownHours: data.cooldownHours });
  const [cooldownDraft, setCooldownDraft] = useState(String(data.cooldownHours));
  const [items, setItems] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setForm({ enabled: data.enabled, title: data.title, description: data.description, cooldownHours: data.cooldownHours });
    setCooldownDraft(String(data.cooldownHours));
  }, [data]);

  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${credential}`, ...init.headers } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Yêu cầu không thành công');
    return payload;
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await request('/admin/gifts/settings', { method: 'PUT', body: JSON.stringify(form) });
      notify('success', form.enabled ? 'Đã kích hoạt kho quà realtime.' : 'Đã tạm dừng kho quà.');
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
    finally { setBusy(false); }
  };

  const importItems = async (event: React.FormEvent) => {
    event.preventDefault();
    const values = items.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!values.length) return;
    setBusy(true);
    try {
      const result = await request('/admin/gifts/import', { method: 'POST', body: JSON.stringify({ items: values }) }) as { data: { imported: number; skipped: number } };
      setItems('');
      notify('success', `Đã nạp ${result.data.imported} quà; bỏ qua ${result.data.skipped} dòng trùng.`);
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
    finally { setBusy(false); }
  };

  const removeItem = async (item: GiftAdminItem) => {
    if (!window.confirm('Xóa phần quà chưa cấp phát này?')) return;
    try {
      await request(`/admin/gifts/${item._id}`, { method: 'DELETE' });
      notify('success', 'Đã xóa phần quà khỏi kho.');
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
  };

  return (
    <section className="space-y-5">
      {!data.encryptionConfigured && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100"><strong>Kho quà chưa có khóa mã hóa.</strong><p className="mt-1 text-xs leading-5 text-rose-100/70">Thêm GIFT_ENCRYPTION_KEY vào backend trước khi nạp quà. Không thay khóa sau khi đã có dữ liệu.</p></div>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Tổng quà', data.total, 'Đã nhập vào hệ thống'], ['Đã phát', data.claimed, 'Không thể cấp lại'], ['Còn lại', data.remaining, data.enabled ? 'Đang sẵn sàng nhận' : 'Chương trình đang tắt']].map(([label, value, note]) => <article key={String(label)} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-cyan-100">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="space-y-5">
          <form onSubmit={saveSettings} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Gift campaign</p><h2 className="mt-2 text-xl font-black">Kích hoạt quà GPT Plus</h2></div><input type="checkbox" checked={form.enabled} onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))} className="mt-1 size-5 accent-cyan-300" aria-label="Bật kho quà" /></div>
            <div className="space-y-4">
              <label><span className={labelClass}>Tiêu đề</span><input required maxLength={100} value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className={inputClass} /></label>
              <label><span className={labelClass}>Mô tả</span><textarea required maxLength={240} rows={4} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className={inputClass + ' py-3'} /></label>
              <label><span className={labelClass}>Giới hạn theo IP (giờ)</span><input type="text" inputMode="numeric" value={cooldownDraft} onChange={(event) => { const next = event.target.value.replace(/\D/g, '').slice(0, 3); setCooldownDraft(next); if (next) setForm((prev) => ({ ...prev, cooldownHours: Math.min(168, Math.max(1, Number(next))) })); }} onBlur={() => { const normalized = Math.min(168, Math.max(1, Number(cooldownDraft) || 24)); setCooldownDraft(String(normalized)); setForm((prev) => ({ ...prev, cooldownHours: normalized })); }} className={inputClass} /></label>
            </div>
            <button type="submit" disabled={busy} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 text-sm font-black text-slate-950 disabled:opacity-50"><Save className="size-4" /> Lưu và cập nhật realtime</button>
          </form>
          <form onSubmit={importItems} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5">
            <PackagePlus className="size-7 text-emerald-300" /><h2 className="mt-3 font-black">Nạp quà vào kho</h2><p className="mt-1 text-xs leading-5 text-slate-500">Mỗi dòng là một mã, link kích hoạt hoặc thông tin bàn giao hợp pháp. Dữ liệu được mã hóa trước khi lưu MongoDB.</p>
            <textarea required rows={8} value={items} onChange={(event) => setItems(event.target.value)} className={inputClass + ' mt-4 p-3 font-mono text-cyan-100'} placeholder={'Mỗi dòng một phần quà\nKhông nhập cookie phiên'} />
            <button type="submit" disabled={busy || !data.encryptionConfigured} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-slate-950 disabled:opacity-40"><Gift className="size-4" /> Nạp vào kho quà</button>
          </form>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f121d]">
          <div className="flex items-center justify-between border-b border-white/[0.08] p-5"><div><h2 className="font-black">Danh sách đã che</h2><p className="mt-1 text-xs text-slate-500">API admin không trả về nội dung quà đầy đủ.</p></div><ShieldCheck className="size-6 text-emerald-300" /></div>
          <div className="divide-y divide-white/[0.06]">
            {data.items.map((item) => <article key={item._id} className="flex items-center gap-3 p-4"><span className={item.status === 'AVAILABLE' ? 'size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.7)]' : 'size-2 rounded-full bg-slate-600'} /><div className="min-w-0 flex-1"><p className="truncate font-mono text-sm text-slate-200">{item.preview}</p><p className="mt-1 text-[10px] text-slate-500">{item.status === 'AVAILABLE' ? 'Sẵn sàng cấp phát' : `Đã nhận ${item.claimedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.claimedAt)) : ''}`}</p></div>{item.status === 'AVAILABLE' && <button type="button" onClick={() => void removeItem(item)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-500 hover:text-rose-200" aria-label="Xóa quà"><Trash2 className="size-4" /></button>}</article>)}
            {!data.items.length && <div className="grid min-h-64 place-items-center p-8 text-center"><div><Gift className="mx-auto size-9 text-slate-700" /><p className="mt-3 text-sm font-bold text-slate-400">Kho quà đang trống</p><p className="mt-1 text-xs text-slate-600">Nạp quà rồi bật chương trình khi sẵn sàng.</p></div></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
