import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Start a payment for an order (returns Razorpay order + key, or enabled:false).
  @Post('order/:orderId')
  createOrder(@Param('orderId') orderId: string, @CurrentUser() user: AuthUser) {
    return this.paymentService.createOrder(orderId, user);
  }

  // Confirm payment after Razorpay Checkout succeeds.
  @Post('verify')
  verify(
    @Body()
    body: {
      orderId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentService.verify(
      body.orderId,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      user,
    );
  }
}
