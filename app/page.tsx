"use client";

import { useState, useEffect } from "react";

const menuItems = [
  {
    id: "ramen",
    name: "Ramen",
    description: "Nuoc dung dam vi, mi tuoi va trung long dao.",
    price: "89.000 VND",
  },
  {
    id: "sushi",
    name: "Sushi",
    description: "Set sushi ca hoi tuoi, com giam nhe va wasabi.",
    price: "119.000 VND",
  },
  {
    id: "tra-da",
    name: "Tra da",
    description: "Ly tra da mat lanh, phu hop moi combo.",
    price: "12.000 VND",
  },
] as const;

export default function Home() {
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/orders`);
      if (response.ok) {
        const result = await response.json();
        setOrders(result.data || []);
      }
    } catch (error) {
      console.error("Fetch orders failed", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrder = async (itemName: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setErrorMessage("NEXT_PUBLIC_API_URL chua duoc cau hinh.");
      setSuccessMessage("");
      return;
    }

    setLoadingItem(itemName);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              name: itemName,
              quantity: 1,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Khong the tao don hang.");
      }

      setSuccessMessage("Dat hang thanh cong");
      fetchOrders();
    } catch (error) {
      console.error(error);
      setErrorMessage("Dat hang that bai. Vui long thu lai.");
    } finally {
      setLoadingItem(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,244,214,0.95),_rgba(248,228,203,0.9)_35%,_#f7efe6_70%)] px-6 py-10 text-stone-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_80px_rgba(109,74,44,0.16)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-10">
            <div className="space-y-5">
              <p className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold tracking-[0.2em] text-amber-900 uppercase">
                F&B Serverless Demo
              </p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl leading-tight font-semibold md:text-6xl">
                  Dat mon nhanh, day su kien xu ly o phia sau.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-700 md:text-lg">
                  Moi lan dat mon se di qua API Gateway, Lambda, DynamoDB, SNS
                  va SQS. UI nay dang duoc noi san de test luong end-to-end.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-stone-700">
                <span className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2">
                  Next.js App Router
                </span>
                <span className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2">
                  Tailwind CSS
                </span>
                <span className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2">
                  AWS Event-Driven
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-stone-950 p-6 text-stone-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
                API Binding
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  NEXT_PUBLIC_API_URL
                </p>
                <p className="mt-2 break-all font-mono text-sm text-stone-100">
                  {process.env.NEXT_PUBLIC_API_URL ?? "Chua cau hinh"}
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-300">
                Sau khi deploy backend, chi can cap nhat env cua frontend la co
                the goi `POST /orders`.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          {menuItems.map((item) => {
            const isLoading = loadingItem === item.name;

            return (
              <article
                key={item.id}
                className="group rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                      Mon signature
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-stone-900">
                      {item.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                    {item.price}
                  </span>
                </div>

                <p className="mt-4 min-h-20 text-sm leading-7 text-stone-600">
                  {item.description}
                </p>

                <button
                  type="button"
                  onClick={() => handleOrder(item.name)}
                  disabled={isLoading}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {isLoading ? "Dang gui don..." : "Dat mon"}
                </button>
              </article>
            );
          })}
        </section>

        {(successMessage || errorMessage) && (
          <section className="rounded-[1.5rem] border border-stone-200 bg-white/85 p-5 shadow-[0_18px_30px_rgba(91,61,37,0.08)]">
            {successMessage ? (
              <p className="font-medium text-emerald-700">{successMessage}</p>
            ) : null}
            {errorMessage ? (
              <p className="font-medium text-rose-700">{errorMessage}</p>
            ) : null}
          </section>
        )}

        <section className="mt-2 rounded-[1.75rem] border border-stone-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(91,61,37,0.08)]">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Danh sach don hang (Tu Dong Cap Nhat)
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-stone-500">Chua co don hang nao.</p>
          ) : (
            <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
              {orders.map((o) => (
                <div
                  key={o.orderId}
                  className="rounded-[1rem] border border-stone-200 bg-stone-50 p-4 transition hover:bg-stone-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold text-stone-900">
                        ID: {o.orderId}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Trang thai:{" "}
                        <span className="font-medium text-amber-700">
                          {o.status}
                        </span>
                      </p>
                    </div>
                    {o.timestamp && (
                      <span className="text-xs text-stone-400">
                        {new Date(o.timestamp).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.items?.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-block rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700"
                      >
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
