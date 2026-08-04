import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [
  "app/api/fulfillment/requests/[requestId]/reservation/route.ts",
  "app/api/fulfillment/requests/[requestId]/reservation/release/route.ts",
]) {
  const source = read(file);
  assert(source.includes("fulfillmentRequest"), `${file} bypasses the server adapter`);
  assert(source.includes("getCommerceOwner"), `${file} does not bind the owner identity`);
  assert(source.includes('import { randomUUID }'), `${file} lacks idempotency key generation`);
}

const flow = read("components/ShippingRequestFlow.tsx");
assert(flow.includes("create_reservation"), "Reservation creation diagnostics are missing");
assert(flow.includes("Reservar inventario por 20 minutos"), "Reservation action is missing");
assert(flow.includes("Liberar reserva"), "Reservation release action is missing");
assert(flow.includes('reservation?.status === "active"'), "Active reservation state is not rendered");
assert(flow.includes("No sale or shipment has been created."), "B2 boundary is incomplete");
assert(flow.includes("Libera la reserva activa"), "Quote changes are not protected during an active reservation");

const types = read("lib/fulfillment/types.ts");
assert(types.includes("stockReserved: true"), "Reservation payload type is missing stock boundary");
for (const field of ["orderCreated: false", "paymentCreated: false", "saleCreated: false", "shipmentCreated: false"]) {
  assert(types.includes(field), `Reservation type is missing ${field}`);
}

const env = read(".env.example");
assert(env.includes("PHASE_1FB2_ENABLED=false"), "B2 flag is not disabled by default");
assert(!/NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET)/.test(env), "A server secret is browser-visible");

console.log("Phase 1F-B2 OLM isolation verification: PASS");
