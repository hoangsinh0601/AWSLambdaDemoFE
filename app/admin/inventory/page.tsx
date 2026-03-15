"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import type { MenuItem } from "../../lib/types";
import { ToastContainer, useToast } from "../../components/Toast";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListInventory();
      setItems(data);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Không thể tải tồn kho", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const updateField = async (
    menuItemId: string,
    field: "currentStock" | "dailyLimit",
    value: number
  ) => {
    setSavingId(menuItemId);
    try {
      await api.adminUpdateInventory(menuItemId, { [field]: value });
      addToast("Cập nhật tồn kho thành công", "success");
      await fetchInventory();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Cập nhật tồn kho thất bại", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,214,0.95),_rgba(248,228,203,0.9)_35%,_#f7efe6_70%)] px-6 py-10 text-stone-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm font-medium text-stone-500 hover:text-stone-900">
              ← Quay lại cổng admin
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Quản lý tồn kho</h1>
            <p className="mt-1 text-sm text-stone-500">
              Admin có thể chỉnh số lượng hiện tại và giới hạn bán theo ngày cho từng món.
            </p>
          </div>
          <button
            onClick={() => void fetchInventory()}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Làm mới
          </button>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-[1.5rem] border border-stone-200 bg-white/80 p-6">
                <div className="h-6 w-52 rounded bg-stone-200" />
                <div className="mt-4 h-16 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.menuItemId}
                className="rounded-[1.5rem] border border-stone-200 bg-white/85 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]"
              >
                <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-900">{item.name}</h2>
                    <p className="mt-1 text-sm text-stone-500">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                        Đã bán hôm nay: {item.inventory?.dailySold ?? 0}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          item.inventory?.inStock
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.inventory?.inStock ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block rounded-2xl bg-stone-50 p-4">
                      <span className="mb-2 block text-sm font-medium text-stone-600">
                        Số lượng hiện tại
                      </span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={item.inventory?.currentStock ?? 0}
                        onBlur={(event) =>
                          void updateField(
                            item.menuItemId,
                            "currentStock",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="block rounded-2xl bg-stone-50 p-4">
                      <span className="mb-2 block text-sm font-medium text-stone-600">
                        Giới hạn theo ngày
                      </span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={item.inventory?.dailyLimit ?? 0}
                        onBlur={(event) =>
                          void updateField(
                            item.menuItemId,
                            "dailyLimit",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                      />
                    </label>

                    <div className="rounded-2xl bg-stone-950 p-4 text-stone-50">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Còn lại hôm nay
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {item.inventory?.remainingToday ?? 0}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                        Trạng thái lưu
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {savingId === item.menuItemId ? "Đang lưu..." : "Đã đồng bộ"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
