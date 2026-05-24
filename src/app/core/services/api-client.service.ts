import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AddCartItemRequest,
  AuthResponse,
  Cart,
  CreateOrderRequest,
  DashboardStats,
  LoginRequest,
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  RazorpayCreateOrderResponse,
  RazorpayVerifyRequest,
  RegisterOtpRequest,
  RegisterOtpResponse,
  UpdateCartItemRequest,
  UpsertCategoryRequest,
  UpsertMenuItemRequest,
  UserAdmin,
  UserRole,
  VerifyRegistrationRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5249/api';

  requestRegistrationOtp(request: RegisterOtpRequest) {
    return this.http.post<RegisterOtpResponse>(`${this.apiUrl}/auth/register/request-otp`, request);
  }

  verifyRegistration(request: VerifyRegistrationRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register/verify`, request);
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request);
  }

  getCategories() {
    return this.http.get<MenuCategory[]>(`${this.apiUrl}/menu/categories`);
  }

  getMenuItems(query: { categoryId?: string | null; search?: string | null; vegetarian?: boolean | null; available?: boolean | null } = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<MenuItem[]>(`${this.apiUrl}/menu/items`, { params });
  }

  getCart() {
    return this.http.get<Cart>(`${this.apiUrl}/cart`);
  }

  addCartItem(request: AddCartItemRequest) {
    return this.http.post<Cart>(`${this.apiUrl}/cart/items`, request);
  }

  updateCartItem(cartItemId: string, request: UpdateCartItemRequest) {
    return this.http.put<Cart>(`${this.apiUrl}/cart/items/${cartItemId}`, request);
  }

  removeCartItem(cartItemId: string) {
    return this.http.delete<Cart>(`${this.apiUrl}/cart/items/${cartItemId}`);
  }

  clearCart() {
    return this.http.delete<void>(`${this.apiUrl}/cart`);
  }

  createOrder(request: CreateOrderRequest) {
    return this.http.post<Order>(`${this.apiUrl}/orders`, request);
  }

  getMyOrders() {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/my`);
  }

  cancelOrder(orderId: string) {
    return this.http.put<Order>(`${this.apiUrl}/orders/${orderId}/cancel`, {});
  }

  createRazorpayOrder(orderId: string) {
    return this.http.post<RazorpayCreateOrderResponse>(`${this.apiUrl}/payments/razorpay/create-order`, { orderId });
  }

  verifyRazorpayPayment(request: RazorpayVerifyRequest) {
    return this.http.post(`${this.apiUrl}/payments/razorpay/verify`, request);
  }

  getWorkerOrders(status?: OrderStatus | null) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Order[]>(`${this.apiUrl}/worker/orders`, { params });
  }

  updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.http.put<Order>(`${this.apiUrl}/worker/orders/${orderId}/status`, { status });
  }

  getDashboard() {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard`);
  }

  getAdminUsers() {
    return this.http.get<UserAdmin[]>(`${this.apiUrl}/admin/users`);
  }

  updateUserRole(userId: string, role: UserRole) {
    return this.http.put<UserAdmin>(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  setUserActive(userId: string, isActive: boolean) {
    return this.http.put<void>(`${this.apiUrl}/admin/users/${userId}/active`, { isActive });
  }

  getAdminOrders(status?: OrderStatus | null) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Order[]>(`${this.apiUrl}/admin/orders`, { params });
  }

  upsertCategory(request: UpsertCategoryRequest) {
    return this.http.post<MenuCategory>(`${this.apiUrl}/admin/menu/categories`, request);
  }

  upsertMenuItem(request: UpsertMenuItemRequest) {
    return this.http.post<MenuItem>(`${this.apiUrl}/admin/menu/items`, request);
  }

  setMenuAvailability(itemId: string, isAvailable: boolean) {
    return this.http.put<void>(`${this.apiUrl}/admin/menu/items/${itemId}/availability`, { isAvailable });
  }
}
