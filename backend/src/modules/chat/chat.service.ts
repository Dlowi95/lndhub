import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { ChatConversation, ChatConversationDocument, ChatConversationStatus } from '../../schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageDocument, ChatSender } from '../../schemas/chat-message.schema';
import { CreateChatSessionDto } from './dto/chat.dto';

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_MESSAGES_PER_CONVERSATION = 150;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatConversation.name) private readonly conversationModel: Model<ChatConversationDocument>,
    @InjectModel(ChatMessage.name) private readonly messageModel: Model<ChatMessageDocument>,
  ) {}

  private tokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private expiry(): Date {
    return new Date(Date.now() + RETENTION_MS);
  }

  private cleanBody(value: string): string {
    const body = String(value || '').replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
    if (!body) throw new BadRequestException('Tin nhắn không được để trống');
    return body;
  }

  private async authorizedConversation(id: string, token: string) {
    if (!Types.ObjectId.isValid(id) || !token) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    const conversation = await this.conversationModel.findOne({ _id: id, clientTokenHash: this.tokenHash(token) });
    if (!conversation) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    return conversation;
  }

  private async messagesFor(conversationId: string) {
    return this.messageModel.find({ conversationId: new Types.ObjectId(conversationId) }).sort({ createdAt: 1 }).limit(MAX_MESSAGES_PER_CONVERSATION).lean();
  }

  async createSession(dto: CreateChatSessionDto) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = this.expiry();
    const displayName = dto.displayName?.trim() || 'Khách web';
    const orderCode = dto.orderCode?.trim().toUpperCase() || '';
    const conversation = await this.conversationModel.create({
      clientTokenHash: this.tokenHash(token), displayName, orderCode, expiresAt,
    });
    return { token, conversation: conversation.toObject(), messages: [] };
  }

  async getCustomerSession(id: string, token: string) {
    const conversation = await this.authorizedConversation(id, token);
    if (conversation.unreadForCustomer > 0) {
      conversation.unreadForCustomer = 0;
      await conversation.save();
    }
    return { conversation: conversation.toObject(), messages: await this.messagesFor(id) };
  }

  async sendCustomerMessage(id: string, token: string, value: string) {
    const conversation = await this.authorizedConversation(id, token);
    if (conversation.status === ChatConversationStatus.CLOSED) {
      throw new ConflictException('Cuộc trò chuyện đã kết thúc. Hãy mở cuộc trò chuyện mới.');
    }
    if (conversation.messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
      throw new ConflictException('Cuộc trò chuyện đã đạt giới hạn. Vui lòng liên hệ Telegram để được hỗ trợ tiếp.');
    }
    const body = this.cleanBody(value);
    const expiresAt = this.expiry();
    const message = await this.messageModel.create({ conversationId: conversation._id, sender: ChatSender.CUSTOMER, body, expiresAt });
    conversation.lastMessagePreview = body.slice(0, 120);
    conversation.lastSender = ChatSender.CUSTOMER;
    conversation.lastMessageAt = new Date();
    conversation.unreadForAdmin += 1;
    conversation.messageCount += 1;
    conversation.expiresAt = expiresAt;
    await conversation.save();
    return message.toObject();
  }

  async listAdminConversations() {
    return this.conversationModel.find({ messageCount: { $gt: 0 } }).sort({ lastMessageAt: -1 }).limit(200).lean();
  }

  async getAdminConversation(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    const conversation = await this.conversationModel.findById(id);
    if (!conversation) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    if (conversation.unreadForAdmin > 0) {
      conversation.unreadForAdmin = 0;
      await conversation.save();
    }
    return { conversation: conversation.toObject(), messages: await this.messagesFor(id) };
  }

  async sendAdminMessage(id: string, value: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    const conversation = await this.conversationModel.findById(id);
    if (!conversation) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    if (conversation.messageCount >= MAX_MESSAGES_PER_CONVERSATION) throw new ConflictException('Cuộc trò chuyện đã đạt giới hạn tin nhắn');
    const body = this.cleanBody(value);
    const expiresAt = this.expiry();
    const message = await this.messageModel.create({ conversationId: conversation._id, sender: ChatSender.ADMIN, body, expiresAt });
    conversation.status = ChatConversationStatus.OPEN;
    conversation.lastMessagePreview = body.slice(0, 120);
    conversation.lastSender = ChatSender.ADMIN;
    conversation.lastMessageAt = new Date();
    conversation.unreadForCustomer += 1;
    conversation.messageCount += 1;
    conversation.expiresAt = expiresAt;
    await conversation.save();
    return message.toObject();
  }

  async updateStatus(id: string, status: ChatConversationStatus) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    const conversation = await this.conversationModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!conversation) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    return conversation.toObject();
  }
}
