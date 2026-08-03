import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const routes = [
  "app/api/fulfillment/requests/route.ts",
  "app/api/fulfillment/requests/[requestId]/route.ts",
  "app/api/fulfillment/requests/[requestId]/select/route.ts",
  "app/api/fulfillment/requests/[requestId]/preview/route.ts",
  "app/api/fulfillment/pickup-branches/route.ts",
];
for (const file of routes) {
  const source = read(file);
  assert(source.includes("fulfillmentRequest"), `${file} bypasses the server fulfillment adapter`);
  assert(source.includes("getCommerceOwner"), `${file} does not bind the secure owner identity`);
  assert(!source.includes("OPTICAOLM_COMMERCE_BEARER_TOKEN"), `${file} handles the bearer token directly`);
}

const client = read("lib/fulfillment/serverClient.ts");
assert(client.includes('import "server-only"'), "Fulfillment client is not server-only");
assert(client.includes("OPTICAOLM_COMMERCE_BEARER_TOKEN"), "Server fulfillment bearer token is missing");
assert(!client.includes("NEXT_PUBLIC_"), "A fulfillment secret or endpoint is browser-visible");

const identity = read("lib/commerce/identity.ts");
assert(identity.includes("httpOnly: true"), "Guest fulfillment ownership does not use the HttpOnly identity");
assert(identity.includes('createHmac("sha256"'), "Owner identity is not keyed-hashed");

const cart = read("components/CommerceCartItems.tsx");
const flow = read("components/ShippingRequestFlow.tsx");
const statusList = read("components/FulfillmentStatusList.tsx");
const previewRoute = read("app/api/fulfillment/requests/[requestId]/preview/route.ts");
assert(cart.includes("ShippingRequestFlow"), "Authoritative cart does not expose Phase 1F-B1");
assert(!cart.includes('href="/checkout"'), "Phase 1F-B1 reaches legacy checkout");
assert(flow.includes('method: "POST", cache: "no-store"'), "Selection flow never requests the authoritative preview");
assert(flow.includes("Checkout preview only"), "Checkout preview boundary is missing");
assert(flow.includes("Inventory is not reserved."), "Preview does not state the reservation boundary");
assert(flow.includes("No order or payment has been created."), "Preview does not state the order/payment boundary");
assert(flow.includes("preview.subtotal"), "Preview subtotal is not rendered");
assert(flow.includes("preview.shipping"), "Preview shipping amount is not rendered");
assert(flow.includes("preview.total"), "Preview total is not rendered");
assert(flow.includes("selectedOptionId === option.optionId"), "Selected quote is not visually identified");
assert(flow.includes('"Seleccionada"'), "Selected quote action is not disabled and labeled");
assert(flow.includes("fetchPreview(request.requestId)"), "Selected request does not restore its preview after refresh");
assert(!statusList.includes("window.location.reload()"), "Selection still discards state through a page reload");
assert(previewRoute.includes("export async function POST"), "Preview BFF does not accept the authoritative POST workflow");
assert(flow.includes('country: "México"'), "Initial Mexico-only territory is not authoritative in the customer form");

for (const legacy of ["app/api/checkout/stripe/route.ts", "app/api/orders/route.ts", "app/api/stripe/webhook/route.ts"]) {
  const source = read(legacy);
  assert(!source.includes("/api/fulfillment"), `${legacy} was coupled to Phase 1F-B1`);
  assert(!source.includes("storefront/fulfillment"), `${legacy} calls Phase 1F-B1 directly`);
}

const env = read(".env.example");
assert(env.includes("PHASE_1FB1_ENABLED=false"), "Conservative Phase 1F-B1 flag default is missing");
assert(!/NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET)/.test(env), "A server secret is browser-visible");

console.log("Phase 1F-B1 OLM isolation verification: PASS");
