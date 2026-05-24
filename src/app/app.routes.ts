import { Routes } from '@angular/router';
import { AdminComponent } from './features/admin/admin.component';
import { AuthComponent } from './features/auth/auth.component';
import { CartComponent } from './features/cart/cart.component';
import { MenuComponent } from './features/menu/menu.component';
import { OrdersComponent } from './features/orders/orders.component';
import { WorkerComponent } from './features/worker/worker.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'menu' },
  { path: 'auth', component: AuthComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [authGuard] },
  { path: 'worker', component: WorkerComponent, canActivate: [authGuard], data: { roles: ['Worker', 'Admin'] } },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard], data: { roles: ['Admin'] } },
  { path: '**', redirectTo: 'menu' }
];
