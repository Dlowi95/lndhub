import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KeysModule } from './modules/keys/keys.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthController } from './health.controller';
import { configureMongoDns } from './config/database-dns';
import { CategoriesModule } from './modules/categories/categories.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { GiftsModule } from './modules/gifts/gifts.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI', 'mongodb://127.0.0.1:27017/gemini_hub');
        configureMongoDns(uri, configService.get<string>('DNS_SERVERS'));

        return {
          uri,
          retryAttempts: Number(configService.get<string>('DB_RETRY_ATTEMPTS', '5')),
          retryDelay: Number(configService.get<string>('DB_RETRY_DELAY_MS', '1500')),
          serverSelectionTimeoutMS: Number(configService.get<string>('DB_CONNECT_TIMEOUT_MS', '10000')),
        };
      },
      inject: [ConfigService],
    }),
    ProductsModule,
    CategoriesModule,
    StorefrontModule,
    GiftsModule,
    OrdersModule,
    KeysModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
