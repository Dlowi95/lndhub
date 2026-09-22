import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type AnnouncementDocument = Announcement & Document;
@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true, trim: true }) title: string;
  @Prop({ required: true, trim: true }) message: string;
  @Prop({ default: true, index: true }) isActive: boolean;
  @Prop({ default: Date.now, index: true }) publishedAt: Date;
}
export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ isActive: 1, publishedAt: -1 });
