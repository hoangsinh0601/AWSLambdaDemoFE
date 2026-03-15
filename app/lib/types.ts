export interface InventorySummary {
  menuItemId: string;
  currentStock: number;
  dailyLimit: number;
  dailySold: number;
  remainingToday: number;
  inStock: boolean;
}

export interface MenuItem {
  menuItemId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
  sortOrder: number;
  inventory?: InventorySummary;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  userId: string;
  userEmail: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
