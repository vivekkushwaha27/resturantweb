import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { MenuCategory, MenuItem } from '../../core/models/api.models';
import { ApiClient } from '../../core/services/api-client.service';
import { AuthStore } from '../../core/services/auth-store.service';
import { MATERIAL_IMPORTS } from '../../shared/material-imports';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly categories = signal<MenuCategory[]>([]);
  protected readonly items = signal<MenuItem[]>([]);
  protected readonly loading = signal(true);
  protected categoryId = '';
  protected search = '';
  protected vegetarianOnly = false;

  ngOnInit(): void {
    forkJoin({
      categories: this.api.getCategories(),
      items: this.api.getMenuItems(),
    }).subscribe({
      next: ({ categories, items }) => {
        this.categories.set(categories);
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Unable to load menu. Check the API connection.', 'Close', { duration: 4000 });
      },
    });
  }

  protected loadItems(): void {
    this.loading.set(true);
    this.api.getMenuItems({
      categoryId: this.categoryId || null,
      search: this.search,
      vegetarian: this.vegetarianOnly ? true : null,
      available: true,
    }).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Menu filter failed.', 'Close', { duration: 3000 });
      },
    });
  }

  protected addToCart(item: MenuItem): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: '/menu' } });
      return;
    }

    this.api.addCartItem({ menuItemId: item.id, quantity: 1 }).subscribe({
      next: () => this.snackBar.open(`${item.name} added to cart`, 'Cart', { duration: 2500 }).onAction().subscribe(() => this.router.navigateByUrl('/cart')),
      error: () => this.snackBar.open('Could not add item to cart.', 'Close', { duration: 3000 }),
    });
  }
}
