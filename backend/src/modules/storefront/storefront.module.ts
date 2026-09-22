import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Announcement, AnnouncementSchema } from '../../schemas/announcement.schema';
import { StoreSettings, StoreSettingsSchema } from '../../schemas/store-settings.schema';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreSettings.name, schema: StoreSettingsSchema },
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
    ProductsModule, CategoriesModule,
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
  exports: [StorefrontService],
})
export class StorefrontModule {}
