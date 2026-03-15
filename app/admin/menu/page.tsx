"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import type { MenuItem } from "../../lib/types";
import { formatVND } from "../../lib/utils";
import { ToastContainer, useToast } from "../../components/Toast";
import { useRouter } from "next/navigation";

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
  sortOrder: string;
}

const EMPTY_FORM: MenuFormData = {
  name: "",
  description: "",
  price: "",
  category: "main",
  imageUrl: "",
  available: true,
  sortOrder: "0",
};

const CATEGORIES = [
  { value: "appetizer", label: "Khai vị" },
  { value: "main", label: "Món chính" },
  { value: "drink", label: "Thức uống" },
  { value: "dessert", label: "Tráng miệng" },
  { value: "other", label: "Khác" },
];

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const router = useRouter();

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListMenu();
      setItems(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Không thể tải menu", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const openCreateForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (item: MenuItem) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      imageUrl: item.imageUrl ?? "",
      available: item.available,
      sortOrder: String(item.sortOrder),
    });
    setEditingId(item.menuItemId);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category: formData.category,
      imageUrl: formData.imageUrl.trim(),
      available: formData.available,
      sortOrder: Number(formData.sortOrder) || 0,
    };

    try {
      if (editingId) {
        await api.adminUpdateMenu(editingId, payload);
        addToast("Cập nhật món thành công!", "success");
      } else {
        await api.adminCreateMenu(payload);
        addToast("Thêm món mới thành công!", "success");
      }
      closeForm();
      fetchMenu();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Xóa "${item.name}"?`)) return;
    setDeletingId(item.menuItemId);
    try {
      await api.adminDeleteMenu(item.menuItemId);
      addToast(`Đã xóa "${item.name}"`, "success");
      fetchMenu();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Xóa thất bại", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    try {
      await api.adminUpdateMenu(item.menuItemId, { available: !item.available });
      addToast(
        `"${item.name}" ${!item.available ? "đã bật bán" : "đã tắt bán"}`,
        "success"
      );
      fetchMenu();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Cập nhật thất bại", "error");
    }
  };

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,214,0.95),_rgba(248,228,203,0.9)_35%,_#f7efe6_70%)] px-6 py-10 text-stone-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <a
              onClick={() => router.back()}
              className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              ← Quay lại trang chủ
            </a>
            <h1 className="text-3xl font-bold text-stone-900">Quản lý Menu</h1>
            <p className="mt-1 text-sm text-stone-600">
              {items.length} món · {items.filter((i) => i.available).length} đang bán
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            + Thêm món mới
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-8 shadow-2xl">
              <h2 className="mb-6 text-xl font-bold text-stone-900">
                {editingId ? "Sửa món" : "Thêm món mới"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Tên món *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="VD: Ramen Tonkotsu"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="Mô tả ngắn về món ăn..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                      Giá (VND) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="89000"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                      Danh mục *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="h-5 w-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      Đang bán
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-stone-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:bg-stone-400"
                  >
                    {submitting
                      ? "Đang lưu..."
                      : editingId
                        ? "Cập nhật"
                        : "Thêm món"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-stone-200 bg-white/60 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-stone-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-stone-200" />
                    <div className="h-3 w-64 rounded bg-stone-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] border border-stone-200 bg-white/75 p-12 text-center">
            <p className="text-lg text-stone-500">Menu trống. Thêm món đầu tiên!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.menuItemId}
                className={`rounded-2xl border bg-white/80 p-5 shadow-sm transition hover:shadow-md ${item.available
                  ? "border-stone-200"
                  : "border-stone-200 opacity-60"
                  }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Sort order badge */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                      {item.sortOrder}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-stone-900">
                          {item.name}
                        </h3>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                          {getCategoryLabel(item.category)}
                        </span>
                        {!item.available && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Ngừng bán
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 max-w-xl truncate text-sm text-stone-500">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap text-sm font-semibold text-amber-800">
                      {formatVND(item.price)}
                    </span>

                    {/* Toggle available */}
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${item.available ? "bg-emerald-500" : "bg-stone-300"
                        }`}
                      title={item.available ? "Tắt bán" : "Bật bán"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${item.available ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditForm(item)}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                    >
                      Sửa
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.menuItemId}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item.menuItemId ? "..." : "Xóa"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
