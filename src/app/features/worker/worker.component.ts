import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order, OrderStatus } from '../../core/models/api.models';
import { ApiClient } from '../../core/services/api-client.service';
import { MATERIAL_IMPORTS } from '../../shared/material-imports';

@Component({
  selector: 'app-worker',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './worker.component.html',
  styleUrl: './worker.component.scss',
})
export class WorkerComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected selectedStatus: OrderStatus | '' = '';
  protected readonly statuses: OrderStatus[] = ['Pending', 'Accepted', 'Preparing', 'ReadyForTable', 'Packed', 'OutForDelivery', 'Delivered', 'Cancelled'];

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.getWorkerOrders(this.selectedStatus || null).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Unable to load worker orders.', 'Close', { duration: 3000 });
      },
    });
  }

  protected move(order: Order, status: OrderStatus): void {
    this.api.updateOrderStatus(order.id, status).subscribe({
      next: (updated) => {
        this.orders.update((orders) => orders.map((item) => item.id === updated.id ? updated : item));
        this.snackBar.open(`Order moved to ${status}.`, 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open('Status update failed.', 'Close', { duration: 3000 }),
    });
  }

  protected nextStatuses(order: Order): OrderStatus[] {
    if (order.orderType === 'DineIn') {
      const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
        Pending: ['Accepted', 'Cancelled'],
        Accepted: ['Preparing', 'Cancelled'],
        Preparing: ['ReadyForTable'],
        ReadyForTable: ['Delivered'],
      };
      return map[order.status] ?? [];
    }

    const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
      Pending: ['Accepted', 'Cancelled'],
      Accepted: ['Preparing', 'Cancelled'],
      Preparing: ['Packed'],
      Packed: ['OutForDelivery'],
      OutForDelivery: ['Delivered'],
    };
    return map[order.status] ?? [];
  }
}
