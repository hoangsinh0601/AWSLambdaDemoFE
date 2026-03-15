import type { ApiResponse, AuthResponse, AuthUser, InventorySummary, MenuItem, Order, OrderItem, OrderStatus } from "./types";

const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL chưa được cấu hình");
  return url.replace(/\/$/, "");
};

const fetchApi = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
  const url = `${getApiUrl()}${path}`;
  const { headers, ...restOptions } = options ?? {};

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    ...restOptions,
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message ?? result.error ?? "Đã xảy ra lỗi");
  }

  return result.data;
};

export const api = {
  register: (payload: { name: string; email: string; password: string }): Promise<AuthResponse> =>
    fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }): Promise<AuthResponse> =>
    fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: (): Promise<AuthUser> => fetchApi<AuthUser>("/auth/me"),

  getMenu: (): Promise<MenuItem[]> => fetchApi<MenuItem[]>("/menu"),

  seedMenu: (): Promise<MenuItem[]> =>
    fetchApi<MenuItem[]>("/menu/seed", { method: "POST" }),

  createOrder: (items: OrderItem[], notes?: string): Promise<Order> =>
    fetchApi<Order>("/orders", {
      method: "POST",
      body: JSON.stringify({ items, notes }),
    }),

  listOrders: (): Promise<Order[]> => fetchApi<Order[]>("/orders"),

  getOrder: (orderId: string): Promise<Order> => fetchApi<Order>(`/orders/${orderId}`),

  updateOrderStatus: (orderId: string, status: OrderStatus): Promise<Order> =>
    fetchApi<Order>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Admin menu CRUD
  adminListMenu: (): Promise<MenuItem[]> => fetchApi<MenuItem[]>("/admin/menu"),

  adminCreateMenu: (data: Omit<MenuItem, "menuItemId" | "createdAt" | "updatedAt">): Promise<MenuItem> =>
    fetchApi<MenuItem>("/admin/menu", { method: "POST", body: JSON.stringify(data) }),

  adminUpdateMenu: (id: string, data: Partial<MenuItem>): Promise<MenuItem> =>
    fetchApi<MenuItem>(`/admin/menu/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  adminDeleteMenu: (id: string): Promise<null> =>
    fetchApi<null>(`/admin/menu/${id}`, { method: "DELETE" }),

  adminListInventory: (): Promise<MenuItem[]> =>
    fetchApi<MenuItem[]>("/admin/inventory"),

  adminUpdateInventory: (
    id: string,
    payload: Partial<Pick<InventorySummary, "currentStock" | "dailyLimit">>
  ): Promise<InventorySummary> =>
    fetchApi<InventorySummary>(`/admin/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
