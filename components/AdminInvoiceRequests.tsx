"use client";

import { useEffect, useMemo, useState } from "react";

import { downloadCsv } from "@/lib/csv";
import {
  getInvoiceStatusLabel,
  getPaymentMethodLabel,
  invoiceStatuses,
  type InvoiceStatus,
} from "@/lib/invoiceRequests";

type InvoiceRequest = {
  id: string;
  requestNumber: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  purchaseEmail: string;
  rfc: string;
  taxName: string;
  fiscalPostalCode: string;
  taxRegime: string;
  cfdiUse: string;
  invoiceEmail: string;
  paymentMethod: string;
  orderTotal: number;
  status: InvoiceStatus;
  adminNotes: string;
  rejectionReason: string;
  xmlUrl: string;
  pdfUrl: string;
  orderDate: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "No disponible";

  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClassName(status: InvoiceStatus) {
  if (status === "issued") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "cancelled") return "bg-gray-200 text-gray-700";
  return "bg-amber-100 text-amber-800";
}

export default function AdminInvoiceRequests() {
  const [invoiceRequests, setInvoiceRequests] = useState<InvoiceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState("");
  const [copiedRequest, setCopiedRequest] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadInvoiceRequests() {
      try {
        const response = await fetch("/api/invoice-requests");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No pudimos cargar las solicitudes.");
        }

        setInvoiceRequests(data.invoiceRequests || []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las solicitudes."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInvoiceRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoiceRequests.filter((invoiceRequest) => {
      const matchesStatus =
        statusFilter === "all" || invoiceRequest.status === statusFilter;
      const matchesSearch =
        !term ||
        [
          invoiceRequest.requestNumber,
          invoiceRequest.orderNumber,
          invoiceRequest.rfc,
          invoiceRequest.taxName,
          invoiceRequest.customerName,
          invoiceRequest.purchaseEmail,
          invoiceRequest.invoiceEmail,
        ].some((value) => value.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [invoiceRequests, search, statusFilter]);

  function updateLocalRequest(
    requestNumber: string,
    field: keyof InvoiceRequest,
    value: string
  ) {
    setInvoiceRequests((current) =>
      current.map((invoiceRequest) =>
        invoiceRequest.requestNumber === requestNumber
          ? { ...invoiceRequest, [field]: value }
          : invoiceRequest
      )
    );
  }

  async function saveInvoiceRequest(invoiceRequest: InvoiceRequest) {
    try {
      setSavingRequest(invoiceRequest.requestNumber);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/invoice-requests/${encodeURIComponent(
          invoiceRequest.requestNumber
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: invoiceRequest.status,
            adminNotes: invoiceRequest.adminNotes,
            rejectionReason: invoiceRequest.rejectionReason,
            xmlUrl: invoiceRequest.xmlUrl,
            pdfUrl: invoiceRequest.pdfUrl,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No pudimos guardar la solicitud.");
      }

      setInvoiceRequests((current) =>
        current.map((item) =>
          item.requestNumber === invoiceRequest.requestNumber
            ? { ...item, ...data.invoiceRequest }
            : item
        )
      );
      setMessage(`Solicitud ${invoiceRequest.requestNumber} actualizada.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar la solicitud."
      );
    } finally {
      setSavingRequest("");
    }
  }

  async function copyDataForSat(invoiceRequest: InvoiceRequest) {
    const satData = [
      `Pedido: ${invoiceRequest.orderNumber}`,
      `RFC: ${invoiceRequest.rfc}`,
      `Razón social: ${invoiceRequest.taxName}`,
      `CP fiscal: ${invoiceRequest.fiscalPostalCode}`,
      `Régimen fiscal: ${invoiceRequest.taxRegime}`,
      `Uso CFDI: ${invoiceRequest.cfdiUse}`,
      `Método de pago: ${getPaymentMethodLabel(
        invoiceRequest.paymentMethod
      )}`,
      `Total: ${formatMoney(invoiceRequest.orderTotal)}`,
      `Email para factura: ${invoiceRequest.invoiceEmail}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(satData);
      setCopiedRequest(invoiceRequest.requestNumber);
      setMessage(`Datos de ${invoiceRequest.requestNumber} copiados.`);
      setError("");
    } catch {
      setError(
        "No pudimos copiar los datos. Revisa el permiso del portapapeles."
      );
    }
  }

  function exportForAccountant() {
    downloadCsv(
      `solicitudes-factura-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        [
          "Folio",
          "Estado",
          "Pedido",
          "Fecha de solicitud",
          "Cliente",
          "Email de compra",
          "RFC",
          "Razón social",
          "Código postal fiscal",
          "Régimen fiscal",
          "Uso CFDI",
          "Email factura",
          "Forma de pago",
          "Total MXN",
          "Notas admin",
          "Motivo rechazo",
          "XML",
          "PDF",
        ],
        ...filteredRequests.map((invoiceRequest) => [
          invoiceRequest.requestNumber,
          getInvoiceStatusLabel(invoiceRequest.status),
          invoiceRequest.orderNumber,
          formatDate(invoiceRequest.createdAt),
          invoiceRequest.customerName,
          invoiceRequest.purchaseEmail,
          invoiceRequest.rfc,
          invoiceRequest.taxName,
          invoiceRequest.fiscalPostalCode,
          invoiceRequest.taxRegime,
          invoiceRequest.cfdiUse,
          invoiceRequest.invoiceEmail,
          getPaymentMethodLabel(invoiceRequest.paymentMethod),
          invoiceRequest.orderTotal,
          invoiceRequest.adminNotes,
          invoiceRequest.rejectionReason,
          invoiceRequest.xmlUrl,
          invoiceRequest.pdfUrl,
        ]),
      ]
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-8 text-sm text-gray-600">
        Cargando solicitudes de factura…
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-3xl border bg-[#f7f3ee] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pedido, RFC, cliente o email"
            className="w-full rounded-full border border-black/15 bg-white px-5 py-3 text-sm outline-none focus:border-[#4a2d23] lg:max-w-xl"
          />
          <button
            type="button"
            onClick={exportForAccountant}
            disabled={filteredRequests.length === 0}
            className="rounded-full border border-[#4a2d23] bg-white px-5 py-3 text-sm text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white disabled:opacity-40"
          >
            Exportar CSV para contador
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterButton
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          >
            Todas ({invoiceRequests.length})
          </FilterButton>
          {invoiceStatuses.map((status) => (
            <FilterButton
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {getInvoiceStatusLabel(status)} (
              {
                invoiceRequests.filter((request) => request.status === status)
                  .length
              }
              )
            </FilterButton>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      )}

      <p className="mt-5 text-sm text-gray-500">
        Mostrando {filteredRequests.length} de {invoiceRequests.length}{" "}
        solicitudes
      </p>

      {filteredRequests.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed p-10 text-center">
          <h2 className="text-xl font-semibold">No hay solicitudes</h2>
          <p className="mt-2 text-sm text-gray-600">
            Cambia los filtros o espera una nueva solicitud de un cliente.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {filteredRequests.map((invoiceRequest) => (
            <article
              key={invoiceRequest.requestNumber}
              className="rounded-3xl border bg-white p-6 sm:p-8"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      {invoiceRequest.requestNumber}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
                        invoiceRequest.status
                      )}`}
                    >
                      {getInvoiceStatusLabel(invoiceRequest.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Solicitud: {formatDate(invoiceRequest.createdAt)} · Pedido:{" "}
                    {invoiceRequest.orderNumber}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-gray-500">Total de la compra</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatMoney(invoiceRequest.orderTotal)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {getPaymentMethodLabel(invoiceRequest.paymentMethod)}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-6 rounded-2xl bg-[#f7f3ee] p-5 md:grid-cols-2 lg:grid-cols-4">
                <AdminDetail
                  label="Cliente"
                  value={invoiceRequest.customerName || "Sin nombre"}
                  secondary={invoiceRequest.purchaseEmail}
                />
                <AdminDetail
                  label="RFC"
                  value={invoiceRequest.rfc}
                  secondary={invoiceRequest.taxName}
                />
                <AdminDetail
                  label="Datos SAT"
                  value={`CP ${invoiceRequest.fiscalPostalCode}`}
                  secondary={`Régimen ${invoiceRequest.taxRegime} · Uso ${invoiceRequest.cfdiUse}`}
                />
                <AdminDetail
                  label="Entrega de factura"
                  value={invoiceRequest.invoiceEmail}
                  secondary={`Compra: ${formatDate(invoiceRequest.orderDate)}`}
                />
              </div>

              <div className="mt-7 grid gap-5 lg:grid-cols-2">
                <label className="text-sm font-medium">
                  Estado
                  <select
                    value={invoiceRequest.status}
                    onChange={(event) =>
                      updateLocalRequest(
                        invoiceRequest.requestNumber,
                        "status",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#4a2d23]"
                  >
                    {invoiceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {getInvoiceStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <AdminTextField
                  label="Motivo de rechazo"
                  value={invoiceRequest.rejectionReason}
                  onChange={(value) =>
                    updateLocalRequest(
                      invoiceRequest.requestNumber,
                      "rejectionReason",
                      value
                    )
                  }
                  placeholder="Obligatorio si el estado es rechazada"
                />

                <AdminTextField
                  label="Enlace XML"
                  type="url"
                  value={invoiceRequest.xmlUrl}
                  onChange={(value) =>
                    updateLocalRequest(
                      invoiceRequest.requestNumber,
                      "xmlUrl",
                      value
                    )
                  }
                  placeholder="https://..."
                />

                <AdminTextField
                  label="Enlace PDF"
                  type="url"
                  value={invoiceRequest.pdfUrl}
                  onChange={(value) =>
                    updateLocalRequest(
                      invoiceRequest.requestNumber,
                      "pdfUrl",
                      value
                    )
                  }
                  placeholder="https://..."
                />
              </div>

              <label className="mt-5 block text-sm font-medium">
                Notas internas
                <textarea
                  value={invoiceRequest.adminNotes}
                  onChange={(event) =>
                    updateLocalRequest(
                      invoiceRequest.requestNumber,
                      "adminNotes",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Notas para el equipo y el contador…"
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#4a2d23]"
                />
              </label>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void copyDataForSat(invoiceRequest)}
                  className="rounded-full border border-[#4a2d23] px-6 py-3 text-sm text-[#4a2d23] transition hover:bg-[#4a2d23] hover:text-white"
                >
                  {copiedRequest === invoiceRequest.requestNumber
                    ? "Datos copiados"
                    : "Copiar datos para SAT"}
                </button>
                <button
                  type="button"
                  disabled={savingRequest === invoiceRequest.requestNumber}
                  onClick={() => void saveInvoiceRequest(invoiceRequest)}
                  className="rounded-full bg-[#4a2d23] px-6 py-3 text-sm text-white transition hover:bg-[#321e18] disabled:opacity-60"
                >
                  {savingRequest === invoiceRequest.requestNumber
                    ? "Guardando…"
                    : "Guardar cambios"}
                </button>
                {invoiceRequest.xmlUrl && (
                  <a
                    href={invoiceRequest.xmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-5 py-3 text-sm transition hover:bg-black hover:text-white"
                  >
                    Abrir XML
                  </a>
                )}
                {invoiceRequest.pdfUrl && (
                  <a
                    href={invoiceRequest.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border px-5 py-3 text-sm transition hover:bg-black hover:text-white"
                  >
                    Abrir PDF
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-[#4a2d23] px-4 py-2 text-sm transition ${
        active
          ? "bg-[#4a2d23] text-white"
          : "bg-white text-[#4a2d23] hover:bg-[#4a2d23] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function AdminDetail({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 font-semibold">{value}</p>
      <p className="mt-1 break-words text-sm text-gray-600">{secondary}</p>
    </div>
  );
}

function AdminTextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#4a2d23]"
      />
    </label>
  );
}
