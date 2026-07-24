export const invoiceStatuses = [
  "pending",
  "issued",
  "rejected",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const taxRegimes = [
  { value: "601", label: "601 · General de Ley Personas Morales" },
  {
    value: "603",
    label: "603 · Personas Morales con Fines no Lucrativos",
  },
  { value: "605", label: "605 · Sueldos y Salarios" },
  { value: "606", label: "606 · Arrendamiento" },
  { value: "608", label: "608 · Demás ingresos" },
  {
    value: "612",
    label: "612 · Personas Físicas con Actividades Empresariales",
  },
  { value: "616", label: "616 · Sin obligaciones fiscales" },
  { value: "621", label: "621 · Incorporación Fiscal" },
  {
    value: "625",
    label: "625 · Actividades Empresariales mediante Plataformas",
  },
  { value: "626", label: "626 · Régimen Simplificado de Confianza" },
] as const;

export const cfdiUses = [
  { value: "G01", label: "G01 · Adquisición de mercancías" },
  { value: "G02", label: "G02 · Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 · Gastos en general" },
  {
    value: "D01",
    label: "D01 · Honorarios médicos, dentales y gastos hospitalarios",
  },
  { value: "D02", label: "D02 · Gastos médicos por incapacidad o discapacidad" },
  { value: "S01", label: "S01 · Sin efectos fiscales" },
] as const;

export type FiscalDataInput = {
  rfc?: unknown;
  taxName?: unknown;
  fiscalPostalCode?: unknown;
  taxRegime?: unknown;
  cfdiUse?: unknown;
  invoiceEmail?: unknown;
};

export function cleanText(value: unknown) {
  return String(value || "").trim();
}

export function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeRfc(value: unknown) {
  return cleanText(value).toUpperCase().replace(/[\s-]/g, "");
}

export function isValidRfc(value: string) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(value);
}

export function validateFiscalData(input: FiscalDataInput) {
  const fiscalData = {
    rfc: normalizeRfc(input.rfc),
    taxName: cleanText(input.taxName),
    fiscalPostalCode: cleanText(input.fiscalPostalCode),
    taxRegime: cleanText(input.taxRegime),
    cfdiUse: cleanText(input.cfdiUse),
    invoiceEmail: normalizeEmail(input.invoiceEmail),
  };

  if (!isValidRfc(fiscalData.rfc)) {
    return { error: "Ingresa un RFC válido.", fiscalData };
  }

  if (fiscalData.taxName.length < 2 || fiscalData.taxName.length > 200) {
    return {
      error: "Ingresa el nombre o razón social fiscal.",
      fiscalData,
    };
  }

  if (!/^\d{5}$/.test(fiscalData.fiscalPostalCode)) {
    return { error: "El código postal fiscal debe tener 5 dígitos.", fiscalData };
  }

  if (!taxRegimes.some((regime) => regime.value === fiscalData.taxRegime)) {
    return { error: "Selecciona un régimen fiscal válido.", fiscalData };
  }

  if (!cfdiUses.some((use) => use.value === fiscalData.cfdiUse)) {
    return { error: "Selecciona un uso CFDI válido.", fiscalData };
  }

  if (!isValidEmail(fiscalData.invoiceEmail)) {
    return { error: "Ingresa un email válido para la factura.", fiscalData };
  }

  return { error: null, fiscalData };
}

export function getInvoiceStatusLabel(status: InvoiceStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "issued") return "Emitida";
  if (status === "rejected") return "Rechazada";
  return "Cancelada";
}

export function getPaymentMethodLabel(method: string) {
  if (method === "stripe") return "Tarjeta";
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "store_payment") return "Pago en tienda";
  if (method === "cash_on_delivery") return "Pago contra entrega";
  return method || "No especificado";
}
