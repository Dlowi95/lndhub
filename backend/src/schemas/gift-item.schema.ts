import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GiftItemDocument = GiftItem & Document;

export enum GiftItemStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
}

@Schema({ timestamps: true })
export class GiftItem {
  @Prop({ required: true, unique: true, select: false })
  fingerprint: string;

  @Prop({ required: true, select: false })
  encryptedPayload: string;

  @Prop({ required: true, select: false })
  iv: string;

  @Prop({ required: true, select: false })
  authTag: string;

  @Prop({ required: true, maxlength: 80 })
  preview: string;

  @Prop({ required: true, enum: GiftItemStatus, default: GiftItemStatus.AVAILABLE, index: true })
  status: GiftItemStatus;

  @Prop({ default: '', select: false })
  claimedByHash: string;

  @Prop()
  claimedAt?: Date;
}

export const GiftItemSchema = SchemaFactory.createForClass(GiftItem);
