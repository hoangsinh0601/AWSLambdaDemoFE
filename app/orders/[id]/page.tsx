"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../lib/api";
import type { Order } from "../../lib/types";
import { formatVND, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../../lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const statusSteps = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"] as const;

  const getStepIndex = (status: string) => {
    if (status === "CANCELLED") return -1;
    return statusSteps.indexOf(status as typeof statusSteps[number]);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,214,0.95),_rgba(248,228,203,0.9)_35%,_#f7efe6_70%)] px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        {/* Back */}
        <a
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          ← Quay lại menu
        </a>

        {loading ? (
          <div className="animate-pulse space-y-6 rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-lg">
            <div className="h-6 w-48 rounded bg-stone-200" />
            <div className="h-4 w-32 rounded bg-stone-200" />
            <div className="h-24 w-full rounded bg-stone-100" />
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-lg font-medium text-rose-700">{error}</p>
            <button
              onClick={fetchOrder}
              className="mt-4 rounded-full bg-rose-700 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Thử lại
            </button>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_30px_80px_rgba(109,74,44,0.16)] backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                    Chi tiết đơn hàng
                  </p>
                  <h1 className="mt-2 font-mono text-2xl font-bold text-stone-900">
                    #{order.orderId.slice(0, 8)}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-stone-400 break-all">
                    {order.orderId}
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status] ?? "bg-stone-100 text-stone-700"}`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {/* Status timeline */}
              {order.status !== "CANCELLED" && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, idx) => {
                      const current = getStepIndex(order.status);
                      const isActive = idx <= current;
                      const isCurrent = idx === current;
                      return (
                        <div key={step} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${isCurrent
                                  ? "bg-amber-500 text-white ring-4 ring-amber-200"
                                  : isActive
                                    ? "bg-emerald-500 text-white"
                                    : "bg-stone-200 text-stone-500"
                                }`}
                            >
                              {isActive && !isCurrent ? "✓" : idx + 1}
                            </div>
                            <p
                              className={`mt-2 text-center text-xs ${isActive ? "font-semibold text-stone-900" : "text-stone-400"
                                }`}
                            >
                              {ORDER_STATUS_LABELS[step]}
                            </p>
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <div
                              className={`mx-1 h-0.5 flex-1 ${idx < current ? "bg-emerald-500" : "bg-stone-200"
                                }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {order.status === "CANCELLED" && (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                  <p className="text-sm font-medium text-rose-700">Đơn hàng đã bị hủy</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-lg backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-stone-900">Danh sách món</h2>
              <div className="divide-y divide-stone-200">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                        {item.quantity}
                      </span>
                      <span className="font-medium text-stone-900">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-700">
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-stone-300 pt-4">
                <span className="text-lg font-bold text-stone-900">Tổng cộng</span>
                <span className="text-lg font-bold text-amber-800">
                  {formatVND(order.totalAmount)}
                </span>
              </div>
              {order.notes && (
                <div className="mt-4 rounded-xl bg-stone-50 p-3">
                  <p className="text-xs uppercase tracking-widest text-stone-500">Ghi chú</p>
                  <p className="mt-1 text-sm text-stone-700">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-lg backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-stone-900">Thông tin thời gian</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-widest text-stone-500">Tạo lúc</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-widest text-stone-500">Cập nhật</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {new Date(order.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
