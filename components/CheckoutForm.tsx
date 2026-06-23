"use client";

import { useEffect, useState } from "react";

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
  } else if (!customer.email.includes("@")) {
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
    localStorage.setItem(
      "olm-checkout-customer",
      JSON.stringify(updatedCustomer)
    );

    setSaved(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCustomer(customer);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    localStorage.setItem("olm-checkout-customer", JSON.stringify(customer));
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border p-6">
      <h2 className="text-2xl font-semibold">Datos de envío</h2>

      <p className="mt-2 text-sm text-gray-600">
        Completa tus datos para preparar tu pedido.
      </p>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            value={customer.fullName}
            onChange={(event) => updateCustomer("fullName", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Alejandro Moncada"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Correo electrónico</label>
          <input
            value={customer.email}
            onChange={(event) => updateCustomer("email", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="correo@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <input
            value={customer.phone}
            onChange={(event) => updateCustomer("phone", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="55 1234 5678"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Dirección</label>
          <input
            value={customer.address}
            onChange={(event) => updateCustomer("address", event.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
            placeholder="Calle, número, colonia"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Ciudad</label>
            <input
              value={customer.city}
              onChange={(event) => updateCustomer("city", event.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Ciudad"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Estado</label>
            <input
              value={customer.state}
              onChange={(event) => updateCustomer("state", event.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="Estado"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Código postal</label>
            <input
              value={customer.zipCode}
              onChange={(event) => updateCustomer("zipCode", event.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              placeholder="00000"
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-black px-6 py-3 text-white"
      >
        Guardar datos
      </button>

      {saved && (
        <p className="mt-3 text-sm font-medium text-green-700">
          Datos guardados correctamente.
        </p>
      )}
    </form>
  );
}


