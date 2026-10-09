import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatConversation, ChatConversationSchema } from '../../schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageSchema } from '../../schemas/chat-message.schema';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: ChatConversation.name, schema: ChatConversationSchema },
    { name: ChatMessage.name, schema: ChatMessageSchema },
  ])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
