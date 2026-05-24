import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MATERIAL_IMPORTS } from './shared/material-imports';
import { AuthStore } from './core/services/auth-store.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ...MATERIAL_IMPORTS],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthStore);
  protected readonly theme = inject(ThemeService);

  protected readonly links = computed(() => {
    const user = this.auth.user();
    const links = [
      { label: 'Menu', path: '/menu', icon: 'restaurant_menu' },
      { label: 'Cart', path: '/cart', icon: 'shopping_cart' },
      { label: 'Orders', path: '/orders', icon: 'receipt_long' },
    ];

    if (user?.role === 'Worker' || user?.role === 'Admin') {
      links.push({ label: 'Worker', path: '/worker', icon: 'room_service' });
    }

    if (user?.role === 'Admin') {
      links.push({ label: 'Admin', path: '/admin', icon: 'admin_panel_settings' });
    }

    return links;
  });

  protected logout(): void {
    this.auth.logout();
  }
}
