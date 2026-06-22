"use client";

import { useEffect, useState } from "react";

type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

const emptyCustomer: CheckoutCustomer = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
};

export default function CheckoutForm() {
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("olm-checkout-customer");

    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  function updateCustomer(field: keyof CheckoutCustomer, value: string) {
    const updatedCustomer = {
      ...customer,
      [field]: value,
    };

    setCustomer(updatedCustomer);
    localStorage.setItem("olm-checkout-customer", JSON.stringify(updatedCustomer));
  }

  return (
    <form className="rounded-2xl border p-6">
      <h2 className="text-2xl font-semibold">Información del cliente</h2>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            type="text"
            value={customer.fullName}
            onChange={(event) => updateCustomer("fullName", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            placeholder="Alejandro Moncada"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Correo electrónico</label>
          <input
            type="email"
            value={customer.email}
            onChange={(event) => updateCustomer("email", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(event) => updateCustomer("phone", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            placeholder="+52 55 1234 5678"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Dirección de envío</label>
          <textarea
            value={customer.address}
            onChange={(event) => updateCustomer("address", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            rows={4}
            placeholder="Calle, número, colonia, ciudad, estado, código postal"
          />
        </div>
      </div>
    </form>
  );
}

