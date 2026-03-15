"use client";

import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

export default function AdminHomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,_#1c1917,_#431407_45%,_#f5e7da)] px-6 py-10 text-stone-50">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-[0.3em] text-amber-300 uppercase">
                Admin Portal
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Trung tâm điều hành nhà hàng
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-stone-300 md:text-base">
                Quản lý menu, duyệt đơn, và theo dõi vận hành từ một trang riêng biệt hoàn toàn với giao diện người dùng.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Đăng nhập với</p>
              <p className="mt-2 text-lg font-semibold">{user?.name}</p>
              <p className="text-sm text-stone-300">{user?.email}</p>
              <button
                type="button"
                onClick={logout}
                className="mt-4 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-stone-100"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/orders"
            className="rounded-[1.75rem] border border-white/10 bg-white/10 p-8 transition hover:-translate-y-1 hover:bg-white/15"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Orders</p>
            <h2 className="mt-3 text-3xl font-semibold">Duyệt đơn hàng</h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Xác nhận, từ chối, chuyển trạng thái và kích hoạt email thông báo cho user.
            </p>
          </Link>

          <Link
            href="/admin/menu"
            className="rounded-[1.75rem] border border-white/10 bg-white/10 p-8 transition hover:-translate-y-1 hover:bg-white/15"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Menu</p>
            <h2 className="mt-3 text-3xl font-semibold">Quản lý món ăn</h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              CRUD món ăn, cập nhật giá, tắt mở bán và điều chỉnh thứ tự hiển thị trên trang chủ.
            </p>
          </Link>

          <Link
            href="/admin/inventory"
            className="rounded-[1.75rem] border border-white/10 bg-white/10 p-8 transition hover:-translate-y-1 hover:bg-white/15"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Inventory</p>
            <h2 className="mt-3 text-3xl font-semibold">Quản lý tồn kho</h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Điều chỉnh số lượng hiện tại và giới hạn bán theo ngày cho từng món.
            </p>
          </Link>
        </section>
      </section>
    </main>
  );
}
