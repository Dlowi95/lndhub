import { Controller, Get, Param, Post, Put, Delete, Body, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts() {
    const products = await this.productsService.findAll();
    return {
      success: true,
      data: products,
    };
  }

  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return {
      success: true,
      data: product,
    };
  }
}
