import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatConversationDocument = ChatConversation & Document;

export enum ChatConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class ChatConversation {
  @Prop({ required: true, select: false, index: true })
  clientTokenHash: string;

  @Prop({ default: 'Khách web', trim: true, maxlength: 60 })
  displayName: string;

  @Prop({ default: '', trim: true, maxlength: 32, index: true })
  orderCode: string;

  @Prop({ required: true, enum: ChatConversationStatus, default: ChatConversationStatus.OPEN, index: true })
  status: ChatConversationStatus;

  @Prop({ default: '' })
  lastMessagePreview: string;

  @Prop({ default: '' })
  lastSender: string;

  @Prop({ default: Date.now, index: true })
  lastMessageAt: Date;

  @Prop({ default: 0 })
  unreadForAdmin: number;

  @Prop({ default: 0 })
  unreadForCustomer: number;

  @Prop({ default: 0 })
  messageCount: number;

  @Prop({ required: true })
  expiresAt: Date;
}

export const ChatConversationSchema = SchemaFactory.createForClass(ChatConversation);
ChatConversationSchema.index({ status: 1, lastMessageAt: -1 });
ChatConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
