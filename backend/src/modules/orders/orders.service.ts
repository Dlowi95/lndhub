import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Model } from 'mongoose';
import {
  FulfillmentStatus,
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
} from '../../schemas/order.schema';
import { FulfillmentType, ProductVariant } from '../../schemas/product.schema';
import { ProductsService } from '../products/products.service';
import { KeysService } from '../keys/keys.service';
import { CreateOrderDto } from './dto/orders.dto';

type PublicOrder = {
  orderCode: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: string;
  paymentTransferContent: string;
  vietQrUrl: string;
  bankId: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  customerEmail: string;
  customerReportedPaidAt?: Date;
  deliveryContent?: string;
  createdAt?: Date;
  paidAt?: Date;
  expiresAt: Date;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
    private readonly keysService: KeysService,
    private readonly configService: ConfigService,
  ) {}

  private lookupSecret(): string {
    const secret = (
      this.configService.get<string>('ORDER_LOOKUP_SECRET', '')
      || this.configService.get<string>('GIFT_ENCRYPTION_KEY', '')
    ).trim();
    if (secret.length < 32) {
      throw new ServiceUnavailableException('ORDER_LOOKUP_SECRET chưa được cấu hình an toàn');
    }
    return secret;
  }

  private lookupToken(orderCode: string): string {
    return createHmac('sha256', this.lookupSecret()).update(`order-lookup:${orderCode}`).digest('base64url');
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private deliveryKey(): Buffer {
    const secret = (
      this.configService.get<string>('DELIVERY_ENCRYPTION_KEY', '')
      || this.configService.get<string>('INVENTORY_ENCRYPTION_KEY', '')
    ).trim();
    if (secret.length < 32) {
      throw new ServiceUnavailableException('DELIVERY_ENCRYPTION_KEY chưa được cấu hình an toàn');
    }
    return createHash('sha256').update(secret).digest();
  }

  private encryptDelivery(content: string): { ciphertext: string; iv: string; authTag: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.deliveryKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  private decryptDelivery(order: OrderDocument): string | undefined {
    if (!order.deliveryCiphertext || !order.deliveryIv || !order.deliveryAuthTag) return undefined;
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.deliveryKey(), Buffer.from(order.deliveryIv, 'base64'));
      decipher.setAuthTag(Buffer.from(order.deliveryAuthTag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(order.deliveryCiphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return undefined;
    }
  }

  private secureEqual(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private generateOrderCode(): string {
    return `LH${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private tierQuantity(variant?: ProductVariant): number | null {
    if (!variant) return null;
    const nameMatch = variant.name.trim().match(/^x\s*(\d+)$/i);
    const idMatch = variant.id.match(/-x(\d+)$/i);
    const parsed = Number(nameMatch?.[1] || idMatch?.[1] || 0);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private publicOrder(order: OrderDocument, includeDelivery = false): PublicOrder {
    const email = order.customerEmail || '';
    const customerEmail = email.includes('@')
      ? `${email.slice(0, 2)}***@${email.split('@')[1]}`
      : '';
    return {
      orderCode: order.orderCode,
      productName: order.productName,
      variantName: order.variantName || '',
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus || (order.status === OrderStatus.PAID ? PaymentStatus.PAID : PaymentStatus.PENDING),
      fulfillmentStatus: order.fulfillmentStatus || FulfillmentStatus.UNFULFILLED,
      paymentMethod: order.paymentMethod || 'BANK_TRANSFER',
      paymentTransferContent: order.paymentTransferContent,
      vietQrUrl: order.vietQrUrl,
      bankId: order.bankId || '',
      bankName: order.bankName || '',
      bankAccountNo: order.bankAccountNo || '',
      bankAccountName: order.bankAccountName || '',
      customerEmail,
      customerReportedPaidAt: order.customerReportedPaidAt,
      deliveryContent: includeDelivery && order.fulfillmentStatus === FulfillmentStatus.FULFILLED
        ? this.decryptDelivery(order)
        : undefined,
      createdAt: (order as OrderDocument & { createdAt?: Date }).createdAt,
      paidAt: order.paidAt,
      expiresAt: order.expiresAt,
    };
  }

  async createOrder(input: CreateOrderDto, idempotencyKey?: string) {
    await this.expireStaleOrders();
    const normalizedIdempotencyKey = idempotencyKey?.trim() || '';
    if (normalizedIdempotencyKey && (normalizedIdempotencyKey.length < 16 || normalizedIdempotencyKey.length > 160)) {
      throw new BadRequestException('Idempotency-Key phải dài từ 16 đến 160 ký tự');
    }
    const idempotencyKeyHash = normalizedIdempotencyKey ? this.hash(normalizedIdempotencyKey) : undefined;
    if (idempotencyKeyHash) {
      const existing = await this.orderModel.findOne({ idempotencyKeyHash }).exec();
      if (existing) {
        return { order: this.publicOrder(existing), lookupToken: this.lookupToken(existing.orderCode), idempotentReplay: true };
      }
    }

    const product = await this.productsService.findById(input.productId);
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại hoặc chưa được mở bán');
    if (!product.inStock) throw new BadRequestException('Sản phẩm hiện đã hết hàng');

    const variants = product.variants || [];
    let variant: ProductVariant | undefined;
    if (variants.length) {
      if (!input.variantId && variants.length > 1) {
        throw new BadRequestException('Vui lòng chọn đúng lựa chọn sản phẩm');
      }
      variant = variants.find((item) => item.id === (input.variantId || variants[0].id));
      if (!variant) throw new BadRequestException('Lựa chọn sản phẩm không tồn tại');
      if (!variant.inStock) throw new BadRequestException('Lựa chọn sản phẩm hiện đã hết hàng');
    }

    const tierQuantity = this.tierQuantity(variant);
    const requestedQuantity = input.quantity || tierQuantity || 1;
    if (tierQuantity && requestedQuantity !== tierQuantity) {
      throw new BadRequestException('Số lượng không khớp với gói giá đã chọn');
    }
    const stockCount = variant ? Number(variant.stockCount || 0) : Number(product.stockCount || 0);
    if (stockCount < 1 || (!tierQuantity && stockCount < requestedQuantity)) {
      throw new BadRequestException('Sản phẩm không đủ tồn kho');
    }

    const selectedPrice = Number(variant?.price ?? product.price);
    const totalPrice = tierQuantity ? selectedPrice : selectedPrice * requestedQuantity;
    if (!Number.isSafeInteger(totalPrice) || totalPrice <= 0) {
      throw new BadRequestException('Sản phẩm chưa có giá bán hợp lệ');
    }
    const unitPrice = tierQuantity ? Math.round(totalPrice / requestedQuantity) : selectedPrice;

    const bankId = this.configService.get<string>('BANK_ID', '').trim();
    const bankName = this.configService.get<string>('BANK_NAME', bankId).trim() || bankId;
    const accountNo = this.configService.get<string>('ACCOUNT_NO', '').trim();
    const accountName = this.configService.get<string>('ACCOUNT_NAME', '').trim();
    if (!bankId || !accountNo || !accountName) {
      throw new ServiceUnavailableException('Thông tin nhận thanh toán chưa được cấu hình');
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const orderCode = this.generateOrderCode();
      const lookupToken = this.lookupToken(orderCode);
      const vietQrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(accountName)}`;
      try {
        const order = await new this.orderModel({
          orderCode,
          productId: String(product._id),
          productName: product.name,
          productSlug: product.slug,
          category: product.category,
          variantId: variant?.id || '',
          variantName: variant?.name || '',
          sku: variant?.sku || '',
          deliveryLabel: variant?.deliveryLabel || product.deliveryLabel || '',
          warrantySnapshot: product.warrantyNotes || [],
          quantity: requestedQuantity,
          unitPrice,
          totalPrice,
          customerEmail: input.customerEmail?.trim().toLowerCase() || '',
          customerNote: input.customerNote?.trim() || '',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
          paymentProvider: 'MANUAL_BANK',
          paymentTransferContent: orderCode,
          vietQrUrl,
          bankId,
          bankName,
          bankAccountNo: accountNo,
          bankAccountName: accountName,
          deliveredKeys: [],
          idempotencyKeyHash,
          lookupTokenHash: this.hash(lookupToken),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          auditTrail: [{ type: 'ORDER_CREATED', at: new Date(), note: 'Server quote accepted' }],
        }).save();
        return { order: this.publicOrder(order), lookupToken, idempotentReplay: false };
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          if (idempotencyKeyHash) {
            const existing = await this.orderModel.findOne({ idempotencyKeyHash }).exec();
            if (existing) {
              return { order: this.publicOrder(existing), lookupToken: this.lookupToken(existing.orderCode), idempotentReplay: true };
            }
          }
          continue;
        }
        throw error;
      }
    }
    throw new ServiceUnavailableException('Không thể cấp mã đơn an toàn, vui lòng thử lại');
  }

  async lookupOrder(orderCode: string, token: string): Promise<PublicOrder> {
    await this.expireStaleOrders();
    const normalizedCode = orderCode.trim().toUpperCase();
    const order = await this.orderModel.findOne({ orderCode: normalizedCode })
      .select('+lookupTokenHash +deliveryCiphertext +deliveryIv +deliveryAuthTag')
      .exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const providedHash = this.hash(token);
    if (!order.lookupTokenHash || !this.secureEqual(order.lookupTokenHash, providedHash)) {
      throw new UnauthorizedException('Mã tra cứu không hợp lệ');
    }
    return this.publicOrder(order, true);
  }

  async reportPayment(orderCode: string, token: string): Promise<PublicOrder> {
    await this.expireStaleOrders();
    const normalizedCode = orderCode.trim().toUpperCase();
    const order = await this.orderModel.findOne({ orderCode: normalizedCode }).select('+lookupTokenHash').exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const providedHash = this.hash(token);
    if (!order.lookupTokenHash || !this.secureEqual(order.lookupTokenHash, providedHash)) {
      throw new UnauthorizedException('Mã tra cứu không hợp lệ');
    }
    if (order.paymentStatus === PaymentStatus.PAID) return this.publicOrder(order);
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Đơn hàng không còn chờ thanh toán');
    }
    if (!order.customerReportedPaidAt) {
      order.customerReportedPaidAt = new Date();
      order.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      order.auditTrail.push({
        type: 'CUSTOMER_REPORTED_PAYMENT',
        at: order.customerReportedPaidAt,
        note: 'Awaiting bank verification; not treated as paid',
      });
      await order.save();
    }
    return this.publicOrder(order);
  }

  async completeOrder(orderCode: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderCode: orderCode.toUpperCase() }).exec();
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paymentStatus === PaymentStatus.PAID && order.fulfillmentStatus === FulfillmentStatus.FULFILLED) return order;

    order.status = OrderStatus.PAID;
    order.paymentStatus = PaymentStatus.PAID;
    order.paidAt = order.paidAt || new Date();
    order.auditTrail.push({ type: 'PAYMENT_CONFIRMED_MANUALLY', at: new Date(), note: 'Confirmed by authenticated admin' });

    const product = await this.productsService.findById(order.productId);
    if (!product || product.fulfillmentType !== FulfillmentType.API_KEY) {
      order.fulfillmentStatus = FulfillmentStatus.NEEDS_REVIEW;
      order.auditTrail.push({ type: 'FULFILLMENT_QUEUED', at: new Date(), note: 'Manual service requires admin handling' });
      return order.save();
    }

    order.fulfillmentStatus = FulfillmentStatus.PROCESSING;
    await order.save();
    try {
      const assignedKeys = await this.keysService.assignKeys(product.model, order.quantity, order.orderCode);
      const encrypted = this.encryptDelivery(assignedKeys.join('\n'));
      order.deliveryCiphertext = encrypted.ciphertext;
      order.deliveryIv = encrypted.iv;
      order.deliveryAuthTag = encrypted.authTag;
      order.deliveredKeys = [];
      order.fulfillmentStatus = FulfillmentStatus.FULFILLED;
      order.auditTrail.push({ type: 'FULFILLMENT_COMPLETED', at: new Date(), note: 'Inventory assigned atomically' });
    } catch {
      order.fulfillmentStatus = FulfillmentStatus.NEEDS_REVIEW;
      order.auditTrail.push({ type: 'FULFILLMENT_NEEDS_REVIEW', at: new Date(), note: 'Payment retained; inventory was not delivered' });
    }
    return order.save();
  }

  async fulfillOrder(orderCode: string, deliveryContent: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderCode: orderCode.toUpperCase() }).exec();
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Chỉ được giao hàng sau khi đã xác nhận tiền vào tài khoản');
    }
    const content = deliveryContent.trim();
    if (!content) throw new BadRequestException('Nội dung giao hàng không được để trống');
    const encrypted = this.encryptDelivery(content);
    order.deliveryCiphertext = encrypted.ciphertext;
    order.deliveryIv = encrypted.iv;
    order.deliveryAuthTag = encrypted.authTag;
    order.deliveredKeys = [];
    order.fulfillmentStatus = FulfillmentStatus.FULFILLED;
    order.auditTrail.push({ type: 'FULFILLMENT_COMPLETED_MANUALLY', at: new Date(), note: 'Encrypted delivery saved by admin' });
    return order.save();
  }

  async cancelOrder(orderCode: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderCode: orderCode.toUpperCase() }).exec();
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Không thể hủy đơn đã thanh toán');
    order.status = OrderStatus.CANCELLED;
    order.paymentStatus = PaymentStatus.CANCELLED;
    order.auditTrail.push({ type: 'ORDER_CANCELLED', at: new Date() });
    return order.save();
  }

  async getAllOrders(): Promise<Order[]> {
    await this.expireStaleOrders();
    return this.orderModel.find().sort({ createdAt: -1 }).limit(100).exec();
  }

  private async expireStaleOrders(): Promise<void> {
    const now = new Date();
    await this.orderModel.updateMany(
      {
        paymentStatus: PaymentStatus.PENDING,
        customerReportedPaidAt: { $exists: false },
        expiresAt: { $lte: now },
      },
      {
        $set: { status: OrderStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED },
        $push: { auditTrail: { type: 'ORDER_EXPIRED', at: now, note: 'Payment window elapsed' } },
      },
    ).exec();
  }
}
