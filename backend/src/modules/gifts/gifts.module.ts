import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GiftCampaign, GiftCampaignSchema } from '../../schemas/gift-campaign.schema';
import { GiftClaim, GiftClaimSchema } from '../../schemas/gift-claim.schema';
import { GiftItem, GiftItemSchema } from '../../schemas/gift-item.schema';
import { StorefrontModule } from '../storefront/storefront.module';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GiftCampaign.name, schema: GiftCampaignSchema },
      { name: GiftItem.name, schema: GiftItemSchema },
      { name: GiftClaim.name, schema: GiftClaimSchema },
    ]),
    StorefrontModule,
  ],
  controllers: [GiftsController],
  providers: [GiftsService],
  exports: [GiftsService],
})
export class GiftsModule {}
