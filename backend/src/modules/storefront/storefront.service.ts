import { BadRequestException, Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { interval, map, merge, Subject } from 'rxjs';
import { Announcement, AnnouncementDocument } from '../../schemas/announcement.schema';
import { StoreSettings, StoreSettingsDocument } from '../../schemas/store-settings.schema';

const DEFAULT_SETTINGS: Partial<StoreSettings> = {
  key: 'public', telegramUrl: 'https://t.me/lndhubAI', telegramHandle: '@lndhubAI',
  telegramDescription: 'Nhắn trực tiếp cho admin',
  zaloUrl: 'https://zalo.me/g/saa6cb0b55dajgvjlorl', zaloLabel: 'Nhóm Zalo LNDHub',
  zaloDescription: 'Tham gia nhóm hỗ trợ', contactEnabled: true,
  businessHoursEnabled: true, restStart: '23:30', restEnd: '07:00', timeZone: 'Asia/Ho_Chi_Minh',
};

@Injectable()
export class StorefrontService {
  private readonly events = new Subject<MessageEvent>();
  constructor(
    @InjectModel(StoreSettings.name) private readonly settingsModel: Model<StoreSettingsDocument>,
    @InjectModel(Announcement.name) private readonly announcementModel: Model<AnnouncementDocument>,
  ) {}
  async getSettings(): Promise<Record<string, unknown>> {
    const settings = await this.settingsModel.findOne({ key: 'public' }).lean().exec();
    return { ...DEFAULT_SETTINGS, ...(settings || {}) };
  }
  async updateSettings(input: Partial<StoreSettings>) {
    const result = await this.settingsModel.findOneAndUpdate(
      { key: 'public' }, { $set: { ...input, key: 'public' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
    this.broadcast('settings');
    return result;
  }
  getEvents() {
    const heartbeat = interval(25000).pipe(map(() => ({ data: { type: 'heartbeat', at: new Date().toISOString() } })));
    return merge(this.events.asObservable(), heartbeat);
  }
  getPublicAnnouncements() {
    return this.announcementModel.find({ isActive: true }).sort({ publishedAt: -1, createdAt: -1 }).limit(10).lean().exec();
  }
  getAllAnnouncements() {
    return this.announcementModel.find().sort({ publishedAt: -1, createdAt: -1 }).limit(10).exec();
  }
  async createAnnouncement(input: Partial<Announcement>) {
    if (await this.announcementModel.countDocuments() >= 10) {
      throw new BadRequestException('Đã đủ 10 thông báo; hãy xóa một tin cũ trước khi thêm');
    }
    const result = await new this.announcementModel({ ...input, publishedAt: new Date() }).save();
    this.broadcast('announcements');
    return result;
  }
  async updateAnnouncement(id: string, input: Partial<Announcement>) {
    const result = await this.announcementModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec();
    if (!result) throw new NotFoundException('Thông báo không tồn tại');
    this.broadcast('announcements');
    return result;
  }
  async deleteAnnouncement(id: string) {
    const result = await this.announcementModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Thông báo không tồn tại');
    this.broadcast('announcements');
  }
  broadcast(type: 'settings' | 'announcements' | 'catalog' | 'gifts') {
    this.events.next({ data: { type, at: new Date().toISOString() } });
  }
}
