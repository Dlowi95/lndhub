import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type StoreSettingsDocument = StoreSettings & Document;
@Schema({ timestamps: true })
export class StoreSettings {
  @Prop({ default: 'public', unique: true }) key: string;
  @Prop({ default: 'https://t.me/lndhubAI' }) telegramUrl: string;
  @Prop({ default: '@lndhubAI' }) telegramHandle: string;
  @Prop({ default: 'Nhắn trực tiếp cho admin' }) telegramDescription: string;
  @Prop({ default: 'https://zalo.me/g/saa6cb0b55dajgvjlorl' }) zaloUrl: string;
  @Prop({ default: 'Nhóm Zalo LNDHub' }) zaloLabel: string;
  @Prop({ default: 'Tham gia nhóm hỗ trợ' }) zaloDescription: string;
  @Prop({ default: true }) contactEnabled: boolean;
  @Prop({ default: true }) businessHoursEnabled: boolean;
  @Prop({ default: '23:30' }) restStart: string;
  @Prop({ default: '07:00' }) restEnd: string;
  @Prop({ default: 'Asia/Ho_Chi_Minh' }) timeZone: string;
}
export const StoreSettingsSchema = SchemaFactory.createForClass(StoreSettings);
