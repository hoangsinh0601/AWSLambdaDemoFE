"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import type { Order, OrderStatus } from "../../lib/types";
import { ToastContainer, useToast } from "../../components/Toast";
import { formatVND, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../../lib/utils";
import { useRouter } from "next/navigation";

const adminActions: Array<{ label: string; status: OrderStatus; tone: string }> = [
  { label: "Xác nhận", status: "CONFIRMED", tone: "bg-emerald-600 hover:bg-emerald-500" },
  { label: "Từ chối", status: "CANCELLED", tone: "bg-rose-600 hover:bg-rose-500" },
  { label: "Đang nấu", status: "PREPARING", tone: "bg-amber-600 hover:bg-amber-500" },
  { label: "Sẵn sàng", status: "READY", tone: "bg-sky-600 hover:bg-sky-500" },
  { label: "Hoàn thành", status: "COMPLETED", tone: "bg-stone-800 hover:bg-stone-700" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listOrders();
      setOrders(data);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Không thể tải danh sách đơn", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      addToast(`Đã cập nhật đơn #${orderId.slice(0, 8)} sang ${ORDER_STATUS_LABELS[status]}`, "success");
      await fetchOrders();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Cập nhật đơn thất bại", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,214,0.95),_rgba(248,228,203,0.9)_35%,_#f7efe6_70%)] px-6 py-10 text-stone-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a onClick={() => router.back()} className="text-sm font-medium text-stone-500 hover:text-stone-900">
              ← Quay lại trang chủ
            </a>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">Điều phối đơn hàng</h1>
            <p className="mt-1 text-sm text-stone-500">
              Admin có thể xác nhận hoặc từ chối đơn. Khi xác nhận, user sẽ nhận thông báo và email.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/menu" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">
              Quản lý menu
            </Link>
            <button onClick={() => void fetchOrders()} className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
              Làm mới
            </button>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-white/70 p-6">
                <div className="h-5 w-40 rounded bg-stone-200" />
                <div className="mt-4 h-20 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[1.75rem] border border-stone-200 bg-white/80 p-8 text-center text-stone-500">
            Chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.orderId} className="rounded-[1.75rem] border border-stone-200 bg-white/85 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-mono text-lg font-semibold text-stone-900">#{order.orderId.slice(0, 8)}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {order.customerName} · {order.userEmail}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Tạo lúc {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {order.notes ? <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">{order.notes}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Tổng tiền</p>
                    <p className="text-2xl font-semibold text-amber-700">{formatVND(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <span key={`${order.orderId}-${item.menuItemId}`} className="rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-700">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {adminActions.map((action) => (
                    <button
                      key={`${order.orderId}-${action.status}`}
                      type="button"
                      disabled={updatingId === order.orderId || order.status === action.status}
                      onClick={() => void handleStatusUpdate(order.orderId, action.status)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-stone-300 ${action.tone}`}
                    >
                      {updatingId === order.orderId ? "Đang cập nhật..." : action.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
