import { Controller, Get, Headers, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { GiftsService } from './gifts.service';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

@Controller('api/gifts/chatgpt-plus')
export class GiftsController {
  constructor(
    private readonly giftsService: GiftsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getStatus(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return { success: true, data: await this.giftsService.getStatus() };
  }

  @Post('claim')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async claim(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('cf-connecting-ip') cloudflareIp?: string,
  ) {
    response.setHeader('Cache-Control', 'no-store, private');
    const trustCloudflare = this.configService.get<string>('TRUST_CLOUDFLARE_HEADERS', 'false').toLowerCase() === 'true';
    const ip = (trustCloudflare ? cloudflareIp?.trim() : '') || request.ip || 'unknown';
    return { success: true, data: await this.giftsService.claim(ip) };
  }
}
