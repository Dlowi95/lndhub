'use client';

import { AlertTriangle, BadgeCheck, Clock3, KeyRound, Landmark, Send, XCircle } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Order } from '../../lib/types';

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

type Props = {
  orders: Order[];
  paymentReviewCount: number;
  deliveryDrafts: Record<string, string>;
  setDeliveryDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  markPaid: (code: string) => Promise<void>;
  fulfillOrder: (code: string) => Promise<void>;
  cancelOrder: (code: string) => Promise<void>;
};

export default function OrdersAdmin({ orders, paymentReviewCount, deliveryDrafts, setDeliveryDrafts, markPaid, fulfillOrder, cancelOrder }: Props) {
  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-xl font-black">Đơn hàng chuyển khoản</h2><p className="mt-1 text-sm text-slate-500">Khách báo đã chuyển không đồng nghĩa tiền đã vào. Luôn đối chiếu ngân hàng trước khi xác nhận.</p></div>
      <span className={paymentReviewCount ? 'inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100' : 'inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400'}><Clock3 className="size-4" /> {paymentReviewCount} đơn chờ kiểm tra tiền</span>
    </div>

    {paymentReviewCount > 0 && <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><strong>Có khách vừa báo đã chuyển khoản</strong><p className="mt-1 text-xs leading-5 text-amber-100/70">Kiểm tra đúng số tiền và mã đơn trên ứng dụng ngân hàng. Không xác nhận chỉ dựa vào ảnh chụp của khách.</p></div></div>}

    <div className="grid gap-4">
      {orders.map((item) => {
        const reported = Boolean(item.customerReportedPaidAt && item.paymentStatus === 'PENDING');
        const paid = item.paymentStatus === 'PAID' || item.status === 'PAID';
        const fulfilled = item.fulfillmentStatus === 'FULFILLED';
        return <article key={item._id || item.orderCode} className={reported ? 'rounded-2xl border border-amber-300/25 bg-amber-300/[0.045] p-4 sm:p-5' : 'rounded-2xl border border-white/[0.08] bg-[#0f121d] p-4 sm:p-5'}>
          <header className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-base text-cyan-200">{item.orderCode}</strong>{reported && <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-[10px] font-black text-amber-200">KHÁCH BÁO ĐÃ CHUYỂN</span>}{fulfilled && <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-200">ĐÃ GIAO</span>}</div><h3 className="mt-2 font-black text-white">{item.productName}</h3>{item.variantName && <p className="mt-1 text-xs text-slate-500">{item.variantName} · số lượng {item.quantity}</p>}</div>
            <div className="sm:text-right"><small className="text-[10px] font-black uppercase tracking-wider text-slate-600">Cần đối chiếu</small><p className="mt-1 text-xl font-black text-amber-200">{money(item.totalPrice)}</p><p className="mt-1 font-mono text-[11px] text-slate-500">Nội dung: {item.paymentTransferContent}</p></div>
          </header>

          <div className="grid gap-3 py-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/[0.025] p-3"><span className="text-slate-600">Thanh toán</span><strong className="mt-1 block text-slate-200">{item.paymentStatus || item.status || 'PENDING'}</strong></div>
            <div className="rounded-xl bg-white/[0.025] p-3"><span className="text-slate-600">Giao hàng</span><strong className="mt-1 block text-slate-200">{item.fulfillmentStatus || 'UNFULFILLED'}</strong></div>
            <div className="rounded-xl bg-white/[0.025] p-3"><span className="text-slate-600">Khách báo chuyển</span><strong className="mt-1 block text-slate-200">{item.customerReportedPaidAt ? new Date(item.customerReportedPaidAt).toLocaleString('vi-VN') : 'Chưa báo'}</strong></div>
            <div className="rounded-xl bg-white/[0.025] p-3"><span className="text-slate-600">Email</span><strong className="mt-1 block break-all text-slate-200">{item.customerEmail || 'Không cung cấp'}</strong></div>
          </div>

          {!paid && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void markPaid(item.orderCode)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black text-slate-950"><Landmark className="size-4" /> {item.paymentStatus === 'EXPIRED' ? 'Xác nhận giao dịch đến trễ' : 'Xác nhận tiền đã vào tài khoản'}</button>{item.paymentStatus === 'PENDING' && <button type="button" onClick={() => void cancelOrder(item.orderCode)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 text-xs font-black text-rose-200"><XCircle className="size-4" /> Hủy đơn chưa nhận tiền</button>}</div>}

          {paid && !fulfilled && <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.035] p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><KeyRound className="size-4" /></span><div><strong className="text-sm text-cyan-100">Nhập key hoặc thông tin giao hàng</strong><p className="mt-1 text-xs leading-5 text-slate-500">Nội dung được mã hóa trước khi lưu. Khách chỉ xem được bằng token tra cứu riêng.</p></div></div><textarea rows={4} value={deliveryDrafts[item.orderCode] || ''} onChange={(event) => setDeliveryDrafts((current) => ({ ...current, [item.orderCode]: event.currentTarget.value }))} placeholder="Dán key, tài khoản hoặc hướng dẫn nhận hàng..." className="mt-3 w-full rounded-xl border border-white/10 bg-[#070912] p-3 font-mono text-sm text-cyan-100 outline-none focus:border-cyan-300/40" /><button type="button" onClick={() => void fulfillOrder(item.orderCode)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-xs font-black text-slate-950"><Send className="size-4" /> Mã hóa và giao cho khách</button></div>}

          {fulfilled && <div className="flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3 text-xs font-bold text-emerald-200"><BadgeCheck className="size-4" /> Đơn đã giao. Admin không hiển thị lại nội dung nhạy cảm.</div>}
        </article>;
      })}
      {!orders.length && <div className="rounded-2xl border border-white/[0.08] bg-[#0f121d] p-12 text-center text-sm text-slate-500">Chưa có đơn hàng.</div>}
    </div>
  </section>;
}
