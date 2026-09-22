import { Controller, Get, Sse } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { ProductsService } from '../products/products.service';
import { StorefrontService } from './storefront.service';
import { SkipThrottle } from '@nestjs/throttler';
@Controller('api/storefront')
export class StorefrontController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly storefrontService: StorefrontService,
  ) {}
  @Get()
  async getStorefront(): Promise<{ success: boolean; data: Record<string, unknown> }> {
    const [products, categories, settings, announcements] = await Promise.all([
      this.productsService.findAll(), this.categoriesService.findPublic(),
      this.storefrontService.getSettings(), this.storefrontService.getPublicAnnouncements(),
    ]);
    return { success: true, data: { products, categories, settings, announcements } };
  }
  @Sse('events')
  @SkipThrottle()
  getEvents() {
    return this.storefrontService.getEvents();
  }
}
