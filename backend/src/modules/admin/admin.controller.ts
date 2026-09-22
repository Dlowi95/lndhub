import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { FulfillOrderDto } from '../orders/dto/orders.dto';
import { KeysService } from '../keys/keys.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { CategoriesService } from '../categories/categories.service';
import { CategoryDto, CreateProductDto, UpdateCategoryDto, UpdateProductDto } from './dto/catalog.dto';
import { StorefrontService } from '../storefront/storefront.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, UpdateStoreSettingsDto } from './dto/storefront.dto';
import { GiftsService } from '../gifts/gifts.service';
import { ImportGiftItemsDto, UpdateGiftCampaignDto } from '../gifts/dto/gifts.dto';
import { ImportKeysDto } from './dto/inventory.dto';

@Controller('api/admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private ordersService: OrdersService,
    private keysService: KeysService,
    private storefrontService: StorefrontService,
    private giftsService: GiftsService,
  ) {}

  @Get('stats')
  async getStats() {
    const orders = await this.ordersService.getAllOrders();
    const products = await this.productsService.findAllAdmin();
    const categories = await this.categoriesService.findAll();
    const inventory = await this.keysService.getAllInventory();

    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID' || o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((acc, cur) => acc + (cur.totalPrice || 0), 0);
    const availableKeys = inventory.filter((k) => k.status === 'AVAILABLE').length;

    return {
      success: true,
      data: {
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        totalRevenue,
        totalProducts: products.length,
        publishedProductsCount: products.filter((product) => product.status === 'PUBLISHED').length,
        draftProductsCount: products.filter((product) => product.status === 'DRAFT').length,
        activeCategoriesCount: categories.filter((category) => category.isActive).length,
        availableKeysCount: availableKeys,
        recentOrders: orders.slice(0, 10),
      },
    };
  }

  @Get('store-settings')
  async getStoreSettings(): Promise<{ success: boolean; data: Record<string, unknown> }> {
    return { success: true, data: await this.storefrontService.getSettings() };
  }

  @Put('store-settings')
  async updateStoreSettings(@Body() body: UpdateStoreSettingsDto) {
    return { success: true, data: await this.storefrontService.updateSettings(body) };
  }

  @Get('announcements')
  async getAnnouncements() {
    return { success: true, data: await this.storefrontService.getAllAnnouncements() };
  }

  @Post('announcements')
  async createAnnouncement(@Body() body: CreateAnnouncementDto) {
    return { success: true, data: await this.storefrontService.createAnnouncement(body) };
  }

  @Put('announcements/:id')
  async updateAnnouncement(@Param('id') id: string, @Body() body: UpdateAnnouncementDto) {
    return { success: true, data: await this.storefrontService.updateAnnouncement(id, body) };
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@Param('id') id: string) {
    await this.storefrontService.deleteAnnouncement(id);
    return { success: true, message: 'Đã xóa thông báo' };
  }

  @Get('products')
  async getProducts() {
    return { success: true, data: await this.productsService.findAllAdmin() };
  }

  @Get('categories')
  async getCategories() {
    return { success: true, data: await this.categoriesService.findAll() };
  }

  @Post('categories')
  async createCategory(@Body() body: CategoryDto) {
    const category = await this.categoriesService.create(body);
    this.storefrontService.broadcast('catalog');
    return { success: true, data: category };
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, body);
    this.storefrontService.broadcast('catalog');
    return { success: true, data: category };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const categories = await this.categoriesService.findAll();
    const category = categories.find((item) => String(item._id) === id);
    if (!category) throw new BadRequestException('Danh mục không tồn tại');
    if (await this.productsService.countByCategory(category.slug)) {
      throw new BadRequestException('Danh mục đang có sản phẩm; hãy chuyển sản phẩm sang danh mục khác trước');
    }
    await this.categoriesService.remove(id);
    this.storefrontService.broadcast('catalog');
    return { success: true, message: 'Đã xóa danh mục trống' };
  }

  @Get('orders')
  async getAllOrders() {
    const orders = await this.ordersService.getAllOrders();
    return { success: true, data: orders };
  }

  @Post('orders/:orderCode/confirm-payment')
  async markOrderPaid(@Param('orderCode') orderCode: string) {
    const order = await this.ordersService.completeOrder(orderCode);
    return { success: true, data: { orderCode: order.orderCode, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus } };
  }

  @Post('orders/:orderCode/fulfill')
  async fulfillOrder(@Param('orderCode') orderCode: string, @Body() body: FulfillOrderDto) {
    const order = await this.ordersService.fulfillOrder(orderCode, body.deliveryContent);
    return { success: true, data: { orderCode: order.orderCode, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus } };
  }

  @Get('inventory')
  async getInventory() {
    const keys = await this.keysService.getAllInventory();
    return { success: true, data: keys };
  }

  @Get('gifts')
  async getGifts() {
    return { success: true, data: await this.giftsService.getAdminData() };
  }

  @Put('gifts/settings')
  async updateGiftSettings(@Body() body: UpdateGiftCampaignDto) {
    return { success: true, data: await this.giftsService.updateCampaign(body) };
  }

  @Post('gifts/import')
  async importGiftItems(@Body() body: ImportGiftItemsDto) {
    return { success: true, data: await this.giftsService.importItems(body) };
  }

  @Delete('gifts/:id')
  async deleteGiftItem(@Param('id') id: string) {
    await this.giftsService.deleteAvailableItem(id);
    return { success: true, message: 'Đã xóa quà chưa cấp phát' };
  }

  @Post('inventory/import')
  async importKeys(@Body() body: ImportKeysDto) {
    const res = await this.keysService.importKeys(body.keys, body.model);
    return { success: true, imported: res.count };
  }

  @Post('products')
  async createProduct(@Body() body: CreateProductDto) {
    const product = await this.productsService.create(body);
    this.storefrontService.broadcast('catalog');
    return { success: true, data: product };
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    const product = await this.productsService.update(id, body);
    this.storefrontService.broadcast('catalog');
    return { success: true, data: product };
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    const product = await this.productsService.archive(id);
    this.storefrontService.broadcast('catalog');
    return { success: true, data: product, message: 'Đã lưu trữ sản phẩm' };
  }
}
