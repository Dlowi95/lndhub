import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ default: 'sparkles', trim: true })
  iconType: string;

  @Prop({ default: 0, min: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ sortOrder: 1, name: 1 });
