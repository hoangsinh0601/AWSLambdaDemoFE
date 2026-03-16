"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import type { InventoryHistoryItem, InventorySummaryStats, MenuItem } from "../../lib/types";
import { ToastContainer, useToast } from "../../components/Toast";
import { downloadCsv } from "../../lib/utils";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [summary, setSummary] = useState<InventorySummaryStats | null>(null);
  const [history, setHistory] = useState<InventoryHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");
  const [historyFilter, setHistoryFilter] = useState<"ALL" | InventoryHistoryItem["action"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [data, summaryData] = await Promise.all([
        api.adminListInventory(),
        api.adminGetInventorySummary(),
      ]);
      setItems(data);
      setSummary(summaryData.stats);
      setHistory(summaryData.history);
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.menuItemId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "IN_STOCK"
            ? Boolean(item.inventory?.inStock)
            : !item.inventory?.inStock;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesSearch =
        entry.menuItemId.toLowerCase().includes(search.toLowerCase()) ||
        entry.note.toLowerCase().includes(search.toLowerCase());

      const matchesAction =
        historyFilter === "ALL" ? true : entry.action === historyFilter;

      return matchesSearch && matchesAction;
    });
  }, [history, historyFilter, search]);

  const topRemainingToday = useMemo(() => {
    return filteredItems
      .slice()
      .sort(
        (left, right) =>
          (right.inventory?.remainingToday ?? 0) -
          (left.inventory?.remainingToday ?? 0)
      )
      .slice(0, 6);
  }, [filteredItems]);

  const exportInventoryCsv = () => {
    downloadCsv("inventory-export.csv", [
      [
        "menuItemId",
        "name",
        "currentStock",
        "dailyLimit",
        "dailySold",
        "remainingToday",
        "inStock",
      ],
      ...filteredItems.map((item) => [
        item.menuItemId,
        item.name,
        String(item.inventory?.currentStock ?? 0),
        String(item.inventory?.dailyLimit ?? 0),
        String(item.inventory?.dailySold ?? 0),
        String(item.inventory?.remainingToday ?? 0),
        item.inventory?.inStock ? "true" : "false",
      ]),
    ]);
  };

  const exportHistoryCsv = () => {
    downloadCsv("inventory-history.csv", [
      [
        "historyId",
        "menuItemId",
        "action",
        "quantityDelta",
        "previousCurrentStock",
        "nextCurrentStock",
        "previousDailySold",
        "nextDailySold",
        "actor",
        "note",
        "createdAt",
      ],
      ...filteredHistory.map((entry) => [
        entry.historyId,
        entry.menuItemId,
        entry.action,
        String(entry.quantityDelta),
        String(entry.previousCurrentStock),
        String(entry.nextCurrentStock),
        String(entry.previousDailySold),
        String(entry.nextDailySold),
        entry.actor,
        entry.note,
        entry.createdAt,
      ]),
    ]);
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

        {summary ? (
          <section className="grid gap-4 md:grid-cols-5">
            <SummaryCard label="Tong mon" value={summary.totalMenuItems} tone="bg-stone-950 text-stone-50" />
            <SummaryCard label="Con hang" value={summary.inStockItems} tone="bg-emerald-100 text-emerald-800" />
            <SummaryCard label="Het hang" value={summary.outOfStockItems} tone="bg-rose-100 text-rose-800" />
            <SummaryCard label="Tong ton kho" value={summary.totalCurrentStock} tone="bg-amber-100 text-amber-900" />
            <SummaryCard label="Con lai hom nay" value={summary.totalRemainingToday} tone="bg-sky-100 text-sky-800" />
          </section>
        ) : null}

        <section className="grid gap-4 rounded-[1.5rem] border border-stone-200 bg-white/85 p-5 shadow-[0_18px_40px_rgba(91,61,37,0.08)] md:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-600">Tìm món</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên món hoặc menuItemId"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-600">Lọc trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | "IN_STOCK" | "OUT_OF_STOCK"
                )
              }
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="IN_STOCK">Còn hàng</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-600">Lọc lịch sử</span>
            <select
              value={historyFilter}
              onChange={(event) =>
                setHistoryFilter(
                  event.target.value as "ALL" | InventoryHistoryItem["action"]
                )
              }
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
            >
              <option value="ALL">Tất cả action</option>
              <option value="MANUAL_UPDATE">MANUAL_UPDATE</option>
              <option value="ORDER_CONFIRMED">ORDER_CONFIRMED</option>
              <option value="DAILY_RESET">DAILY_RESET</option>
              <option value="INITIALIZED">INITIALIZED</option>
            </select>
          </label>

          <div className="flex flex-col justify-end gap-2">
            <button
              type="button"
              onClick={exportInventoryCsv}
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Export inventory CSV
            </button>
            <button
              type="button"
              onClick={exportHistoryCsv}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            >
              Export history CSV
            </button>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-stone-200 bg-white/85 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-stone-900">Top món còn quota hôm nay</h2>
            <p className="mt-1 text-sm text-stone-500">
              Biểu đồ nhanh dựa trên số lượng còn lại trong ngày để admin thấy món nào sắp chạm ngưỡng.
            </p>
          </div>
          <div className="space-y-4">
            {topRemainingToday.map((item) => {
              const value = item.inventory?.remainingToday ?? 0;
              const maxValue = topRemainingToday[0]?.inventory?.remainingToday ?? 1;
              const widthPercent = maxValue > 0 ? Math.max((value / maxValue) * 100, 6) : 6;

              return (
                <div key={item.menuItemId}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-800">{item.name}</span>
                    <span className="text-stone-500">{value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-stone-100">
                    <div
                      className="h-3 rounded-full bg-[linear-gradient(90deg,#f59e0b,#ea580c)]"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
            {filteredItems.map((item) => (
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

        <section className="rounded-[1.5rem] border border-stone-200 bg-white/85 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-stone-900">Lịch sử tồn kho gần đây</h2>
            <p className="mt-1 text-sm text-stone-500">
              Bao gồm cập nhật tay, trừ kho khi đơn được xác nhận, và reset daily theo giờ Việt Nam.
            </p>
          </div>

          {filteredHistory.length === 0 ? (
            <p className="text-sm text-stone-500">Chưa có lịch sử thay đổi tồn kho.</p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => (
                <div key={entry.historyId} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        {entry.action} · {entry.menuItemId}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">{entry.note}</p>
                    </div>
                    <p className="text-xs text-stone-400">
                      {new Date(entry.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-700">
                      Stock: {entry.previousCurrentStock} → {entry.nextCurrentStock}
                    </span>
                    <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-700">
                      Daily sold: {entry.previousDailySold} → {entry.nextDailySold}
                    </span>
                    <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-700">
                      Daily limit: {entry.previousDailyLimit} → {entry.nextDailyLimit}
                    </span>
                    <span className="rounded-full bg-stone-950 px-3 py-1 text-stone-50">
                      Actor: {entry.actor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-[1.5rem] p-5 shadow-[0_12px_24px_rgba(91,61,37,0.08)] ${tone}`}>
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
