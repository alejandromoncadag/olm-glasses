import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [
  "app/api/fulfillment/requests/[requestId]/order/route.ts",
]) {
  const source = read(file);
  assert(source.includes("fulfillmentRequest"), `${file} bypasses the server fulfillment adapter`);
  assert(source.includes("getCommerceOwner"), `${file} does not bind the secure owner identity`);
  assert(source.includes("randomUUID"), `${file} lacks idempotency key generation`);
  assert(!source.includes("Conekta"), `${file} contains a payment provider`);
}

const flow = read("components/ShippingRequestFlow.tsx");
assert(flow.includes("Continuar a pago"), "C1 order action is missing");
assert(flow.includes("/order-pending/"), "C1 does not navigate to the pending order page");
assert(!flow.includes("Conekta"), "C1 UI contains a payment provider");

const pending = read("app/order-pending/[orderId]/page.tsx");
assert(pending.includes("pending_payment"), "Pending payment status is not shown");
assert(pending.includes("No se ha realizado ningún cobro"), "No-charge boundary is missing");
assert(pending.includes("El inventario no se ha descontado permanentemente"), "Inventory boundary is missing");

const types = read("lib/fulfillment/types.ts");
for (const field of ["paymentCreated: false", "saleCreated: false", "shipmentCreated: false", "inventoryDeducted: false"]) {
  assert(types.includes(field), `C1 order type is missing ${field}`);
}

const env = read(".env.example");
assert(env.includes("PHASE_1FC1_ENABLED=false"), "C1 flag is not disabled by default");
assert(!/NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET)/.test(env), "A server secret is browser-visible");

console.log("Phase 1F-C1 OLM isolation verification: PASS");
