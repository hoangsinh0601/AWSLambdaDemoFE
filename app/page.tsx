"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, useToast } from "./components/Toast";
import { api } from "./lib/api";
import type { MenuItem, Order, OrderItem } from "./lib/types";
import { formatVND, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "./lib/utils";
import { useAuth } from "./providers/AuthProvider";

type CartItem = OrderItem;

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const latestStatusesRef = useRef<Record<string, string>>({});

  const fetchMenu = async () => {
    setLoadingMenu(true);
    setMenuError("");
    try {
      const items = await api.getMenu();
      startTransition(() => {
        setMenu(items);
      });
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : "Không thể tải menu");
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      startTransition(() => {
        setOrders([]);
      });
      return;
    }

    try {
      const nextOrders = await api.listOrders();

      nextOrders.forEach((order) => {
        const previousStatus = latestStatusesRef.current[order.orderId];

        if (previousStatus && previousStatus !== order.status) {
          if (order.status === "CONFIRMED") {
            addToast(`Đơn #${order.orderId.slice(0, 8)} đã được nhà hàng xác nhận`, "success");
          }

          if (order.status === "CANCELLED") {
            addToast(`Đơn #${order.orderId.slice(0, 8)} đã bị từ chối`, "error");
          }
        }

        latestStatusesRef.current[order.orderId] = order.status;
      });

      startTransition(() => {
        setOrders(nextOrders);
      });
    } catch (error) {
      console.error("Fetch orders failed", error);
    }
  }, [addToast, isAuthenticated]);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    fetchOrders();

    if (!isAuthenticated) {
      latestStatusesRef.current = {};
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchOrders();
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [authLoading, fetchOrders, isAuthenticated]);

  const groupedMenu = useMemo(() => {
    return menu.reduce<Record<string, MenuItem[]>>((accumulator, item) => {
      const category = item.category || "other";
      accumulator[category] ??= [];
      accumulator[category].push(item);
      return accumulator;
    }, {});
  }, [menu]);

  const sortedCategories = useMemo(() => {
    const categoryOrder = ["appetizer", "main", "drink", "dessert", "other"];
    return Object.keys(groupedMenu).sort((left, right) => categoryOrder.indexOf(left) - categoryOrder.indexOf(right));
  }, [groupedMenu]);

  const categoryLabels: Record<string, string> = {
    appetizer: "Khai vị",
    main: "Món chính",
    drink: "Thức uống",
    dessert: "Tráng miệng",
    other: "Khác",
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (menuItem: MenuItem) => {
    if (!isAuthenticated) {
      addToast("Bạn cần đăng nhập trước khi đặt món", "error");
      router.push("/auth?mode=login");
      return;
    }

    if (!menuItem.inventory?.inStock) {
      addToast(`"${menuItem.name}" hiện đã hết hàng`, "error");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.menuItemId === menuItem.menuItemId);
      if (existing) {
        return currentCart.map((item) =>
          item.menuItemId === menuItem.menuItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...currentCart,
        {
          menuItemId: menuItem.menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ];
    });

    addToast(`Đã thêm "${menuItem.name}" vào giỏ`, "success");
  };

  const updateCartQuantity = (menuItemId: string, nextQuantity: number) => {
    setCart((currentCart) => {
      if (nextQuantity <= 0) {
        return currentCart.filter((item) => item.menuItemId !== menuItemId);
      }

      return currentCart.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity: nextQuantity } : item
      );
    });
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      addToast("Bạn cần đăng nhập để đặt hàng", "error");
      router.push("/auth?mode=login");
      return;
    }

    if (cart.length === 0) {
      addToast("Giỏ hàng đang trống", "error");
      return;
    }

    setIsOrdering(true);
    try {
      const order = await api.createOrder(cart, notes.trim());
      addToast(`Đặt hàng thành công. Mã đơn #${order.orderId.slice(0, 8)}`, "success");
      setCart([]);
      setNotes("");
      await fetchOrders();
      router.push(`/orders/${order.orderId}`);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Đặt hàng thất bại", "error");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,214,0.95),_rgba(248,228,203,0.9)_35%,_#f7efe6_70%)] px-6 py-10 text-stone-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-6 shadow-[0_30px_80px_rgba(109,74,44,0.16)] backdrop-blur md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold tracking-[0.2em] text-amber-900 uppercase">
                Restaurant Ordering
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                Đặt nhiều món trong một giỏ và theo dõi trạng thái đơn hàng theo thời gian thực.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-stone-700 md:text-lg">
                Đây là trang dành riêng cho khách hàng. Menu hiển thị công khai, và bạn cần đăng nhập để đặt món.
              </p>
            </div>

            <div className="min-w-[280px] rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Tài khoản</p>
              {isAuthenticated && user ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-lg font-semibold">{user.name}</p>
                    <p className="text-sm text-stone-300">{user.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-200">{user.role}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-stone-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-7 text-stone-300">
                    Đăng nhập để có thể đặt hàng và nhận thông báo khi đơn được xác nhận.
                  </p>
                  <Link
                    href="/auth?mode=login"
                    className="inline-flex rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950"
                  >
                    Đăng nhập / Đăng ký
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-stone-50"
                  >
                    Cổng admin
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.5fr_0.72fr]">
          <section className="space-y-8">
            {loadingMenu ? (
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="animate-pulse rounded-[1.75rem] border border-stone-200/80 bg-white/60 p-6">
                    <div className="h-4 w-20 rounded bg-stone-200" />
                    <div className="mt-4 h-6 w-32 rounded bg-stone-200" />
                    <div className="mt-4 h-16 w-full rounded bg-stone-100" />
                    <div className="mt-6 h-11 w-full rounded-full bg-stone-200" />
                  </div>
                ))}
              </section>
            ) : menuError ? (
              <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
                <p className="font-medium text-rose-700">{menuError}</p>
                <button onClick={fetchMenu} className="mt-3 rounded-full bg-rose-700 px-5 py-2 text-sm font-semibold text-white">
                  Thử lại
                </button>
              </section>
            ) : (
              sortedCategories.map((category) => (
                <section key={category}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold uppercase tracking-[0.15em] text-stone-800">
                      {categoryLabels[category] ?? category}
                    </h2>
                    <p className="text-sm text-stone-500">{groupedMenu[category].length} món</p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {groupedMenu[category].map((item) => (
                      <article
                        key={item.menuItemId}
                        className="rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)] transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                              {categoryLabels[item.category] ?? item.category}
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold text-stone-900">{item.name}</h3>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                            {formatVND(item.price)}
                          </span>
                        </div>
                        <p className="mt-4 min-h-20 text-sm leading-7 text-stone-600">{item.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                          <span
                            className={`rounded-full px-3 py-1 ${
                              item.inventory?.inStock
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {item.inventory?.inStock ? "Còn hàng" : "Hết hàng"}
                          </span>
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">
                            Tồn hiện tại: {item.inventory?.currentStock ?? 0}
                          </span>
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">
                            Còn lại hôm nay: {item.inventory?.remainingToday ?? 0}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          disabled={!item.inventory?.inStock}
                          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          {item.inventory?.inStock ? "Thêm vào giỏ" : "Tạm hết hàng"}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-stone-200/80 bg-white/85 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Giỏ hàng</p>
                  <h2 className="mt-1 text-2xl font-semibold text-stone-900">{cart.length} món</h2>
                </div>
                <span className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
                  {formatVND(cartTotal)}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {cart.length === 0 ? (
                  <p className="rounded-2xl bg-stone-50 px-4 py-5 text-sm text-stone-500">
                    Chọn nhiều món từ menu bên trái để tạo một đơn hàng.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.menuItemId} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-900">{item.name}</p>
                          <p className="text-sm text-stone-500">{formatVND(item.price)} / món</p>
                        </div>
                        <p className="text-sm font-semibold text-stone-800">
                          {formatVND(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                          className="h-9 w-9 rounded-full border border-stone-300 text-lg"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                          className="h-9 w-9 rounded-full border border-stone-300 text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Ghi chú đơn hàng</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
                  placeholder="Ví dụ: ít đá, thêm dưa chua..."
                />
              </label>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isOrdering || (isAuthenticated && cart.length === 0)}
                className="mt-5 w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400 disabled:bg-stone-300"
              >
                {isOrdering ? "Đang tạo đơn..." : isAuthenticated ? "Đặt hàng" : "Đăng nhập để đặt hàng"}
              </button>
            </section>

            <section className="rounded-[1.75rem] border border-stone-200/80 bg-white/85 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-stone-900">Đơn của bạn</h2>
                {isAuthenticated ? (
                  <button onClick={() => void fetchOrders()} className="text-sm font-medium text-stone-500 hover:text-stone-900">
                    Làm mới
                  </button>
                ) : null}
              </div>
              {!isAuthenticated ? (
                <p className="mt-4 text-sm leading-7 text-stone-500">
                  Đăng nhập để xem lịch sử đơn và nhận thông báo khi admin xác nhận.
                </p>
              ) : orders.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">Bạn chưa có đơn hàng nào.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.orderId}
                      href={`/orders/${order.orderId}`}
                      className="block rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:bg-stone-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold text-stone-900">#{order.orderId.slice(0, 8)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                            <span className="text-xs text-stone-500">{formatVND(order.totalAmount)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(order.updatedAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
