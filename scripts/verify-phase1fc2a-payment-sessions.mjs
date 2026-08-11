import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const opticaRoot = process.env.OPTICAOLM_REPO_DIR
  ? path.resolve(process.env.OPTICAOLM_REPO_DIR)
  : path.resolve(repoRoot, "..", "opticaolm");
const read = (file) => readFileSync(path.join(repoRoot, file), "utf8");
const backend = readFileSync(path.join(opticaRoot, "backend", "online_fulfillment.py"), "utf8");
const route = read("app/api/fulfillment/requests/[requestId]/payment-session/route.ts");
const page = read("app/order-pending/[orderId]/page.tsx");
const types = read("lib/fulfillment/types.ts");

for (const token of ["PHASE_1FC2A_ENABLED", "fulfillment_payment_session_create", "paymentSessionsEnabled", "conekta", "payment_session_created"]) {
  if (!backend.toLowerCase().includes(token.toLowerCase())) throw new Error(`Missing backend C2-A token: ${token}`);
}
for (const token of ["payment-session", "fulfillmentRequest", "idempotencyKey"]) {
  if (!route.includes(token)) throw new Error(`Missing BFF C2-A token: ${token}`);
}
for (const token of ["Pago en línea próximamente", "Proveedor planeado: Conekta", "No se han enviado datos de pago", "No se ha realizado ningún cobro"]) {
  if (!page.includes(token)) throw new Error(`Missing pending-page boundary: ${token}`);
}
for (const token of ["PaymentSession", "checkout_created", "orderMarkedPaid: false"]) {
  if (!types.includes(token)) throw new Error(`Missing payment type boundary: ${token}`);
}
for (const forbidden of ["stripe.create", "conekta-sdk", "cardNumber", "venta_pagos"]) {
  if (backend.includes(forbidden) || route.includes(forbidden) || page.includes(forbidden)) throw new Error(`Forbidden C2-A integration token: ${forbidden}`);
}
console.log("Phase 1F-C2-A OLM-GLASSES isolation verification: PASS");
