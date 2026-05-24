import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { DashboardStats, MenuCategory, MenuItem, Order, UserAdmin, UserRole } from '../../core/models/api.models';
import { ApiClient } from '../../core/services/api-client.service';
import { MATERIAL_IMPORTS } from '../../shared/material-imports';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly users = signal<UserAdmin[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly categories = signal<MenuCategory[]>([]);
  protected readonly items = signal<MenuItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly roles: UserRole[] = ['User', 'Worker', 'Admin'];

  protected readonly categoryForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    displayOrder: [1, Validators.required],
    isActive: [true],
  });

  protected readonly itemForm = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [199, [Validators.required, Validators.min(1)]],
    discountPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    isVegetarian: [true],
    isAvailable: [true],
    imageUrl: [''],
    spiceLevel: ['Medium'],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    forkJoin({
      stats: this.api.getDashboard(),
      users: this.api.getAdminUsers(),
      orders: this.api.getAdminOrders(),
      categories: this.api.getCategories(),
      items: this.api.getMenuItems({ available: null }),
    }).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.users.set(data.users);
        this.orders.set(data.orders);
        this.categories.set(data.categories);
        this.items.set(data.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Admin data could not be loaded.', 'Close', { duration: 4000 });
      },
    });
  }

  protected updateRole(user: UserAdmin, role: UserRole): void {
    this.api.updateUserRole(user.id, role).subscribe({
      next: (updated) => this.users.update((users) => users.map((item) => item.id === updated.id ? updated : item)),
      error: () => this.snackBar.open('Role update failed.', 'Close', { duration: 3000 }),
    });
  }

  protected setActive(user: UserAdmin, isActive: boolean): void {
    this.api.setUserActive(user.id, isActive).subscribe({
      next: () => this.users.update((users) => users.map((item) => item.id === user.id ? { ...item, isActive } : item)),
      error: () => this.snackBar.open('User status update failed.', 'Close', { duration: 3000 }),
    });
  }

  protected saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.api.upsertCategory(this.categoryForm.getRawValue()).subscribe({
      next: (category) => {
        this.categories.update((categories) => [...categories.filter((item) => item.id !== category.id), category].sort((a, b) => a.displayOrder - b.displayOrder));
        this.categoryForm.reset({ name: '', description: '', displayOrder: 1, isActive: true });
        this.snackBar.open('Category saved.', 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open('Category could not be saved.', 'Close', { duration: 3000 }),
    });
  }

  protected saveItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.api.upsertMenuItem(this.itemForm.getRawValue()).subscribe({
      next: (item) => {
        this.items.update((items) => [...items.filter((current) => current.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name)));
        this.itemForm.reset({ categoryId: '', name: '', description: '', price: 199, discountPercent: 0, isVegetarian: true, isAvailable: true, imageUrl: '', spiceLevel: 'Medium' });
        this.snackBar.open('Menu item saved.', 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open('Menu item could not be saved.', 'Close', { duration: 3000 }),
    });
  }

  protected setAvailability(item: MenuItem, isAvailable: boolean): void {
    this.api.setMenuAvailability(item.id, isAvailable).subscribe({
      next: () => this.items.update((items) => items.map((current) => current.id === item.id ? { ...current, isAvailable } : current)),
      error: () => this.snackBar.open('Availability update failed.', 'Close', { duration: 3000 }),
    });
  }
}
