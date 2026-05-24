import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cart, Order, OrderType, PaymentMethod, RazorpayCreateOrderResponse } from '../../core/models/api.models';
import { ApiClient } from '../../core/services/api-client.service';
import { AuthStore } from '../../core/services/auth-store.service';
import { MATERIAL_IMPORTS } from '../../shared/material-imports';

interface RazorpayCheckout {
  open(): void;
}

interface RazorpayWindow extends Window {
  Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly cart = signal<Cart>({ items: [], subtotal: 0, discountTotal: 0, grandTotal: 0 });
  protected readonly loading = signal(true);
  protected readonly placingOrder = signal(false);

  protected readonly checkoutForm = this.fb.group({
    orderType: this.fb.nonNullable.control<OrderType>('DineIn', Validators.required),
    tableNumber: this.fb.nonNullable.control('T1'),
    deliveryAddress: this.fb.nonNullable.control(this.auth.user()?.defaultAddress ?? ''),
    notes: this.fb.nonNullable.control(''),
    paymentMethod: this.fb.nonNullable.control<PaymentMethod>('Cash', Validators.required),
  });

  ngOnInit(): void {
    this.loadCart();
  }

  protected loadCart(): void {
    this.loading.set(true);
    this.api.getCart().subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Unable to load cart.', 'Close', { duration: 3000 });
      },
    });
  }

  protected updateQuantity(itemId: string, quantity: number, notes?: string | null): void {
    this.api.updateCartItem(itemId, { quantity, notes }).subscribe((cart) => this.cart.set(cart));
  }

  protected remove(itemId: string): void {
    this.api.removeCartItem(itemId).subscribe((cart) => this.cart.set(cart));
  }

  protected placeOrder(): void {
    if (this.checkoutForm.invalid || this.cart().items.length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const request = this.checkoutForm.getRawValue();
    this.placingOrder.set(true);
    this.api.createOrder({
      orderType: request.orderType,
      tableNumber: request.orderType === 'DineIn' ? request.tableNumber : null,
      deliveryAddress: request.orderType === 'Delivery' ? request.deliveryAddress : null,
      notes: request.notes,
      paymentMethod: request.paymentMethod,
    }).subscribe({
      next: (order) => {
        this.cart.set({ items: [], subtotal: 0, discountTotal: 0, grandTotal: 0 });
        if (order.paymentMethod === 'Razorpay') {
          this.startRazorpay(order);
        } else {
          this.placingOrder.set(false);
          this.router.navigateByUrl('/orders');
        }
      },
      error: (error) => {
        this.placingOrder.set(false);
        this.snackBar.open(error.error?.error ?? 'Order could not be placed.', 'Close', { duration: 4000 });
      },
    });
  }

  private startRazorpay(order: Order): void {
    this.api.createRazorpayOrder(order.id).subscribe({
      next: async (payment) => {
        if (payment.message || !payment.keyId) {
          this.placingOrder.set(false);
          this.snackBar.open(payment.message ?? 'Razorpay key is missing.', 'Orders', { duration: 5000 }).onAction().subscribe(() => this.router.navigateByUrl('/orders'));
          this.router.navigateByUrl('/orders');
          return;
        }

        const loaded = await this.loadRazorpayScript();
        if (!loaded) {
          this.placingOrder.set(false);
          this.snackBar.open('Razorpay checkout could not be loaded.', 'Close', { duration: 4000 });
          return;
        }

        this.openRazorpay(order, payment);
      },
      error: () => {
        this.placingOrder.set(false);
        this.snackBar.open('Razorpay order could not be created.', 'Close', { duration: 4000 });
      },
    });
  }

 private openRazorpay(order: Order, payment: RazorpayCreateOrderResponse): void {

  const razorpayWindow = window as RazorpayWindow;

  const checkout = new razorpayWindow.Razorpay!({

    key: payment.keyId,

    amount: payment.amountInPaise,

    currency: payment.currency,

    name: 'Restaurant Enterprise',

    description: `Order ${order.orderNumber}`,

    image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',

    order_id: payment.providerOrderId,

prefill: {
  name: this.auth.user()?.fullName ?? 'Customer',
  email: this.auth.user()?.email ?? 'customer@example.com',
  contact: this.auth.user()?.phone ?? '9999999999',
},

    notes: {
      orderId: order.id,
    },

    theme: {
      color: '#16a34a',
    },

    retry: {
      enabled: true,
    },

    modal: {
      ondismiss: () => {
        this.placingOrder.set(false);
      },
    },

    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {

      this.api.verifyRazorpayPayment({
        orderId: order.id,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      }).subscribe({

        next: () => {

          this.placingOrder.set(false);

          this.snackBar.open(
            'Payment successful!',
            'Close',
            {
              duration: 4000,
            }
          );

          this.router.navigateByUrl('/orders');
        },

        error: () => {

          this.placingOrder.set(false);

          this.snackBar.open(
            'Payment verification failed.',
            'Close',
            {
              duration: 4000,
            }
          );
        },
      });
    },

    config: {
      display: {

        blocks: {

          upi: {
            name: 'Pay using UPI',
            instruments: [
              {
                method: 'upi',
              },
            ],
          },

          cards: {
            name: 'Pay using Cards',
            instruments: [
              {
                method: 'card',
              },
            ],
          },

          netbanking: {
            name: 'Net Banking',
            instruments: [
              {
                method: 'netbanking',
              },
            ],
          },

          wallets: {
            name: 'Wallets',
            instruments: [
              {
                method: 'wallet',
              },
            ],
          },
        },

        sequence: [
          'block.upi',
          'block.cards',
          'block.netbanking',
          'block.wallets',
        ],

        preferences: {
          show_default_blocks: true,
        },
      },
    },
  });

  checkout.open();
}

  private loadRazorpayScript(): Promise<boolean> {
    if ((window as RazorpayWindow).Razorpay) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}
