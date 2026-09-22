'use client';

import Image from 'next/image';
import { Gift, Menu, Search, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Navbar({ onOpenLookup, onOpenGptPlus, onOpenWarranty }: { onOpenLookup: () => void; onOpenGptPlus: () => void; onOpenWarranty: () => void }) {
  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <a href="#top" className="brand" aria-label="lndhub — Trang chủ">
          <span className="brand__mark brand__mark--navbar-logo"><Image src="/images/logo.webp" alt="" fill sizes="48px" priority /></span>
          <span className="brand__name">lnd<span>hub</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          <button type="button" className="nav-feature-button nav-gpt-button" onClick={onOpenGptPlus}><Gift size={17} aria-hidden="true" /> Nhận GPT Plus</button>
          <a href="#products">Sản phẩm</a><a href="#guide">Hướng dẫn</a>
          <button type="button" className="nav-warranty-button" onClick={onOpenWarranty}>Bảo hành</button>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <button type="button" className="lookup-button" onClick={onOpenLookup}><Search size={17} aria-hidden="true" /><span>Tra cứu đơn</span></button>
          <details className="mobile-nav"><summary aria-label="Mở menu"><Menu size={21} aria-hidden="true" /></summary><div><button type="button" className="nav-gpt-button" onClick={onOpenGptPlus}><Gift size={16} aria-hidden="true" /> Nhận GPT Plus</button><a href="#products">Sản phẩm</a><a href="#guide">Hướng dẫn</a><button type="button" className="nav-warranty-button" onClick={onOpenWarranty}><ShieldCheck size={16} aria-hidden="true" /> Bảo hành</button><button type="button" onClick={onOpenLookup}><Search size={16} aria-hidden="true" /> Tra cứu đơn</button></div></details>
        </div>
      </div>
    </header>
  );
}
