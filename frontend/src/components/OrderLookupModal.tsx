'use client';

import { Modal } from '@mantine/core';
import { Clock3, Search, ShieldCheck } from 'lucide-react';

export function OrderLookupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Modal opened={isOpen} onClose={onClose} size="md" title={null} centered classNames={{ content: 'status-modal', body: 'status-modal__body' }}><div className="status-modal__icon"><Search size={27} /></div><span className="section-kicker"><Clock3 size={14} /> Đang hoàn thiện</span><h2>Tra cứu đơn sẽ mở cùng hệ thống thanh toán</h2><p>Hiện tại lndhub chưa nhận đơn và chưa phát sinh thanh toán. Khi mở bán, mã tra cứu riêng sẽ giúp khách xem trạng thái mà không cần tạo tài khoản.</p><div className="status-modal__note"><ShieldCheck size={18} /><span>Không có đơn thử, mã giả hoặc trạng thái thanh toán giả được tạo trong bản duyệt UI này.</span></div><button type="button" onClick={onClose}>Đã hiểu</button></Modal>;
}
