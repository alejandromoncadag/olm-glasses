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
      setBookings(
        JSON.parse(localStorage.getItem("olm-eye-exam-bookings") || "[]")
      );
    } catch {
      setOrders([]);
      setBookings([]);
    }
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-gray-600">Cargando…</p>
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
              Mi cuenta
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Hola, {user.fullName.split(" ")[0]}
            </h1>

            <p className="mt-2 text-gray-600">{user.email}</p>

            <span className="mt-4 inline-block rounded-full bg-black px-4 py-1 text-sm text-white">
              Administrador
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-fit rounded-full border border-black px-5 py-2 text-sm"
          >
            Cerrar sesión
          </button>
        </div>

        <section className="mt-12 rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-semibold">Área administrativa</h2>

          <p className="mt-3 text-gray-600">
            Desde aquí puedes entrar al panel admin para revisar pedidos,
            clientes, productos, inventario y reportes.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="/admin"
              className="rounded-full bg-black px-6 py-3 text-center text-white"
            >
              Ir al panel admin
            </a>

            <a
              href="/admin/reports"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver reportes
            </a>

            <a
              href="/admin/orders"
              className="rounded-full border px-6 py-3 text-center"
            >
              Ver pedidos
            </a>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <a
            href="/admin/products"
            className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
          >
            <p className="text-sm uppercase tracking-widest text-gray-500">
              Productos
            </p>

            <p className="mt-3 text-2xl font-bold">Catálogo</p>

            <p className="mt-2 text-sm text-gray-600">
              Editar precios, stock y productos activos.
            </p>
          </a>

          <a
            href="/admin/customers"
            className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
          >
            <p className="text-sm uppercase tracking-widest text-gray-500">
              Clientes
            </p>

            <p className="mt-3 text-2xl font-bold">Base de clientes</p>

            <p className="mt-2 text-sm text-gray-600">
              Ver historial de compras y contacto.
            </p>
          </a>

          <a
            href="/admin/inventory"
            className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
          >
            <p className="text-sm uppercase tracking-widest text-gray-500">
              Inventario
            </p>

            <p className="mt-3 text-2xl font-bold">Stock</p>

            <p className="mt-2 text-sm text-gray-600">
              Revisar stock bajo, agotados y movimientos.
            </p>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
            Mi cuenta
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Hola, {user.fullName.split(" ")[0]}
          </h1>

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
          href="/order-status"
          className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Pedidos
          </p>

          <p className="mt-3 text-4xl font-bold">{orders.length}</p>

          <p className="mt-2 text-sm text-gray-600">
            Consulta el estado de tus compras.
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






