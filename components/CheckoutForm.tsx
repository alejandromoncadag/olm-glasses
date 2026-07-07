"use client";

import { FormEvent, useEffect, useState } from "react";

type PaymentMethod = "bank_transfer" | "store_payment" | "cash_on_delivery";

type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  customerNotes: string;
  paymentMethod: PaymentMethod;
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
  customerNotes: "",
  paymentMethod: "bank_transfer",
};

const paymentOptions: {
  value: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "bank_transfer",
    label: "Transferencia bancaria",
    description: "Te enviaremos los datos para realizar la transferencia.",
  },
  {
    value: "store_payment",
    label: "Pago en tienda",
    description: "Paga directamente en la óptica al recoger tu pedido.",
  },
  {
    value: "cash_on_delivery",
    label: "Pago contra entrega",
    description: "Paga cuando recibas tu pedido, si está disponible en tu zona.",
  },
];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    value === "bank_transfer" ||
    value === "store_payment" ||
    value === "cash_on_delivery"
  );
}

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

  if (customer.customerNotes.length > 500) {
    errors.customerNotes = "La nota no puede tener más de 500 caracteres.";
  }

  if (!customer.paymentMethod) {
    errors.paymentMethod = "Selecciona una forma de pago.";
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
      const parsedCustomer = JSON.parse(
        savedCustomer
      ) as Partial<CheckoutCustomer>;

      setCustomer({
        ...emptyCustomer,
        ...parsedCustomer,
        customerNotes: parsedCustomer.customerNotes || "",
        paymentMethod: isPaymentMethod(parsedCustomer.paymentMethod)
          ? parsedCustomer.paymentMethod
          : "bank_transfer",
      });
    } catch (error) {
      console.error("Could not read checkout customer:", error);
      localStorage.removeItem("olm-checkout-customer");
    }
  }, []);

  function saveCustomerToStorage(updatedCustomer: CheckoutCustomer) {
    localStorage.setItem(
      "olm-checkout-customer",
      JSON.stringify(updatedCustomer)
    );

    window.dispatchEvent(new Event("olm-checkout-customer-updated"));
  }

  function updateCustomer(field: keyof CheckoutCustomer, value: string) {
    const updatedCustomer = {
      ...customer,
      [field]: value,
    } as CheckoutCustomer;

    setCustomer(updatedCustomer);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSaved(false);

    saveCustomerToStorage(updatedCustomer);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCustomer(customer);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSaved(false);
      return;
    }

    saveCustomerToStorage(customer);
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

        <label className="block rounded-2xl bg-gray-50 p-5">
          <span className="text-xl font-semibold">Notas para tu pedido</span>

          <p className="mt-2 text-sm text-gray-600">
            Puedes agregar instrucciones sobre tu graduación, envío o cualquier
            detalle importante.
          </p>

          <textarea
            value={customer.customerNotes}
            onChange={(event) =>
              updateCustomer("customerNotes", event.target.value)
            }
            rows={4}
            maxLength={500}
            className="mt-4 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-black"
            placeholder="Ejemplo: Voy a enviar mi receta por WhatsApp. Por favor llámenme antes de enviar."
          />

          <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500">
            <span>Opcional</span>
            <span>{customer.customerNotes.length}/500</span>
          </div>

          {errors.customerNotes && (
            <p className="mt-2 text-sm text-red-600">{errors.customerNotes}</p>
          )}
        </label>
      </div>

      <div className="mt-8 rounded-2xl bg-gray-50 p-5">
        <h3 className="text-xl font-semibold">Forma de pago</h3>

        <p className="mt-2 text-sm text-gray-600">
          Por ahora el pedido se crea como “sin pagar”. Después podrás marcarlo
          como pagado desde admin.
        </p>

        <div className="mt-5 grid gap-3">
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className={`block cursor-pointer rounded-2xl border bg-white p-4 ${
                customer.paymentMethod === option.value ? "border-black" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={customer.paymentMethod === option.value}
                  onChange={() => updateCustomer("paymentMethod", option.value)}
                  className="mt-1"
                />

                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>
              </div>
            </label>
          ))}

          <div className="rounded-2xl border border-dashed bg-white p-4 opacity-60">
            <p className="font-medium">Mercado Pago</p>
            <p className="mt-1 text-sm text-gray-600">
              Próximamente conectaremos Mercado Pago para pagar en línea.
            </p>
          </div>
        </div>

        {errors.paymentMethod && (
          <p className="mt-3 text-sm text-red-600">{errors.paymentMethod}</p>
        )}
      </div>

      <button
        type="submit"
        className="mt-6 rounded-full bg-black px-6 py-3 text-white"
      >
        Guardar datos de envío y pago
      </button>

      <p className="mt-3 text-xs text-gray-500">
        Después de guardar, revisa el resumen y haz clic en “Finalizar pedido”.
      </p>
    </form>
  );
}

