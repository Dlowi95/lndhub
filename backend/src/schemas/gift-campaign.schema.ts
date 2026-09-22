import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GiftCampaignDocument = GiftCampaign & Document;

@Schema({ timestamps: true })
export class GiftCampaign {
  @Prop({ default: 'chatgpt-plus', unique: true })
  key: string;

  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: 'Nhận ChatGPT Plus Miễn Phí', maxlength: 100 })
  title: string;

  @Prop({ default: 'Mỗi địa chỉ IP được nhận tối đa 1 phần quà trong vòng 24 giờ.', maxlength: 240 })
  description: string;

  @Prop({ default: 24, min: 1, max: 168 })
  cooldownHours: number;
}

export const GiftCampaignSchema = SchemaFactory.createForClass(GiftCampaign);
