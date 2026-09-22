import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KeysService } from './keys.service';
import { ApiKey, ApiKeySchema } from '../../schemas/api-key.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
  ],
  providers: [KeysService],
  exports: [KeysService],
})
export class KeysModule {}
