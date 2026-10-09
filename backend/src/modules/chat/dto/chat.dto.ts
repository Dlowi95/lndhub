import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ChatConversationStatus } from '../../../schemas/chat-conversation.schema';

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{3,32}$/)
  orderCode?: string;
}

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;
}

export class UpdateChatStatusDto {
  @IsEnum(ChatConversationStatus)
  status: ChatConversationStatus;
}
