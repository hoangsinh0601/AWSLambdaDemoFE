export interface InventorySummary {
  menuItemId: string;
  currentStock: number;
  dailyLimit: number;
  dailySold: number;
  remainingToday: number;
  inStock: boolean;
}

export interface InventoryHistoryItem {
  historyId: string;
  menuItemId: string;
  action: "MANUAL_UPDATE" | "ORDER_CONFIRMED" | "DAILY_RESET" | "INITIALIZED";
  quantityDelta: number;
  previousCurrentStock: number;
  nextCurrentStock: number;
  previousDailySold: number;
  nextDailySold: number;
  previousDailyLimit: number;
  nextDailyLimit: number;
  actor: string;
  note: string;
  createdAt: string;
}

export interface InventorySummaryStats {
  totalMenuItems: number;
  inStockItems: number;
  outOfStockItems: number;
  totalCurrentStock: number;
  totalRemainingToday: number;
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
