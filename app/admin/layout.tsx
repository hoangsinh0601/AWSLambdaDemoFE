"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !isAdmin) {
      router.replace("/auth?mode=login");
    }
  }, [isAdmin, isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-50">
        <p className="text-sm tracking-[0.2em] uppercase">Đang kiểm tra quyền truy cập...</p>
      </main>
    );
  }

  return <>{children}</>;
}
