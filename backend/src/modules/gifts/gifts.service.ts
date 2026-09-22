import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { GiftCampaign, GiftCampaignDocument } from '../../schemas/gift-campaign.schema';
import { GiftClaim, GiftClaimDocument } from '../../schemas/gift-claim.schema';
import { GiftItem, GiftItemDocument, GiftItemStatus } from '../../schemas/gift-item.schema';
import { StorefrontService } from '../storefront/storefront.service';
import { ImportGiftItemsDto, UpdateGiftCampaignDto } from './dto/gifts.dto';

const CAMPAIGN_KEY = 'chatgpt-plus';

@Injectable()
export class GiftsService {
  constructor(
    @InjectModel(GiftCampaign.name) private readonly campaignModel: Model<GiftCampaignDocument>,
    @InjectModel(GiftItem.name) private readonly itemModel: Model<GiftItemDocument>,
    @InjectModel(GiftClaim.name) private readonly claimModel: Model<GiftClaimDocument>,
    private readonly configService: ConfigService,
    private readonly storefrontService: StorefrontService,
  ) {}

  private async campaign() {
    return this.campaignModel.findOneAndUpdate(
      { key: CAMPAIGN_KEY },
      { $setOnInsert: { key: CAMPAIGN_KEY } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
  }

  private encryptionKey(): Buffer {
    const configured = this.configService.get<string>('GIFT_ENCRYPTION_KEY', '').trim();
    let key: Buffer;
    if (/^[0-9a-f]{64}$/i.test(configured)) key = Buffer.from(configured, 'hex');
    else key = Buffer.from(configured, 'base64');
    if (key.length !== 32) {
      throw new ServiceUnavailableException('Kho quà chưa có GIFT_ENCRYPTION_KEY hợp lệ');
    }
    return key;
  }

  private fingerprint(value: string) {
    return createHmac('sha256', this.encryptionKey()).update(value).digest('hex');
  }

  private clientHash(ip: string) {
    return createHmac('sha256', this.encryptionKey()).update(`gift-client:${ip}`).digest('hex');
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return {
      encryptedPayload: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  private decrypt(item: GiftItemDocument) {
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(item.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(item.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(item.encryptedPayload, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private preview(value: string) {
    const compact = value.replace(/\s+/g, ' ').trim();
    if (compact.length <= 8) return '••••••••';
    return `${compact.slice(0, 3)}••••••${compact.slice(-3)}`;
  }

  async getStatus() {
    const [campaign, total, claimed, remaining] = await Promise.all([
      this.campaign(),
      this.itemModel.countDocuments(),
      this.itemModel.countDocuments({ status: GiftItemStatus.CLAIMED }),
      this.itemModel.countDocuments({ status: GiftItemStatus.AVAILABLE }),
    ]);
    return {
      enabled: campaign.enabled,
      title: campaign.title,
      description: campaign.description,
      cooldownHours: campaign.cooldownHours,
      total,
      claimed,
      remaining,
      claimAvailable: Boolean(campaign.enabled && remaining > 0),
    };
  }

  async getAdminData() {
    const [status, items] = await Promise.all([
      this.getStatus(),
      this.itemModel.find().select('preview status claimedAt createdAt').sort({ createdAt: -1 }).limit(200).lean().exec(),
    ]);
    return { ...status, encryptionConfigured: this.isEncryptionConfigured(), items };
  }

  isEncryptionConfigured() {
    try {
      this.encryptionKey();
      return true;
    } catch {
      return false;
    }
  }

  async updateCampaign(input: UpdateGiftCampaignDto) {
    const result = await this.campaignModel.findOneAndUpdate(
      { key: CAMPAIGN_KEY },
      { $set: input, $setOnInsert: { key: CAMPAIGN_KEY } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec();
    this.storefrontService.broadcast('gifts');
    return result;
  }

  async importItems(input: ImportGiftItemsDto) {
    const values = [...new Set(input.items.map((item) => item.trim()).filter(Boolean))];
    if (!values.length) throw new BadRequestException('Danh sách quà đang trống');
    const operations = values.map((value) => ({
      updateOne: {
        filter: { fingerprint: this.fingerprint(value) },
        update: {
          $setOnInsert: {
            ...this.encrypt(value),
            fingerprint: this.fingerprint(value),
            preview: this.preview(value),
            status: GiftItemStatus.AVAILABLE,
          },
        },
        upsert: true,
      },
    }));
    const result = await this.itemModel.bulkWrite(operations, { ordered: false });
    this.storefrontService.broadcast('gifts');
    return { imported: result.upsertedCount, skipped: values.length - result.upsertedCount };
  }

  async deleteAvailableItem(id: string) {
    const result = await this.itemModel.findOneAndDelete({ _id: id, status: GiftItemStatus.AVAILABLE }).exec();
    if (!result) throw new BadRequestException('Chỉ có thể xóa quà chưa cấp phát');
    this.storefrontService.broadcast('gifts');
  }

  async claim(ip: string) {
    const campaign = await this.campaign();
    if (!campaign.enabled) throw new BadRequestException('Chương trình quà tặng chưa được kích hoạt');
    const clientHash = this.clientHash(ip);
    const now = new Date();
    const existingClaim = await this.claimModel.findOne({ clientHash, expiresAt: { $gt: now } }).select('+clientHash').lean().exec();
    if (existingClaim?.giftItemId) {
      const existingItem = await this.itemModel.findById(existingClaim.giftItemId).select('+encryptedPayload +iv +authTag').exec();
      if (existingItem) return { content: this.decrypt(existingItem), alreadyClaimed: true, claimedAt: existingItem.claimedAt, expiresAt: existingClaim.expiresAt };
    }

    // TTL cleanup is asynchronous. Remove an expired claim immediately so the
    // unique client hash cannot block a legitimate claim after the cooldown.
    await this.claimModel.deleteOne({ clientHash, expiresAt: { $lte: now } }).exec();

    const expiresAt = new Date(now.getTime() + campaign.cooldownHours * 60 * 60 * 1000);
    let claim: GiftClaimDocument;
    try {
      claim = await new this.claimModel({ clientHash, expiresAt }).save();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new BadRequestException(`Mỗi IP chỉ được nhận một phần quà trong ${campaign.cooldownHours} giờ`);
      }
      throw error;
    }

    const gift = await this.itemModel.findOneAndUpdate(
      { status: GiftItemStatus.AVAILABLE },
      { $set: { status: GiftItemStatus.CLAIMED, claimedByHash: clientHash, claimedAt: now } },
      { sort: { createdAt: 1 }, new: true },
    ).select('+encryptedPayload +iv +authTag +claimedByHash').exec();

    if (!gift) {
      await this.claimModel.deleteOne({ _id: claim._id }).exec();
      throw new BadRequestException('Kho quà tặng đã hết. Vui lòng quay lại sau');
    }

    claim.giftItemId = gift._id as Types.ObjectId;
    await claim.save();
    this.storefrontService.broadcast('gifts');
    return { content: this.decrypt(gift), alreadyClaimed: false, claimedAt: gift.claimedAt, expiresAt };
  }
}
