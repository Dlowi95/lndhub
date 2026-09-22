import { Body, Controller, Get, Headers, NotFoundException, Param, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CreateOrderDto, LookupOrderDto, ReportPaymentDto } from './dto/orders.dto';
import { OrdersService } from './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  private flagEnabled(name: string): boolean {
    return this.configService.get<string>(name, 'false').toLowerCase() === 'true';
  }

  @Post('checkout')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async createOrder(
    @Body() body: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!this.flagEnabled('ENABLE_CHECKOUT')) {
      throw new ServiceUnavailableException('Checkout is not available yet');
    }
    return { success: true, data: await this.ordersService.createOrder(body, idempotencyKey) };
  }

  @Get('lookup/:orderCode')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  async lookupOrder(@Param('orderCode') orderCode: string, @Query() query: LookupOrderDto) {
    return { success: true, data: await this.ordersService.lookupOrder(orderCode, query.token) };
  }

  @Post(':orderCode/report-payment')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  async reportPayment(@Param('orderCode') orderCode: string, @Body() body: ReportPaymentDto) {
    return { success: true, data: await this.ordersService.reportPayment(orderCode, body.token) };
  }

  @Post('simulate-payment/:orderCode')
  async simulatePayment(@Param('orderCode') orderCode: string) {
    if (process.env.NODE_ENV === 'production' || !this.flagEnabled('ENABLE_PAYMENT_SIMULATION')) {
      throw new NotFoundException();
    }
    return {
      success: true,
      message: 'Thanh toán thành công (chỉ môi trường phát triển)',
      data: await this.ordersService.completeOrder(orderCode),
    };
  }
}
