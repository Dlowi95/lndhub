'use client';

import { Modal } from '@mantine/core';
import { AlertTriangle, BadgeCheck, Clock3, RefreshCcw, ShieldCheck } from 'lucide-react';

export function WarrantyPolicyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="min(760px, calc(100vw - 24px))"
      title={null}
      centered
      overlayProps={{ backgroundOpacity: 0.74, blur: 10 }}
      closeButtonProps={{ 'aria-label': 'Đóng chính sách bảo hành' }}
      classNames={{ content: 'store-info-modal warranty-policy-modal', body: 'store-info-modal__body', header: 'store-info-modal__header' }}
    >
      <div className="warranty-heading">
        <span><ShieldCheck size={27} aria-hidden="true" /></span>
        <div><span className="section-kicker">Chính sách LNDHub</span><h2>Chính sách bảo hành</h2><p>Phạm vi và thời hạn cụ thể luôn được hiển thị theo từng sản phẩm tại thời điểm đặt hàng.</p></div>
      </div>

      <div className="warranty-policy-list">
        <article className="warranty-policy-card warranty-policy-card--primary"><RefreshCcw size={20} aria-hidden="true" /><div><h3>Đổi sản phẩm hoặc hoàn tiền</h3><p>Nếu lỗi hợp lệ thuộc phạm vi bảo hành, shop ưu tiên đổi sản phẩm tương đương. Nếu không thể đổi, số tiền hoàn được tính theo thời gian bảo hành còn lại.</p></div></article>
        <article className="warranty-policy-card warranty-policy-card--warning"><AlertTriangle size={20} aria-hidden="true" /><div><h3>Trường hợp không được bảo hành</h3><p>Không áp dụng khi khách tự đổi thông tin làm mất quyền truy cập, chia sẻ trái điều kiện, vi phạm quy định nhà cung cấp hoặc sử dụng sai hướng dẫn đã công bố.</p></div></article>
        <article className="warranty-policy-card"><BadgeCheck size={20} aria-hidden="true" /><div><h3>Công thức hoàn tiền minh bạch</h3><code>Tiền hoàn = Giá thực trả × Số ngày bảo hành còn lại / Tổng ngày bảo hành</code><p>Mỗi tháng được quy đổi theo 30 ngày, trừ khi điều kiện của SKU ghi rõ cách tính khác.</p></div></article>
        <article className="warranty-policy-card warranty-policy-card--success"><Clock3 size={20} aria-hidden="true" /><div><h3>Ví dụ tính tiền</h3><p>Đơn 300.000đ có 30 ngày bảo hành, đã sử dụng 10 ngày thì còn 20 ngày.</p><code>300.000đ × 20 / 30 = 200.000đ</code></div></article>
      </div>

      <div className="store-info-note"><ShieldCheck size={18} aria-hidden="true" /><span>Điều kiện lưu cùng đơn hàng và SKU tại thời điểm mua là căn cứ xử lý cuối cùng.</span></div>
    </Modal>
  );
}
