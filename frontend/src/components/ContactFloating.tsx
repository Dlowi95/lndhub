'use client';

import { ExternalLink, MessageCircle, X } from 'lucide-react';
import { Mascot } from 'page-mascot';
import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FaTelegram } from 'react-icons/fa6';
import { SiZalo } from 'react-icons/si';
import { StoreSettings } from '../lib/types';

export function ContactFloating({ settings }: { settings: StoreSettings }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const mascotArtRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    activeTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const mascotButton = mascotArtRef.current?.querySelector('button');
    if (!mascotButton) return;
    mascotButton.tabIndex = -1;
    mascotButton.setAttribute('aria-hidden', 'true');
  }, [settings.contactEnabled]);

  useEffect(() => {
    if (!open) return;

    firstLinkRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeAndRestoreFocus();
    };
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

  const toggleContact = (event: MouseEvent<HTMLButtonElement>) => {
    activeTriggerRef.current = event.currentTarget;
    mascotArtRef.current?.querySelector('button')?.click();
    setOpen((value) => !value);
  };

  if (!settings.contactEnabled) return null;
  return (
    <div className="contact-floating" ref={rootRef}>
      {open && (
        <section id="contact-popover" className="contact-popover" role="dialog" aria-labelledby="contact-popover-title">
          <div className="contact-popover__header">
            <span><MessageCircle size={19} aria-hidden="true" /></span>
            <div><h2 id="contact-popover-title">Liên hệ LNDHub</h2><p>Chọn kênh thuận tiện cho anh nhé.</p></div>
            <button type="button" onClick={closeAndRestoreFocus} aria-label="Đóng bảng liên hệ"><X size={18} aria-hidden="true" /></button>
          </div>
          <div className="contact-channel-list">
            <a ref={firstLinkRef} className="contact-channel contact-channel--telegram" href={settings.telegramUrl} target="_blank" rel="noreferrer">
              <span className="contact-brand-icon" aria-hidden="true"><FaTelegram /></span>
              <span><strong>Nhắn Telegram</strong><small>{settings.telegramHandle}</small></span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
            <a className="contact-channel contact-channel--zalo" href={settings.zaloUrl} target="_blank" rel="noreferrer">
              <span className="contact-brand-icon" aria-hidden="true"><SiZalo /></span>
              <span><strong>Tham gia Zalo</strong><small>{settings.zaloLabel}</small></span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="contact-popover__note">Kênh chính thức: Telegram <strong>{settings.telegramHandle}</strong></p>
        </section>
      )}
      <div className={open ? 'contact-mascot contact-mascot--open' : 'contact-mascot'}>
        <div ref={mascotArtRef} className="contact-mascot__art" aria-hidden="true">
          <Mascot directions="/mascots/cube-directions.webp" reactions="/mascots/cube-reactions.webp" size={96} label="cube" />
        </div>
        <button
          type="button"
          className="contact-mascot__trigger"
          onClick={toggleContact}
          aria-controls="contact-popover"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={open ? 'Đóng bảng liên hệ LNDHub' : 'Mở bảng liên hệ LNDHub'}
        >
          <span className="contact-mascot__label" aria-hidden="true"><i />{open ? 'Đóng' : 'Liên hệ'}</span>
        </button>
      </div>
      <button
        type="button"
        className="contact-trigger contact-trigger--mobile"
        onClick={toggleContact}
        aria-controls="contact-popover"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? 'Đóng bảng liên hệ LNDHub' : 'Mở bảng liên hệ LNDHub'}
      >
        {open ? <X size={21} aria-hidden="true" /> : <MessageCircle size={21} aria-hidden="true" />}
        <span>{open ? 'Đóng' : 'Liên hệ'}</span>
      </button>
    </div>
  );
}
