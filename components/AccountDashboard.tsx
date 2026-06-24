"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLikes } from "@/hooks/useLikes";
import { logout } from "@/lib/auth";

type Order = {
  orderNumber: string;
  createdAt: string;
  total: number;
};

type ExamBooking = {
  id: string;
  locationSlug: string;
  locationName: string;
  date: string;
  time: string;
  service: string;
  fullName: string;
};

export default function AccountDashboard() {
  const { user, loading } = useAuth();
  const { likes } = useLikes();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<ExamBooking[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login?redirect=/account";
    }
  }, [user, loading]);

  useEffect(() => {
    try {
      setOrders(JSON.parse(localStorage.getItem("olm-orders") || "[]"));
      setBookings(JSON.parse(localStorage.getItem("olm-eye-exam-bookings") || "[]"));
    } catch {
      setOrders([]);
      setBookings([]);
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-gray-600">Cargando…</p>
      </div>
    );
  }

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
            Mi cuenta
          </p>
          <h1 className="mt-3 text-4xl font-bold">Hola, {user.fullName.split(" ")[0]}</h1>
          <p className="mt-2 text-gray-600">{user.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-full border border-black px-5 py-2 text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <a
          href="/likes"
          className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Favoritos
          </p>
          <p className="mt-3 text-4xl font-bold">{likes.length}</p>
          <p className="mt-2 text-sm text-gray-600">
            Modelos guardados para después.
          </p>
        </a>

        <a
          href="/cart"
          className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Pedidos
          </p>
          <p className="mt-3 text-4xl font-bold">{orders.length}</p>
          <p className="mt-2 text-sm text-gray-600">
            Historial de tus compras.
          </p>
        </a>

        <a
          href="/eye-exam"
          className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Exámenes
          </p>
          <p className="mt-3 text-4xl font-bold">{bookings.length}</p>
          <p className="mt-2 text-sm text-gray-600">
            Citas agendadas con tu optometrista.
          </p>
        </a>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Próximas citas</h2>

        {bookings.length === 0 ? (
          <p className="mt-4 text-gray-600">
            No tienes exámenes agendados.{" "}
            <a href="/eye-exam" className="underline">
              Agenda uno aquí.
            </a>
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"
              >
                <div>
                  <p className="font-semibold">{booking.service}</p>
                  <p className="text-sm text-gray-600">
                    {booking.locationName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{booking.date}</p>
                  <p className="text-sm text-gray-600">{booking.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Pedidos recientes</h2>

        {orders.length === 0 ? (
          <p className="mt-4 text-gray-600">
            Aún no has hecho ningún pedido.{" "}
            <a href="/eyeglasses" className="underline">
              Explora lentes.
            </a>
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.orderNumber}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"
              >
                <div>
                  <p className="font-semibold">#{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <p className="font-medium">
                  ${order.total.toLocaleString("es-MX")} MXN
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
