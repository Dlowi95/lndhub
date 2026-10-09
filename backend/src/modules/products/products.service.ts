import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument, ProductStatus } from '../../schemas/product.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultProducts();
  }

  async seedDefaultProducts() {
    if (this.configService.get<string>('ENABLE_DEMO_SEED', 'false').toLowerCase() !== 'true') return;

    try {
      const count = await this.productModel.countDocuments();
      if (count === 0) {
        const defaultProducts = [
          {
            name: 'Gemini 1.5 Pro - Key Cá Nhân (1M Context)',
            slug: 'gemini-15-pro-personal',
            category: 'gemini-pro',
            description: 'Khóa API Gemini 1.5 Pro chính hãng từ Google AI Studio, hỗ trợ Context Window 1,000,000 tokens, xử lý video, âm thanh, code chuyên sâu.',
            features: [
              'Model: gemini-1.5-pro-latest',
              'Context Window: 1,000,000 tokens',
              'Hỗ trợ Multimodal (Text, Image, Audio, Video, PDF)',
              'Bảo hành đổi mới 1:1 trong suốt thời gian sử dụng',
              'Tự động cấp key ngay sau khi chuyển khoản'
            ],
            model: 'gemini-1.5-pro',
            price: 69000,
            originalPrice: 120000,
            badge: 'BÁN CHẠY NHẤT',
            stockCount: 88,
            inStock: true,
            iconType: 'gemini',
          },
          {
            name: 'Gemini 1.5 Flash - Tốc Độ Cực Nhanh Siêu Tiết Kiệm',
            slug: 'gemini-15-flash-fast',
            category: 'gemini-flash',
            description: 'Phù hợp làm chatbot, agent tự động hóa, crawl dữ liệu cần độ trễ thấp dưới 300ms với chi phí tối ưu nhất.',
            features: [
              'Model: gemini-1.5-flash-latest',
              'Tốc độ phản hồi cực nhanh < 350ms',
              'Context Window: 1,000,000 tokens',
              'Hỗ trợ Function Calling & JSON Schema',
              'Cấp key tức thì 24/7'
            ],
            model: 'gemini-1.5-flash',
            price: 39000,
            originalPrice: 80000,
            badge: 'TIẾT KIỆM',
            stockCount: 120,
            inStock: true,
            iconType: 'gemini',
          },
          {
            name: 'Gemini 2.0 Flash / Pro Experimental - Thế Hệ Mới',
            slug: 'gemini-20-flash-exp',
            category: 'gemini-pro',
            description: 'Trải nghiệm sức mạnh mới nhất của Google DeepMind với Gemini 2.0, suy luận logic vượt bậc, code siêu tốc.',
            features: [
              'Model: gemini-2.0-flash-exp & gemini-exp',
              'Khả năng Coding & Reasoning thế hệ mới',
              'Hỗ trợ Realtime Multimodal Streaming',
              'Tương thích SDK Google GenAI & LangChain',
              'Giao key tự động 100%'
            ],
            model: 'gemini-2.0-flash',
            price: 99000,
            originalPrice: 160000,
            badge: 'MỚI NHẤT',
            stockCount: 45,
            inStock: true,
            iconType: 'gemini',
          },
          {
            name: 'Gemini Pro Enterprise - Hạn Mức Cao Cho Doanh Nghiệp',
            slug: 'gemini-pro-enterprise',
            category: 'enterprise',
            description: 'Gói API Quota cao cấp dành cho team phát triển, SaaS, công ty cần TPS/RPM cao và SLA ổn định 99.9%.',
            features: [
              'RPM/TPM x5 hạn mức thông thường',
              'Hỗ trợ cả Gemini 1.5 Pro & Flash',
              'Private Proxy & Direct Endpoint hỗ trợ',
              'Bảo hành hỗ trợ kỹ thuật 24/7 qua Telegram/Zalo',
              'Xuất hóa đơn dịch vụ theo yêu cầu'
            ],
            model: 'gemini-enterprise',
            price: 299000,
            originalPrice: 450000,
            badge: 'ENTERPRISE',
            stockCount: 25,
            inStock: true,
            iconType: 'gemini',
          },
          {
            name: 'Claude 3.5 Sonnet API Key (Anthropic)',
            slug: 'claude-35-sonnet-key',
            category: 'other',
            description: 'Key API Claude 3.5 Sonnet chính chủ Anthropic đỉnh cao coding, viết lách tự nhiên và suy luận sâu sắc.',
            features: [
              'Model: claude-3-5-sonnet-20241022',
              'Vua Coding & Logic hiện nay',
              'Hỗ trợ Artifacts & Computer Use',
              'Bảo hành chất lượng 100%'
            ],
            model: 'claude-3.5-sonnet',
            price: 129000,
            originalPrice: 199000,
            badge: 'HOT DEV',
            stockCount: 30,
            inStock: true,
            iconType: 'claude',
          },
        ];

        await this.productModel.insertMany(defaultProducts);
        console.log('Successfully seeded default products!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Could not seed products (MongoDB might be initializing):', message);
    }
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel
      .find({ status: ProductStatus.PUBLISHED })
      .sort({ sortOrder: 1, price: 1 })
      .exec();
  }

  async findAllAdmin(): Promise<ProductDocument[]> {
    return this.productModel.find().sort({ sortOrder: 1, updatedAt: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<ProductDocument | null> {
    return this.productModel.findOne({ slug, status: ProductStatus.PUBLISHED }).exec();
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findOne({ _id: id, status: ProductStatus.PUBLISHED }).exec();
  }

  async create(createProductDto: Partial<Product>): Promise<Product> {
    try {
      return await new this.productModel(createProductDto).save();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Slug sản phẩm đã tồn tại');
      }
      throw error;
    }
  }

  async update(id: string, updateProductDto: Partial<Product>): Promise<Product> {
    try {
      const product = await this.productModel
        .findByIdAndUpdate(id, updateProductDto, { new: true, runValidators: true })
        .exec();
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
      return product;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Slug sản phẩm đã tồn tại');
      }
      throw error;
    }
  }

  async archive(id: string): Promise<Product> {
    return this.update(id, { status: ProductStatus.ARCHIVED });
  }

  async countByCategory(category: string): Promise<number> {
    return this.productModel.countDocuments({
      category,
      status: { $ne: ProductStatus.ARCHIVED },
    });
  }

  async getAdminCounts() {
    const [totalProducts, publishedProductsCount, draftProductsCount] = await Promise.all([
      this.productModel.countDocuments({ status: { $ne: ProductStatus.ARCHIVED } }).exec(),
      this.productModel.countDocuments({ status: ProductStatus.PUBLISHED }).exec(),
      this.productModel.countDocuments({ status: ProductStatus.DRAFT }).exec(),
    ]);
    return { totalProducts, publishedProductsCount, draftProductsCount };
  }
}
