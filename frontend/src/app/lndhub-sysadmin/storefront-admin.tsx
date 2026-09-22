'use client';

import { Bell, Link2, Pencil, Plus, Radio, Save, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Announcement, StoreSettings } from '../../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const inputClass = 'min-h-11 w-full rounded-xl border border-white/10 bg-[#070912] px-3 text-sm outline-none focus:border-cyan-300/50';
const labelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500';

export default function StorefrontAdmin({ mode, credential, settings, announcements, refresh, notify }: {
  mode: 'contacts' | 'announcements';
  credential: string;
  settings: StoreSettings;
  announcements: Announcement[];
  refresh: () => Promise<void>;
  notify: (tone: 'success' | 'error', message: string) => void;
}) {
  const [contactForm, setContactForm] = useState(settings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', isActive: true });
  const [busy, setBusy] = useState(false);

  useEffect(() => setContactForm(settings), [settings]);

  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${credential}`, ...init.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Yêu cầu không thành công');
    return data;
  };

  const saveContacts = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await request('/admin/store-settings', { method: 'PUT', body: JSON.stringify(contactForm) });
      notify('success', 'Đã lưu kênh liên hệ. Trang khách được cập nhật realtime.');
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
    finally { setBusy(false); }
  };

  const resetAnnouncement = () => {
    setEditingId(null);
    setAnnouncementForm({ title: '', message: '', isActive: true });
  };
  const editAnnouncement = (item: Announcement) => {
    setEditingId(item._id);
    setAnnouncementForm({ title: item.title, message: item.message, isActive: item.isActive });
  };
  const saveAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await request(editingId ? `/admin/announcements/${editingId}` : '/admin/announcements', {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(announcementForm),
      });
      notify('success', editingId ? 'Đã cập nhật thông báo realtime.' : 'Đã phát thông báo realtime tới khách đang mở web.');
      resetAnnouncement();
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
    finally { setBusy(false); }
  };
  const toggleAnnouncement = async (item: Announcement) => {
    try {
      await request(`/admin/announcements/${item._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !item.isActive }) });
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
  };
  const deleteAnnouncement = async (item: Announcement) => {
    if (!window.confirm(`Xóa thông báo “${item.title}”?`)) return;
    try {
      await request(`/admin/announcements/${item._id}`, { method: 'DELETE' });
      if (editingId === item._id) resetAnnouncement();
      notify('success', 'Đã xóa thông báo.');
      await refresh();
    } catch (error) { notify('error', (error as Error).message); }
  };

  if (mode === 'contacts') return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <form onSubmit={saveContacts} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5">
        <div className="mb-5"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300"><Link2 className="size-4" /> Kênh hỗ trợ</p><h2 className="mt-2 text-xl font-black">Liên hệ ngoài trang shop</h2><p className="mt-1 text-sm text-slate-500">Dán đường dẫn mới và bấm lưu; khách đang mở web sẽ nhận thay đổi realtime.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={labelClass}>Telegram URL *</span><input required type="url" value={contactForm.telegramUrl} onChange={(e) => setContactForm((prev) => ({ ...prev, telegramUrl: e.target.value }))} className={inputClass} /></label>
          <label><span className={labelClass}>Tên Telegram</span><input maxLength={80} value={contactForm.telegramHandle} onChange={(e) => setContactForm((prev) => ({ ...prev, telegramHandle: e.target.value }))} className={inputClass} /></label>
          <label><span className={labelClass}>Mô tả Telegram</span><input maxLength={160} value={contactForm.telegramDescription} onChange={(e) => setContactForm((prev) => ({ ...prev, telegramDescription: e.target.value }))} className={inputClass} /></label>
          <label className="sm:col-span-2"><span className={labelClass}>Zalo URL *</span><input required type="url" value={contactForm.zaloUrl} onChange={(e) => setContactForm((prev) => ({ ...prev, zaloUrl: e.target.value }))} className={inputClass} /></label>
          <label><span className={labelClass}>Tên kênh Zalo</span><input maxLength={80} value={contactForm.zaloLabel} onChange={(e) => setContactForm((prev) => ({ ...prev, zaloLabel: e.target.value }))} className={inputClass} /></label>
          <label><span className={labelClass}>Mô tả Zalo</span><input maxLength={160} value={contactForm.zaloDescription} onChange={(e) => setContactForm((prev) => ({ ...prev, zaloDescription: e.target.value }))} className={inputClass} /></label>
          <label className="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-[#070912] px-3 text-sm sm:col-span-2"><span>Hiển thị khối liên hệ ngoài shop</span><input type="checkbox" checked={contactForm.contactEnabled} onChange={(e) => setContactForm((prev) => ({ ...prev, contactEnabled: e.target.checked }))} className="size-4 accent-cyan-300" /></label>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 sm:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-sm font-black text-amber-100">Giờ nghỉ tự động</p><p className="mt-1 text-xs text-slate-500">Trong khung này sản phẩm vẫn hiện nhưng thao tác được khóa.</p></div><input type="checkbox" checked={contactForm.businessHoursEnabled} onChange={(e) => setContactForm((prev) => ({ ...prev, businessHoursEnabled: e.target.checked }))} className="size-4 accent-amber-300" /></div>
            <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Bắt đầu nghỉ</span><input type="time" required value={contactForm.restStart} onChange={(e) => setContactForm((prev) => ({ ...prev, restStart: e.target.value }))} className={inputClass} /></label><label><span className={labelClass}>Mở lại</span><input type="time" required value={contactForm.restEnd} onChange={(e) => setContactForm((prev) => ({ ...prev, restEnd: e.target.value }))} className={inputClass} /></label></div>
            <label className="mt-3 block"><span className={labelClass}>Múi giờ</span><input readOnly value={contactForm.timeZone} className={inputClass + ' text-slate-500'} /></label>
          </div>
        </div>
        <button type="submit" disabled={busy} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-black text-slate-950 disabled:opacity-50"><Save className="size-4" /> {busy ? 'Đang lưu...' : 'Lưu liên hệ và giờ hoạt động'}</button>
      </form>
      <aside className="h-fit rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5"><Radio className="size-8 text-emerald-200" /><h3 className="mt-4 font-black">Đồng bộ realtime</h3><p className="mt-2 text-sm leading-6 text-slate-400">Thông tin được lưu trong MongoDB. Backend phát sự kiện tới mọi trang khách đang kết nối sau khi anh bấm lưu.</p></aside>
    </section>
  );

  const limitReached = announcements.length >= 10 && !editingId;
  return (
    <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={saveAnnouncement} className="h-fit rounded-2xl border border-white/[0.08] bg-[#0f121d] p-5 xl:sticky xl:top-24">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-200">Realtime broadcast</p><h2 className="mt-2 font-black">{editingId ? 'Sửa thông báo' : 'Gửi thông báo'}</h2><p className="mt-1 text-xs leading-5 text-slate-500">Lưu DB và hiện ngay trên web khách, không cần tải lại.</p></div>{editingId && <button type="button" onClick={resetAnnouncement} aria-label="Hủy chỉnh sửa"><X className="size-4" /></button>}</div>
        <div className="space-y-4">
          <label><span className={labelClass}>Tiêu đề *</span><input required minLength={2} maxLength={80} value={announcementForm.title} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))} className={inputClass} placeholder="Ví dụ: Hàng mới đã về" /></label>
          <label><span className={labelClass}>Nội dung *</span><textarea required minLength={2} maxLength={600} rows={7} value={announcementForm.message} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))} className={inputClass + ' py-3'} /><span className="mt-1 block text-right text-[10px] text-slate-600">{announcementForm.message.length}/600</span></label>
          <label className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-[#070912] px-3 text-sm"><span>Hiển thị với khách</span><input type="checkbox" checked={announcementForm.isActive} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="size-4 accent-cyan-300" /></label>
          <button type="submit" disabled={busy || limitReached} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 text-sm font-black text-slate-950 disabled:opacity-40"><Plus className="size-4" /> {busy ? 'Đang gửi...' : editingId ? 'Lưu và phát cập nhật' : limitReached ? 'Đã đủ 10 tin' : 'Gửi thông báo realtime'}</button>
        </div>
      </form>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-black">Lịch sử thông báo</h2><p className="mt-1 text-sm text-slate-500">Tối đa 10 tin gần nhất trong MongoDB.</p></div><span className="rounded-full bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">{announcements.length}/10</span></div>
        <div className="space-y-3">
          {announcements.map((item) => <article key={item._id} className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-4">
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-200"><Bell className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{item.title}</h3><time className="text-[10px] font-bold text-fuchsia-200/70">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.publishedAt))}</time></div><button type="button" onClick={() => void toggleAnnouncement(item)} className={item.isActive ? 'rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-200' : 'rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-500'}>{item.isActive ? 'ĐANG HIỆN' : 'ĐANG ẨN'}</button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{item.message}</p><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => editAnnouncement(item)} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold"><Pencil className="size-3.5" /> Sửa</button><button type="button" onClick={() => void deleteAnnouncement(item)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-slate-500 hover:text-rose-200" aria-label={`Xóa ${item.title}`}><Trash2 className="size-4" /></button></div></div></div>
          </article>)}
          {!announcements.length && <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center"><div><Bell className="mx-auto size-8 text-slate-700" /><p className="mt-3 text-sm font-bold text-slate-400">Chưa có thông báo</p><p className="mt-1 text-xs text-slate-600">Tin đầu tiên sẽ hiện ngay cho khách đang online.</p></div></div>}
        </div>
      </div>
    </section>
  );
}
