import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { CreateChatSessionDto, SendChatMessageDto } from './dto/chat.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async createSession(@Body() body: CreateChatSessionDto) {
    return { success: true, data: await this.chatService.createSession(body) };
  }

  @Get('sessions/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getSession(@Param('id') id: string, @Headers('x-chat-token') token = '') {
    return { success: true, data: await this.chatService.getCustomerSession(id, token) };
  }

  @Post('sessions/:id/messages')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  async sendMessage(@Param('id') id: string, @Headers('x-chat-token') token: string, @Body() body: SendChatMessageDto) {
    return { success: true, data: await this.chatService.sendCustomerMessage(id, token, body.body) };
  }
}
