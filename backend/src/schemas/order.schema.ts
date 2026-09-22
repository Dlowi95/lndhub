import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

export enum FulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  PROCESSING = 'PROCESSING',
  FULFILLED = 'FULFILLED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderCode: string; // e.g. LH83921

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ default: '' })
  productSlug: string;

  @Prop({ default: '' })
  category: string;

  @Prop({ default: '' })
  variantId: string;

  @Prop({ default: '' })
  variantName: string;

  @Prop({ default: '' })
  sku: string;

  @Prop({ default: '' })
  deliveryLabel: string;

  @Prop({ type: [String], default: [] })
  warrantySnapshot: string[];

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: '' })
  customerEmail: string;

  @Prop({ default: '' })
  customerNote: string;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING, index: true })
  paymentStatus: PaymentStatus;

  @Prop({ required: true, enum: FulfillmentStatus, default: FulfillmentStatus.UNFULFILLED, index: true })
  fulfillmentStatus: FulfillmentStatus;

  @Prop({ default: '', index: true })
  paymentProvider: string;

  @Prop({ default: 'BANK_TRANSFER', index: true })
  paymentMethod: string;

  @Prop({ default: '', index: true })
  paymentReference: string;

  @Prop({ default: '', unique: true, sparse: true, select: false })
  idempotencyKeyHash: string;

  @Prop({ required: true, select: false })
  lookupTokenHash: string;

  @Prop({ default: '' })
  paymentTransferContent: string;

  @Prop({ default: '' })
  vietQrUrl: string;

  @Prop({ default: '' })
  bankId: string;

  @Prop({ default: '' })
  bankName: string;

  @Prop({ default: '' })
  bankAccountNo: string;

  @Prop({ default: '' })
  bankAccountName: string;

  @Prop({ type: [String], default: [], select: false })
  deliveredKeys: string[];

  @Prop({ default: '', select: false })
  deliveryCiphertext: string;

  @Prop({ default: '', select: false })
  deliveryIv: string;

  @Prop({ default: '', select: false })
  deliveryAuthTag: string;

  @Prop({
    type: [{
      _id: false,
      type: { type: String, required: true },
      at: { type: Date, required: true },
      note: { type: String, default: '' },
    }],
    default: [],
  })
  auditTrail: Array<{ type: string; at: Date; note?: string }>;

  @Prop()
  paidAt?: Date;

  @Prop({ index: true })
  customerReportedPaidAt?: Date;

  @Prop({ default: () => new Date(Date.now() + 15 * 60 * 1000) })
  expiresAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1, createdAt: -1 });
