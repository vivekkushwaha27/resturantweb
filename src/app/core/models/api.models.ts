export type UserRole = 'User' | 'Worker' | 'Admin';
export type OrderType = 'DineIn' | 'Delivery';
export type OrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Preparing'
  | 'ReadyForTable'
  | 'Packed'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Razorpay';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  defaultAddress?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface UserAdmin extends UserProfile {
  createdAt: string;
}

export interface RegisterOtpRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  defaultAddress?: string | null;
}

export interface RegisterOtpResponse {
  message: string;
  developmentOtp?: string | null;
}

export interface VerifyRegistrationRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  finalPrice: number;
  isVegetarian: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  spiceLevel?: string | null;
}

export interface UpsertCategoryRequest {
  id?: string | null;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface UpsertMenuItemRequest {
  id?: string | null;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  isVegetarian: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  spiceLevel?: string | null;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  imageUrl?: string | null;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  notes?: string | null;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
}

export interface AddCartItemRequest {
  menuItemId: string;
  quantity: number;
  notes?: string | null;
}

export interface UpdateCartItemRequest {
  quantity: number;
  notes?: string | null;
}

export interface CreateOrderRequest {
  orderType: OrderType;
  tableNumber?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  paymentMethod: PaymentMethod;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  unitPrice: number;
  discountPercent: number;
  quantity: number;
  notes?: string | null;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  tableNumber?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  subtotal: number;
  discountTotal: number;
  serviceCharge: number;
  deliveryCharge: number;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
}

export interface RazorpayCreateOrderResponse {
  orderId: string;
  providerOrderId: string;
  keyId: string;
  amountInPaise: number;
  currency: string;
  message?: string | null;
}

export interface RazorpayVerifyRequest {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}

export interface DashboardStats {
  pendingOrders: number;
  preparingOrders: number;
  deliveredToday: number;
  revenueToday: number;
  activeUsers: number;
  menuItems: number;
}
