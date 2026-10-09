import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

export enum ChatSender {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ChatConversation', index: true })
  conversationId: Types.ObjectId;

  @Prop({ required: true, enum: ChatSender })
  sender: ChatSender;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  body: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
