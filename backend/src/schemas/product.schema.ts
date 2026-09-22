import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum FulfillmentType {
  MANUAL_SERVICE = 'MANUAL_SERVICE',
  API_KEY = 'API_KEY',
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  promotionEnabled?: boolean;
  discountPercent?: number;
  stockCount?: number;
  inStock?: boolean;
  duration?: string;
  deliveryLabel?: string;
  sortOrder?: number;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: '' })
  categoryLabel: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: '' })
  model: string;

  @Prop({ required: true, enum: FulfillmentType, default: FulfillmentType.MANUAL_SERVICE })
  fulfillmentType: FulfillmentType;

  @Prop({ default: 0, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  originalPrice: number;

  @Prop({ default: '' })
  badge: string; // e.g. 'HOT', 'BEST SELLER', 'RECOMMENDED'

  @Prop({ default: 0, min: 0 })
  stockCount: number;

  @Prop({ default: true })
  inStock: boolean;

  @Prop({ default: 'gemini' })
  iconType: string;

  @Prop({ default: '' })
  deliveryLabel: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ enum: ProductStatus, default: ProductStatus.DRAFT, index: true })
  status: ProductStatus;

  @Prop({ default: 0, min: 0 })
  sortOrder: number;

  @Prop({ type: [String], default: [] })
  information: string[];

  @Prop({ type: [String], default: [] })
  activationSteps: string[];

  @Prop({ type: [String], default: [] })
  warrantyNotes: string[];

  @Prop({
    type: [{
      _id: false,
      id: { type: String, required: true },
      name: { type: String, required: true },
      sku: { type: String, default: '' },
      price: { type: Number, required: true, min: 0 },
      originalPrice: { type: Number, default: 0, min: 0 },
      promotionEnabled: { type: Boolean, default: false },
      discountPercent: { type: Number, default: 0, min: 0, max: 100 },
      stockCount: { type: Number, default: 0, min: 0 },
      inStock: { type: Boolean, default: true },
      duration: { type: String, default: '' },
      deliveryLabel: { type: String, default: '' },
      sortOrder: { type: Number, default: 0, min: 0 },
    }],
    default: [],
  })
  variants: ProductVariant[];

  @Prop({ default: false })
  promotionEnabled: boolean;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ default: 0, min: 0 })
  soldCount: number;

  @Prop({ default: '', index: true })
  sourceProvider: string;

  @Prop({ default: '', index: true })
  sourceKey: string;

  @Prop({ type: [Number], default: [] })
  sourceIds: number[];

  @Prop({ type: Date })
  sourceSyncedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ status: 1, category: 1, sortOrder: 1 });
