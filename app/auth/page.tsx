"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") {
      return "login";
    }

    return new URLSearchParams(window.location.search).get("mode") === "register"
      ? "register"
      : "login";
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        if (mode === "register") {
          await register({ name, email, password });
        } else {
          await login({ email, password });
        }

        router.replace("/");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Xác thực thất bại");
      }
    });
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,_#1c1917,_#7c2d12_50%,_#f5e7da)] px-6 py-12 text-stone-900">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[2rem] border border-white/15 bg-stone-950/70 p-8 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-sm font-semibold tracking-[0.3em] text-amber-300 uppercase">
            Restaurant Access
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Đăng nhập để đặt món, đăng ký để tạo tài khoản mới.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-stone-300">
            User cần đặt hàng và theo dõi trạng thái đơn. Admin có thêm quyền quản lý menu và xác nhận đơn.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${mode === "login" ? "bg-amber-400 text-stone-950" : "border border-white/20 text-stone-200"}`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${mode === "register" ? "bg-amber-400 text-stone-950" : "border border-white/20 text-stone-200"}`}
            >
              Đăng ký
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-8 shadow-[0_24px_60px_rgba(76,48,28,0.18)]">
          <Link href="/" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            ← Về trang chủ
          </Link>
          <h2 className="mt-4 text-2xl font-semibold text-stone-900">
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-700">Họ tên</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-amber-500"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700">Mật khẩu</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-amber-500"
              />
            </label>

            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:bg-stone-400"
            >
              {isPending ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
