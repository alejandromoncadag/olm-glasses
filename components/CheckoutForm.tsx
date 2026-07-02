"use client";

import { FormEvent, useEffect, useState } from "react";

type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

type FormErrors = Partial<Record<keyof CheckoutCustomer, string>>;

const emptyCustomer: CheckoutCustomer = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
};

function validateCustomer(customer: CheckoutCustomer) {
  const errors: FormErrors = {};

  if (!customer.fullName.trim()) {
    errors.fullName = "El nombre completo es obligatorio.";
  }

  if (!customer.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.email = "Escribe un correo electrónico válido.";
  }

  if (!customer.phone.trim()) {
    errors.phone = "El teléfono es obligatorio.";
  }

  if (!customer.address.trim()) {
    errors.address = "La dirección es obligatoria.";
  }

  if (!customer.city.trim()) {
    errors.city = "La ciudad es obligatoria.";
  }

  if (!customer.state.trim()) {
    errors.state = "El estado es obligatorio.";
  }

  if (!customer.zipCode.trim()) {
    errors.zipCode = "El código postal es obligatorio.";
  }

  return errors;
}

export default function CheckoutForm() {
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("olm-checkout-customer");

    if (!savedCustomer) {
      return;
    }

    try {
      setCustomer(JSON.parse(savedCustomer));
    } catch (error) {
      console.error("Could not read checkout customer:", error);
      localStorage.removeItem("olm-checkout-customer");
    }
  }, []);

  function updateCustomer(field: keyof CheckoutCustomer, value: string) {
    const updatedCustomer = {
      ...customer,
      [field]: value,
    };

    setCustomer(updatedCustomer);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSaved(false);

    localStorage.setItem(
      "olm-checkout-customer",
      JSON.stringify(updatedCustomer)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCustomer(customer);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSaved(false);
      return;
    }

    localStorage.setItem("olm-checkout-customer", JSON.stringify(customer));
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-semibold">Datos de envío</h2>

          <p className="mt-2 text-sm text-gray-600">
            Usaremos estos datos para preparar y dar seguimiento a tu pedido.
          </p>
        </div>

        {saved && (
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            Datos guardados
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-5">
        <label className="block">
          <span className="text-sm font-medium">Nombre completo</span>
          <input
            value={customer.fullName}
            onChange={(event) => updateCustomer("fullName", event.target.value)}
            required
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Alejandro Moncada"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Correo electrónico</span>
            <input
              type="email"
              value={customer.email}
              onChange={(event) => updateCustomer("email", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="correo@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Teléfono</span>
            <input
              type="tel"
              value={customer.phone}
              onChange={(event) => updateCustomer("phone", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="55 1234 5678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Dirección</span>
          <input
            value={customer.address}
            onChange={(event) => updateCustomer("address", event.target.value)}
            required
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Calle, número, colonia"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </label>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">Ciudad</span>
            <input
              value={customer.city}
              onChange={(event) => updateCustomer("city", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Ciudad"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Estado</span>
            <input
              value={customer.state}
              onChange={(event) => updateCustomer("state", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Estado"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Código postal</span>
            <input
              value={customer.zipCode}
              onChange={(event) => updateCustomer("zipCode", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="00000"
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
            )}
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-black px-6 py-3 text-white"
      >
        Guardar datos de envío
      </button>

      <p className="mt-3 text-xs text-gray-500">
        Después de guardar, revisa el resumen y haz clic en “Finalizar pedido”.
      </p>
    </form>
  );
}

