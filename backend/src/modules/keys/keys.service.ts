import { BadRequestException, Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument, KeyStatus } from '../../schemas/api-key.schema';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

@Injectable()
export class KeysService implements OnModuleInit {
  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.releaseStaleReservations();
    await this.backfillFingerprints();
    await this.seedSampleKeys();
  }

  private fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private encryptionKey(): Buffer {
    const configured = (
      this.configService.get<string>('INVENTORY_ENCRYPTION_KEY', '')
      || this.configService.get<string>('GIFT_ENCRYPTION_KEY', '')
    ).trim();
    const key = /^[0-9a-f]{64}$/i.test(configured)
      ? Buffer.from(configured, 'hex')
      : Buffer.from(configured, 'base64');
    if (key.length !== 32) {
      throw new ServiceUnavailableException('Kho key chưa có INVENTORY_ENCRYPTION_KEY hợp lệ');
    }
    return key;
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

  private decrypt(item: ApiKeyDocument): string {
    if (item.encryptedPayload && item.iv && item.authTag) {
      const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(item.iv, 'base64'));
      decipher.setAuthTag(Buffer.from(item.authTag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(item.encryptedPayload, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    }
    if (item.key) return item.key;
    throw new ServiceUnavailableException('Dữ liệu kho key không thể giải mã');
  }

  private async backfillFingerprints(): Promise<void> {
    const legacyKeys = await this.apiKeyModel
      .find({
        $or: [
          { fingerprint: { $exists: false } },
          { fingerprint: '' },
          { encryptedPayload: { $exists: false } },
          { encryptedPayload: '' },
        ],
      })
      .select('+key +fingerprint +encryptedPayload +iv +authTag')
      .limit(1000)
      .exec();
    for (const item of legacyKeys) {
      try {
        const plainText = this.decrypt(item);
        await this.apiKeyModel.updateOne(
          { _id: item._id },
          {
            $set: { fingerprint: this.fingerprint(plainText), ...this.encrypt(plainText) },
            $unset: { key: 1 },
          },
        ).exec();
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
  }

  async releaseStaleReservations(): Promise<void> {
    const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
    await this.apiKeyModel.updateMany(
      { status: KeyStatus.RESERVED, reservedAt: { $lte: staleBefore } },
      { $set: { status: KeyStatus.AVAILABLE, orderCode: '' }, $unset: { reservedAt: 1 } },
    ).exec();
  }

  async seedSampleKeys() {
    if (this.configService.get<string>('ENABLE_DEMO_SEED', 'false').toLowerCase() !== 'true') return;

    try {
      const count = await this.apiKeyModel.countDocuments();
      if (count === 0) {
        const sampleKeys = [
          // Gemini 1.5 Pro
          { key: 'AIzaSyD_Pro15_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-1.5-pro', status: KeyStatus.AVAILABLE },
          { key: 'AIzaSyD_Pro15_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-1.5-pro', status: KeyStatus.AVAILABLE },
          { key: 'AIzaSyD_Pro15_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-1.5-pro', status: KeyStatus.AVAILABLE },
          // Gemini 1.5 Flash
          { key: 'AIzaSyF_Flash15_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-1.5-flash', status: KeyStatus.AVAILABLE },
          { key: 'AIzaSyF_Flash15_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-1.5-flash', status: KeyStatus.AVAILABLE },
          // Gemini 2.0 Flash
          { key: 'AIzaSyG_Flash20_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-2.0-flash', status: KeyStatus.AVAILABLE },
          { key: 'AIzaSyG_Flash20_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-2.0-flash', status: KeyStatus.AVAILABLE },
          // Gemini Enterprise
          { key: 'AIzaSyE_Enterprise_' + Math.random().toString(36).substring(2, 12).toUpperCase(), model: 'gemini-enterprise', status: KeyStatus.AVAILABLE },
          // Claude 3.5
          { key: 'sk-ant-api03-' + Math.random().toString(36).substring(2, 16).toUpperCase(), model: 'claude-3.5-sonnet', status: KeyStatus.AVAILABLE },
        ];
        await this.apiKeyModel.insertMany(sampleKeys.map((item) => ({
          model: item.model,
          status: item.status,
          fingerprint: this.fingerprint(item.key),
          ...this.encrypt(item.key),
        })));
        console.log('Successfully seeded sample API keys in inventory!');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Could not seed keys:', message);
    }
  }

  async getAvailableCount(model: string): Promise<number> {
    return this.apiKeyModel.countDocuments({ model, status: KeyStatus.AVAILABLE });
  }

  async getAvailableTotal(): Promise<number> {
    return this.apiKeyModel.countDocuments({ status: KeyStatus.AVAILABLE }).exec();
  }

  async assignKeys(model: string, quantity: number, orderCode: string): Promise<string[]> {
    const existing = await this.apiKeyModel
      .find({ orderCode, status: { $in: [KeyStatus.RESERVED, KeyStatus.SOLD] } })
      .select('+key +encryptedPayload +iv +authTag')
      .sort({ createdAt: 1 })
      .exec();
    if (existing.length === quantity) return existing.map((item) => this.decrypt(item));
    if (existing.length > 0) {
      throw new BadRequestException('Kho key của đơn đang ở trạng thái cần kiểm tra thủ công');
    }

    const reserved: ApiKeyDocument[] = [];
    try {
      for (let index = 0; index < quantity; index += 1) {
        const key = await this.apiKeyModel.findOneAndUpdate(
          { model, status: KeyStatus.AVAILABLE },
          { $set: { status: KeyStatus.RESERVED, orderCode, reservedAt: new Date() } },
          { new: true, sort: { createdAt: 1 } },
        ).select('+key +encryptedPayload +iv +authTag').exec();
        if (!key) throw new BadRequestException(`Không đủ tồn kho cho model ${model}`);
        reserved.push(key);
      }

      const ids = reserved.map((item) => item._id);
      await this.apiKeyModel.updateMany(
        { _id: { $in: ids }, orderCode, status: KeyStatus.RESERVED },
        { $set: { status: KeyStatus.SOLD, soldAt: new Date() }, $unset: { reservedAt: 1 } },
      ).exec();
      return reserved.map((item) => this.decrypt(item));
    } catch (error) {
      if (reserved.length) {
        await this.apiKeyModel.updateMany(
          { _id: { $in: reserved.map((item) => item._id) }, orderCode, status: KeyStatus.RESERVED },
          { $set: { status: KeyStatus.AVAILABLE, orderCode: '' }, $unset: { reservedAt: 1 } },
        ).exec();
      }
      throw error;
    }
  }

  async importKeys(keys: string[], model: string): Promise<{ count: number }> {
    const values = [...new Set(keys.map((value) => value.trim()).filter(Boolean))];
    if (!values.length || !model.trim()) throw new BadRequestException('Danh sách key hoặc model đang trống');
    const result = await this.apiKeyModel.collection.bulkWrite(values.map((key) => ({
      updateOne: {
        filter: { fingerprint: this.fingerprint(key) },
        update: { $setOnInsert: { ...this.encrypt(key), fingerprint: this.fingerprint(key), model: model.trim(), status: KeyStatus.AVAILABLE } },
        upsert: true,
      },
    })), { ordered: false });
    return { count: result.upsertedCount };
  }

  async getAllInventory(): Promise<ApiKey[]> {
    return this.apiKeyModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }
}
