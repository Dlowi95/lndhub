import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { SkipThrottle } from '@nestjs/throttler';
import { Connection } from 'mongoose';

@Controller('api/health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @SkipThrottle()
  async getHealth() {
    try {
      await this.connection.db?.admin().ping();
      return {
        status: 'ok',
        service: 'lndhub-backend',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException('Database health check failed');
    }
  }
}
