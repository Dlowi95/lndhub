'use client';

import { Archive, CheckCircle2, LoaderCircle, MessageCircle, RefreshCw, RotateCcw, Send } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatConversation, ChatConversationDetail } from '../../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ChatAdmin({ credential, conversations, refresh, notify }: {
  credential: string;
  conversations: ChatConversation[];
  refresh: () => Promise<void>;
  notify: (tone: 'success' | 'error', message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<ChatConversationDetail | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const adminApi = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${credential}`, ...init.headers },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Yêu cầu không thành công');
    return payload as T;
  }, [credential]);

  const loadDetail = useCallback(async (id: string, quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);
    try {
      const payload = await adminApi<{ data: ChatConversationDetail }>(`/admin/chat/conversations/${encodeURIComponent(id)}`);
      setDetail(payload.data);
    } catch (error) {
      if (!quiet) notify('error', (error as Error).message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [adminApi, notify]);

  useEffect(() => {
    if (!conversations.length) {
      setSelectedId('');
      setDetail(null);
      return;
    }
    if (selectedId && conversations.some((item) => item._id === selectedId)) return;
    const next = conversations.find((item) => item.unreadForAdmin > 0) || conversations[0];
    setSelectedId(next._id);
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
    const timer = window.setInterval(() => void loadDetail(selectedId, true), 5_000);
    return () => window.clearInterval(timer);
  }, [loadDetail, selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [detail?.messages.length]);

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!selectedId || !body || sending) return;
    setSending(true);
    try {
      await adminApi(`/admin/chat/conversations/${encodeURIComponent(selectedId)}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
      setDraft('');
      await Promise.all([loadDetail(selectedId, true), refresh()]);
    } catch (error) {
      notify('error', (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: 'OPEN' | 'CLOSED') => {
    if (!selectedId) return;
    try {
      await adminApi(`/admin/chat/conversations/${encodeURIComponent(selectedId)}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      notify('success', status === 'CLOSED' ? 'Đã kết thúc cuộc trò chuyện.' : 'Đã mở lại cuộc trò chuyện.');
      await Promise.all([loadDetail(selectedId, true), refresh()]);
    } catch (error) {
      notify('error', (error as Error).message);
    }
  };

  const openCount = useMemo(() => conversations.filter((item) => item.status === 'OPEN').length, [conversations]);
  const unreadCount = useMemo(() => conversations.reduce((sum, item) => sum + item.unreadForAdmin, 0), [conversations]);
  const selected = detail?.conversation;

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm text-slate-400">Khách nhắn ngay trên website, không cần tạo tài khoản.</p><p className="mt-1 text-xs text-slate-600">{openCount} cuộc đang mở · {unreadCount} tin chưa đọc · tự lưu tối đa 90 ngày</p></div>
      <button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300"><RefreshCw className="size-4" /> Làm mới hộp thư</button>
    </div>

    <div className="grid min-h-[650px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0f121d] xl:grid-cols-[370px_1fr]">
      <aside className="border-b border-white/[0.07] xl:border-b-0 xl:border-r">
        <header className="border-b border-white/[0.07] p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><MessageCircle className="size-5" /></span><div><h2 className="font-black">Hộp thư website</h2><p className="text-xs text-slate-500">Tin mới được đưa lên đầu</p></div></div></header>
        <div className="max-h-[580px] overflow-y-auto p-2">
          {!conversations.length && <div className="grid min-h-48 place-items-center px-6 text-center"><div><MessageCircle className="mx-auto size-7 text-slate-700" /><p className="mt-3 text-sm font-bold text-slate-400">Chưa có hội thoại</p><p className="mt-1 text-xs leading-5 text-slate-600">Khi khách nhắn trên website, cuộc trò chuyện sẽ xuất hiện ở đây.</p></div></div>}
          {conversations.map((conversation) => <button type="button" key={conversation._id} onClick={() => setSelectedId(conversation._id)} className={`mb-1 w-full rounded-2xl border p-3 text-left transition ${selectedId === conversation._id ? 'border-cyan-300/25 bg-cyan-300/[0.08]' : 'border-transparent hover:bg-white/[0.035]'}`}>
            <div className="flex items-start gap-3"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${conversation.unreadForAdmin ? 'bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.7)]' : conversation.status === 'OPEN' ? 'bg-emerald-400/70' : 'bg-slate-700'}`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-slate-100">{conversation.displayName || 'Khách web'}</strong><time className="shrink-0 text-[9px] text-slate-600">{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(conversation.lastMessageAt))}</time></div><p className="mt-1 truncate text-xs text-slate-500">{conversation.lastMessagePreview || 'Cuộc trò chuyện mới'}</p><div className="mt-2 flex items-center gap-2"><span className={conversation.status === 'OPEN' ? 'rounded-md bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300' : 'rounded-md bg-white/[0.05] px-2 py-0.5 text-[9px] font-bold text-slate-500'}>{conversation.status === 'OPEN' ? 'Đang mở' : 'Đã kết thúc'}</span>{conversation.orderCode && <span className="text-[9px] text-amber-200">#{conversation.orderCode}</span>}{conversation.unreadForAdmin > 0 && <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-cyan-300 px-1.5 py-0.5 text-[9px] font-black text-slate-950">{conversation.unreadForAdmin}</span>}</div></div></div>
          </button>)}
        </div>
      </aside>

      <div className="flex min-h-[650px] min-w-0 flex-col">
        {!selectedId ? <div className="grid flex-1 place-items-center p-8 text-center"><div><MessageCircle className="mx-auto size-10 text-slate-800" /><p className="mt-4 font-black text-slate-400">Chọn một cuộc trò chuyện</p></div></div> : <>
          <header className="flex min-h-20 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate font-black">{selected?.displayName || 'Khách web'}</h2>{selected && <span className={selected.status === 'OPEN' ? 'rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300' : 'rounded-full bg-slate-500/10 px-2 py-1 text-[9px] font-black text-slate-500'}>{selected.status === 'OPEN' ? 'ĐANG MỞ' : 'ĐÃ KẾT THÚC'}</span>}</div><p className="mt-1 text-xs text-slate-600">{selected?.orderCode ? `Đơn liên quan: ${selected.orderCode}` : `Mã hội thoại: ${selectedId.slice(-8).toUpperCase()}`}</p></div>{selected?.status === 'CLOSED' ? <button type="button" onClick={() => void updateStatus('OPEN')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/20 px-3 text-xs font-bold text-emerald-300"><RotateCcw className="size-4" /> <span className="hidden sm:inline">Mở lại</span></button> : <button type="button" onClick={() => void updateStatus('CLOSED')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold text-slate-400"><Archive className="size-4" /> <span className="hidden sm:inline">Kết thúc</span></button>}</header>

          <div className="flex-1 overflow-y-auto bg-[#090c15]/50 p-4 sm:p-6">
            {loading && !detail && <div className="grid min-h-48 place-items-center"><LoaderCircle className="size-6 animate-spin text-cyan-300" /></div>}
            {detail?.messages.length === 0 && <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-dashed border-white/10 p-6 text-center"><p className="text-sm font-bold text-slate-400">Khách vừa mở cuộc trò chuyện</p><p className="mt-2 text-xs leading-5 text-slate-600">Chưa có tin nhắn nào. Anh có thể chủ động gửi lời chào.</p></div>}
            {detail?.messages.map((message) => <article key={message._id} className={`mb-3 max-w-[82%] rounded-2xl px-4 py-3 ${message.sender === 'ADMIN' ? 'ml-auto rounded-br-md bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-950' : 'rounded-bl-md border border-white/[0.08] bg-white/[0.055] text-slate-200'}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><time className={`mt-1.5 block text-[9px] ${message.sender === 'ADMIN' ? 'text-right text-slate-800/60' : 'text-slate-600'}`}>{new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(message.createdAt))}</time></article>)}
            <div ref={endRef} />
          </div>

          <form onSubmit={sendReply} className="border-t border-white/[0.07] bg-[#0c0f19] p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#070912] p-2 focus-within:border-cyan-300/30"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={2} maxLength={1000} placeholder="Nhập câu trả lời… (Enter để gửi)" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-700" /><button type="submit" disabled={!draft.trim() || sending} className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950 disabled:opacity-40">{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div><div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-600"><span>Shift + Enter để xuống dòng</span>{selected?.status === 'CLOSED' && <span className="inline-flex items-center gap-1 text-emerald-400/70"><CheckCircle2 className="size-3" /> Gửi tin sẽ tự mở lại</span>}</div></form>
        </>}
      </div>
    </div>
  </section>;
}
