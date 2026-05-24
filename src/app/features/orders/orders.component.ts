import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order, OrderStatus } from '../../core/models/api.models';
import { ApiClient } from '../../core/services/api-client.service';
import { MATERIAL_IMPORTS } from '../../shared/material-imports';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.getMyOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Unable to load orders.', 'Close', { duration: 3000 });
      },
    });
  }

  protected cancel(order: Order): void {
    this.api.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.orders.update((orders) => orders.map((item) => item.id === updated.id ? updated : item));
        this.snackBar.open('Order cancelled.', 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open('Order could not be cancelled.', 'Close', { duration: 3000 }),
    });
  }

  protected canCancel(status: OrderStatus): boolean {
    return ['Pending', 'Accepted'].includes(status);
  }

  protected statusClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
      Accepted: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
      Preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
      ReadyForTable: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
      Packed: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200',
      OutForDelivery: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
      Delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
      Cancelled: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    };
    return map[status];
  }
}
