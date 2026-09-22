import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { KeysModule } from '../keys/keys.module';
import { AdminAuthGuard } from './admin-auth.guard';
import { CategoriesModule } from '../categories/categories.module';
import { StorefrontModule } from '../storefront/storefront.module';
import { GiftsModule } from '../gifts/gifts.module';

@Module({
  imports: [ProductsModule, CategoriesModule, OrdersModule, KeysModule, StorefrontModule, GiftsModule],
  controllers: [AdminController],
  providers: [AdminAuthGuard],
})
export class AdminModule {}
