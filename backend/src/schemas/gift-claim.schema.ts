import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { GiftItem } from './gift-item.schema';

export type GiftClaimDocument = GiftClaim & Document;

@Schema({ timestamps: true })
export class GiftClaim {
  @Prop({ required: true, unique: true, index: true, select: false })
  clientHash: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: GiftItem.name })
  giftItemId?: Types.ObjectId;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const GiftClaimSchema = SchemaFactory.createForClass(GiftClaim);
