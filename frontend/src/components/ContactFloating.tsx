'use client';

import { ArrowLeft, ExternalLink, LoaderCircle, MessageCircle, RefreshCw, Send, X } from 'lucide-react';
import { Mascot } from 'page-mascot';
import { type FormEvent, type KeyboardEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FaTelegram } from 'react-icons/fa6';
import { SiZalo } from 'react-icons/si';
import { useStoreAvailability } from '../lib/store-hours';
import { ChatConversationDetail, ChatMessage, StoreSettings } from '../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CHAT_STORAGE_KEY = 'lndhub-chat-session-v1';
type StoredSession = { id: string; token: string };

export function ContactFloating({ settings }: { settings: StoreSettings }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'channels' | 'chat'>('channels');
  const [session, setSession] = useState<StoredSession | null>(null);
  const [detail, setDetail] = useState<ChatConversationDetail | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const mascotArtRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const availability = useStoreAvailability(settings);

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    activeTriggerRef.current?.focus();
  }, []);

  const readStoredSession = useCallback((): StoredSession | null => {
    try {
      const value = JSON.parse(window.localStorage.getItem(CHAT_STORAGE_KEY) || 'null') as StoredSession | null;
      return value?.id && value?.token ? value : null;
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      return null;
    }
  }, []);

  const loadSession = useCallback(async (current: StoredSession, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chat/sessions/${encodeURIComponent(current.id)}`, {
        cache: 'no-store', headers: { 'X-Chat-Token': current.token },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Không tải được cuộc trò chuyện');
      setDetail(payload.data as ChatConversationDetail);
      setError('');
      return true;
    } catch (caught) {
      if (!quiet) setError(caught instanceof Error ? caught.message : 'Không thể kết nối hỗ trợ');
      return false;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const createSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Chưa thể bắt đầu trò chuyện');
      const current = { id: payload.data.conversation._id as string, token: payload.data.token as string };
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(current));
      setSession(current);
      setDetail({ conversation: payload.data.conversation, messages: payload.data.messages || [] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể kết nối hỗ trợ');
    } finally {
      setLoading(false);
    }
  }, []);

  const openWebChat = useCallback(async () => {
    setView('chat');
    const stored = readStoredSession();
    if (stored) {
      setSession(stored);
      if (await loadSession(stored)) return;
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      setSession(null);
    }
    await createSession();
  }, [createSession, loadSession, readStoredSession]);

  const startNewChat = useCallback(async () => {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
    setSession(null);
    setDetail(null);
    setDraft('');
    await createSession();
  }, [createSession]);

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !session || sending || detail?.conversation.status === 'CLOSED') return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/chat/sessions/${encodeURIComponent(session.id)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Chat-Token': session.token },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Không gửi được tin nhắn');
      setDraft('');
      setDetail((current) => current ? { ...current, messages: [...current.messages, payload.data as ChatMessage] } : current);
      window.setTimeout(() => void loadSession(session, true), 250);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không gửi được tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  useEffect(() => {
    const mascotButton = mascotArtRef.current?.querySelector('button');
    if (!mascotButton) return;
    mascotButton.tabIndex = -1;
    mascotButton.setAttribute('aria-hidden', 'true');
  }, [settings.contactEnabled]);

  useEffect(() => {
    if (!open) return;
    firstActionRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && closeAndRestoreFocus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [closeAndRestoreFocus, open]);

  useEffect(() => {
    if (!open || view !== 'chat' || !session) return;
    const timer = window.setInterval(() => void loadSession(session, true), 5_000);
    return () => window.clearInterval(timer);
  }, [loadSession, open, session, view]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [detail?.messages.length]);

  const toggleContact = (event: MouseEvent<HTMLButtonElement>) => {
    activeTriggerRef.current = event.currentTarget;
    mascotArtRef.current?.querySelector('button')?.click();
    setOpen((value) => !value);
  };

  if (!settings.contactEnabled) return null;
  const closed = detail?.conversation.status === 'CLOSED';
  return (
    <div className="contact-floating" ref={rootRef}>
      {open && (
        <section id="contact-popover" className={`contact-popover ${view === 'chat' ? 'contact-popover--chat' : ''}`} role="dialog" aria-labelledby="contact-popover-title">
          <div className="contact-popover__header">
            {view === 'chat' ? (
              <button ref={firstActionRef} type="button" onClick={() => setView('channels')} aria-label="Quay lại chọn kênh"><ArrowLeft size={18} /></button>
            ) : <span><MessageCircle size={19} aria-hidden="true" /></span>}
            <div>
              <h2 id="contact-popover-title">{view === 'chat' ? 'Chat cùng LNDHub' : 'Liên hệ LNDHub'}</h2>
              <p>{view === 'chat' ? (availability.isResting ? `${availability.statusLabel} · ${availability.reopensLabel}` : 'Thường phản hồi trong vài phút') : 'Anh chọn kênh thuận tiện nhất nhé.'}</p>
            </div>
            <button type="button" onClick={closeAndRestoreFocus} aria-label="Đóng bảng liên hệ"><X size={18} aria-hidden="true" /></button>
          </div>

          {view === 'channels' ? <>
            <div className="contact-channel-list">
              <button ref={firstActionRef} type="button" className="contact-channel contact-channel--web" onClick={() => void openWebChat()}>
                <span className="contact-brand-icon" aria-hidden="true"><MessageCircle /></span>
                <span><strong>Chat ngay trên web</strong><small>Không cần đăng nhập · có lưu lịch sử</small></span>
                <span className="contact-live-dot" aria-hidden="true" />
              </button>
              <a className="contact-channel contact-channel--telegram" href={settings.telegramUrl} target="_blank" rel="noreferrer">
                <span className="contact-brand-icon" aria-hidden="true"><FaTelegram /></span>
                <span><strong>Chat trực tiếp trên Telegram</strong><small>{settings.telegramHandle}</small></span>
                <ExternalLink size={16} aria-hidden="true" />
              </a>
              <a className="contact-channel contact-channel--zalo" href={settings.zaloUrl} target="_blank" rel="noreferrer">
                <span className="contact-brand-icon" aria-hidden="true"><SiZalo /></span>
                <span><strong>Tham gia Zalo</strong><small>{settings.zaloLabel}</small></span>
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="contact-popover__note">Chat web được lưu riêng trên thiết bị này trong tối đa 90 ngày.</p>
          </> : (
            <div className="web-chat">
              <div className="web-chat__messages" aria-live="polite">
                <div className="web-chat__welcome"><strong>LNDHub xin chào 👋</strong><p>Anh cần tư vấn sản phẩm hay hỗ trợ đơn hàng, cứ nhắn tại đây nhé.</p></div>
                {loading && !detail && <div className="web-chat__loading"><LoaderCircle className="spin" size={18} /> Đang mở cuộc trò chuyện…</div>}
                {detail?.messages.map((message) => <article key={message._id} className={`web-chat__message web-chat__message--${message.sender.toLowerCase()}`}>
                  <p>{message.body}</p><time>{new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt))}</time>
                </article>)}
                <div ref={messageEndRef} />
              </div>
              {error && <div className="web-chat__error"><span>{error}</span>{session && <button type="button" onClick={() => void loadSession(session)}><RefreshCw size={14} /> Thử lại</button>}</div>}
              {closed ? <div className="web-chat__closed"><p>Cuộc trò chuyện này đã kết thúc.</p><button type="button" onClick={() => void startNewChat()}>Bắt đầu cuộc trò chuyện mới</button></div> : (
                <form className="web-chat__composer" onSubmit={(event) => void sendMessage(event)}>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} maxLength={1000} rows={2} disabled={!session || sending} placeholder="Nhập tin nhắn…" aria-label="Nội dung tin nhắn" />
                  <button type="submit" disabled={!draft.trim() || !session || sending} aria-label="Gửi tin nhắn">{sending ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}</button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
      <div className={open ? 'contact-mascot contact-mascot--open' : 'contact-mascot'}>
        <div ref={mascotArtRef} className="contact-mascot__art" aria-hidden="true"><Mascot directions="/mascots/cube-directions.webp" reactions="/mascots/cube-reactions.webp" size={96} label="cube" /></div>
        <button type="button" className="contact-mascot__trigger" onClick={toggleContact} aria-controls="contact-popover" aria-expanded={open} aria-haspopup="dialog" aria-label={open ? 'Đóng bảng liên hệ LNDHub' : 'Mở bảng liên hệ LNDHub'}>
          <span className="contact-mascot__label" aria-hidden="true"><i />{open ? 'Đóng' : 'Liên hệ'}</span>
        </button>
      </div>
      <button type="button" className="contact-trigger contact-trigger--mobile" onClick={toggleContact} aria-controls="contact-popover" aria-expanded={open} aria-haspopup="dialog" aria-label={open ? 'Đóng bảng liên hệ LNDHub' : 'Mở bảng liên hệ LNDHub'}>
        {open ? <X size={21} aria-hidden="true" /> : <MessageCircle size={21} aria-hidden="true" />}<span>{open ? 'Đóng' : 'Liên hệ'}</span>
      </button>
    </div>
  );
}
