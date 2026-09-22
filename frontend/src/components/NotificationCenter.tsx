'use client';

import { Bell, List, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Announcement } from '../lib/types';

const formatTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value));

export function NotificationCenter({ announcements }: { announcements: Announcement[] }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const latest = announcements[0];
  const dismissKey = useMemo(() => latest ? `lndhub-announcement-${latest._id}-${latest.updatedAt || latest.publishedAt}` : '', [latest]);

  useEffect(() => {
    if (!latest || !dismissKey || window.localStorage.getItem(dismissKey)) {
      setToastOpen(false);
      return;
    }
    setToastOpen(true);
    const timer = window.setTimeout(() => setToastOpen(false), 5000);
    return () => window.clearTimeout(timer);
  }, [dismissKey, latest]);

  useEffect(() => {
    if (!panelOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [panelOpen]);

  if (!announcements.length) return null;

  const dismissToast = () => {
    setToastOpen(false);
    if (dismissKey) window.localStorage.setItem(dismissKey, 'dismissed');
  };

  return (
    <div className="notification-dock">
      {toastOpen && latest && (
        <aside className="announcement-toast" aria-live="polite" aria-label="Thông báo mới từ LNDHub">
          <span className="announcement-icon"><Bell size={21} /></span>
          <div>
            <div className="announcement-heading"><strong>{latest.title}</strong><time>{formatTime(latest.publishedAt)}</time></div>
            <p>{latest.message}</p>
            <button type="button" onClick={() => { setPanelOpen(true); dismissToast(); }}><List size={14} /> Xem các tin khác</button>
          </div>
          <button type="button" className="announcement-close" onClick={dismissToast} aria-label="Đóng thông báo"><X size={17} /></button>
        </aside>
      )}

      {panelOpen && (
        <section className="announcement-panel" role="dialog" aria-modal="false" aria-label="Thông báo của shop">
          <header><div><span>Thông báo của shop</span><strong>{announcements.length}/10 tin</strong></div><button type="button" onClick={() => setPanelOpen(false)} aria-label="Đóng danh sách thông báo"><X size={18} /></button></header>
          <div className="announcement-list">
            {announcements.map((item) => (
              <article key={item._id}>
                <span className="announcement-icon"><Bell size={18} /></span>
                <div><div className="announcement-heading"><strong>{item.title}</strong><time>{formatTime(item.publishedAt)}</time></div><p>{item.message}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <button type="button" className="notification-trigger" onClick={() => setPanelOpen((value) => !value)} aria-expanded={panelOpen} aria-label={`Mở ${announcements.length} thông báo của shop`}>
        <Bell size={22} /><span>Thông báo</span><strong>{announcements.length}</strong>
      </button>
    </div>
  );
}
