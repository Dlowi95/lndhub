'use client';

import { ArrowRight, CheckCircle2, Clock3, ExternalLink, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { FaTelegram } from 'react-icons/fa6';
import { SiZalo } from 'react-icons/si';
import { motion, useReducedMotion } from 'motion/react';
import { StoreSettings } from '../lib/types';
import { StoreAvailability } from '../lib/store-hours';

export function HeroSection({ onOpenLookup, settings, availability, productCount, categoryCount, variantCount }: { onOpenLookup: () => void; settings: StoreSettings; availability: StoreAvailability; productCount: number; categoryCount: number; variantCount: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <section id="top" className="hero page-shell">
      <motion.div className="hero__copy" initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        <span className="hero__pill"><span aria-hidden="true" /> Web shop dịch vụ số của lndhub</span>
        <h1>Mọi công cụ số.<br /><span>Một nơi thật gọn.</span></h1>
        <p>Khám phá các gói AI, giải trí, thiết kế, văn phòng và tiện ích số trong một catalog rõ ràng, dễ chọn và dễ tra cứu. Danh mục mới sẽ tự xuất hiện khi quản trị viên phát hành sản phẩm.</p>
        <div className={`system-notice ${availability.isResting ? 'system-notice--resting' : ''}`}>
          {availability.isResting ? <Clock3 size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}
          <span>{availability.isResting ? <><strong>{availability.statusLabel}.</strong> Thử lại sau {availability.remainingLabel} ({availability.reopensLabel}).</> : <><strong>Catalog đang trực tuyến.</strong> Xem giá, tồn kho và chính sách mới nhất bên dưới.</>}</span>
        </div>
        <div className="hero__actions">
          <a href="#products" className="primary-button">Xem sản phẩm <ArrowRight size={19} aria-hidden="true" /></a>
          <button type="button" className="secondary-button" onClick={onOpenLookup}><Search size={18} aria-hidden="true" /> Tra cứu đơn</button>
        </div>
        <div className="hero__trust"><ShieldCheck size={17} aria-hidden="true" /><span>Minh bạch từng gói</span><i /><span>Không yêu cầu mật khẩu hay mã 2FA</span></div>
        {settings.contactEnabled && <div className="hero-contacts" aria-label="Kênh liên hệ LNDHub">
          <a className="hero-contact-card hero-contact-card--telegram" href={settings.telegramUrl} target="_blank" rel="noreferrer" aria-label={`Nhắn Telegram cho LNDHub tại ${settings.telegramHandle}, mở trong tab mới`}>
            <span className="contact-brand-icon" aria-hidden="true"><FaTelegram /></span>
            <span className="hero-contact-card__copy"><strong>{settings.telegramHandle}</strong><small>{settings.telegramDescription}</small></span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
          <a className="hero-contact-card hero-contact-card--zalo" href={settings.zaloUrl} target="_blank" rel="noreferrer" aria-label="Mở kênh Zalo LNDHub trong tab mới">
            <span className="contact-brand-icon" aria-hidden="true"><SiZalo /></span>
            <span className="hero-contact-card__copy"><strong>{settings.zaloLabel}</strong><small>{settings.zaloDescription}</small></span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>}
      </motion.div>

      <motion.div className="hero__visual" aria-label="Biểu tượng lndhub kết nối nhiều dịch vụ số" initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
        <div className="hero-orbit hero-orbit--one" aria-hidden="true" /><div className="hero-orbit hero-orbit--two" aria-hidden="true" />
        <div className="hero-emblem">
          <div className="hero-emblem__halo" aria-hidden="true" />
          <div className="hero-emblem__core"><Sparkles size={34} aria-hidden="true" /><strong>lnd</strong><span>hub</span><small>DIGITAL STORE</small></div>
        </div>
        <div className="floating-tag floating-tag--top"><span>AI</span><div><strong>{categoryCount} danh mục đang bán</strong><small>Dữ liệu lấy trực tiếp từ hệ thống</small></div></div>
        <div className="floating-tag floating-tag--bottom"><ShieldCheck size={22} aria-hidden="true" /><div><strong>{productCount} thẻ sản phẩm</strong><small>{variantCount} lựa chọn được hệ thống hóa</small></div></div>
      </motion.div>
    </section>
  );
}
