'use client';

import { Modal } from '@mantine/core';
import { AlertCircle, Check, Copy, Gift, LoaderCircle, PackageX, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GiftCampaignStatus, GiftClaimResult } from '../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const EMPTY_STATUS: GiftCampaignStatus = {
  enabled: false,
  title: 'Nhận ChatGPT Plus Miễn Phí',
  description: 'Mỗi địa chỉ IP được nhận tối đa 1 phần quà trong vòng 24 giờ.',
  cooldownHours: 24,
  total: 0,
  claimed: 0,
  remaining: 0,
  claimAvailable: false,
};

export function GptPlusModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<GiftCampaignStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [gift, setGift] = useState<GiftClaimResult | null>(null);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/gifts/chatgpt-plus`, { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok && payload.data) setStatus(payload.data);
    } catch {
      setStatus(EMPTY_STATUS);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    setGift(null);
    void loadStatus().finally(() => setLoading(false));
    const events = new EventSource(`${API_BASE}/storefront/events`);
    events.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        if (data.type === 'gifts') void loadStatus();
      } catch {}
    };
    return () => events.close();
  }, [isOpen, loadStatus]);

  const claimGift = async () => {
    setClaiming(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/gifts/chatgpt-plus/claim`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Chưa thể nhận quà');
      setGift(payload.data);
      await loadStatus();
    } catch (claimError) {
      setError((claimError as Error).message);
      await loadStatus();
    } finally {
      setClaiming(false);
    }
  };

  const copyGift = async () => {
    if (!gift) return;
    await navigator.clipboard.writeText(gift.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const soldOut = !status.enabled || status.remaining <= 0;

  return (
    <Modal opened={isOpen} onClose={onClose} size="min(680px, calc(100vw - 24px))" title={null} centered overlayProps={{ backgroundOpacity: 0.74, blur: 10 }} closeButtonProps={{ 'aria-label': 'Đóng kho quà GPT Plus' }} classNames={{ content: 'store-info-modal gpt-plus-modal', body: 'store-info-modal__body', header: 'store-info-modal__header' }}>
      <div className="store-info-hero">
        <span className="store-info-hero__icon"><Gift size={30} aria-hidden="true" /></span>
        <span className="section-kicker"><Sparkles size={14} aria-hidden="true" /> Quà tặng dành cho khách hàng</span>
        <h2>{status.title}</h2>
        <p>{status.description}</p>
        <div className="gpt-plus-stats" aria-label="Tình trạng kho quà">
          <span><strong>{status.total}</strong><small>Tổng số</small></span>
          <span><strong>{status.claimed}</strong><small>Đã phát</small></span>
          <span><strong>{status.remaining}</strong><small>Còn lại</small></span>
        </div>

        {loading ? <div className="gift-state gift-state--loading"><LoaderCircle className="animate-spin" size={18} /><span>Đang kiểm tra kho quà...</span></div>
          : soldOut && !gift ? <div className="gift-state gift-state--soldout"><PackageX size={18} /><span>Kho quà tặng đã hết hàng miễn phí. Vui lòng quay lại sau!</span></div>
          : null}
        {error && <div className="gift-state gift-state--error"><AlertCircle size={18} /><span>{error}</span></div>}

        {!gift ? (
          <button type="button" className="store-info-primary" disabled={loading || soldOut || claiming} onClick={() => void claimGift()}>
            {claiming ? <><LoaderCircle className="animate-spin" size={19} /> Đang nhận quà...</> : <><Gift size={19} aria-hidden="true" /> Nhận GPT Plus ngay</>}
          </button>
        ) : (
          <div className="gift-result" role="status">
            <span className="gift-result__success"><Check size={18} /> {gift.alreadyClaimed ? 'Đây là phần quà anh vừa nhận' : 'Nhận quà thành công'}</span>
            <p>Hãy sao chép và lưu thông tin này ở nơi an toàn. Nội dung sẽ không xuất hiện trong danh sách công khai.</p>
            <pre>{gift.content}</pre>
            <button type="button" onClick={() => void copyGift()}><Copy size={17} /> {copied ? 'Đã sao chép' : 'Sao chép quà tặng'}</button>
          </div>
        )}
      </div>

      <div className="gift-safe-note">
        <strong>Quy định nhận quà</strong>
        <p>Mỗi IP nhận tối đa một phần quà trong {status.cooldownHours} giờ. LNDHub không yêu cầu anh gửi cookie phiên, mật khẩu tài khoản cá nhân hoặc mã 2FA.</p>
      </div>
    </Modal>
  );
}
