import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

declare const Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService, private auth: AuthService) {}

  /** Start online payment for an order; falls back to a message when not configured. */
  pay(orderId: string, onPaid: () => void) {
    this.api.post(`payments/order/${orderId}`, {}).subscribe({
      next: (res: any) => {
        if (!res.enabled) {
          alert(res.message || 'Online payments are not enabled. Please pay cash on delivery.');
          return;
        }
        this.openCheckout(orderId, res, onPaid);
      },
      error: (e) => alert(e?.error?.message || 'Could not start payment'),
    });
  }

  private openCheckout(orderId: string, res: any, onPaid: () => void) {
    this.loadScript().then((ok) => {
      if (!ok) { alert('Could not load the payment window. Check your connection.'); return; }
      const rzp = new Razorpay({
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        order_id: res.rzpOrderId,
        name: 'RideFleet',
        description: `Order ${res.orderNumber}`,
        prefill: { name: this.auth.currentUser?.name, email: this.auth.currentUser?.email },
        theme: { color: '#6d28d9' },
        handler: (r: any) => {
          this.api.post('payments/verify', {
            orderId,
            razorpay_order_id: r.razorpay_order_id,
            razorpay_payment_id: r.razorpay_payment_id,
            razorpay_signature: r.razorpay_signature,
          }).subscribe({
            next: () => { alert('Payment successful ✓'); onPaid(); },
            error: () => alert('Payment could not be verified.'),
          });
        },
      });
      rzp.open();
    });
  }

  private loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof Razorpay !== 'undefined') return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }
}
