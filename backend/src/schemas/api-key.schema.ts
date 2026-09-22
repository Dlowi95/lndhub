import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

export enum KeyStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
}

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ select: false })
  key?: string;

  @Prop({ unique: true, sparse: true, select: false })
  fingerprint?: string;

  @Prop({ select: false })
  encryptedPayload?: string;

  @Prop({ select: false })
  iv?: string;

  @Prop({ select: false })
  authTag?: string;

  @Prop({ required: true })
  model: string;

  @Prop({ default: '' })
  productId: string;

  @Prop({ required: true, enum: KeyStatus, default: KeyStatus.AVAILABLE })
  status: KeyStatus;

  @Prop({ default: '' })
  orderCode: string;

  @Prop()
  reservedAt?: Date;

  @Prop()
  soldAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
