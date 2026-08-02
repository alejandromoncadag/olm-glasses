import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const routeFiles = [
  "app/api/commerce/cart/route.ts",
  "app/api/commerce/cart/items/[itemId]/route.ts",
  "app/api/commerce/cart/items/[itemId]/acknowledge-price/route.ts",
  "app/api/commerce/favorites/route.ts",
  "app/api/commerce/favorites/[productId]/route.ts",
  "app/api/commerce/merge/route.ts",
];
for (const file of routeFiles) assert(read(file).includes("commerceRequest"), `${file} is not using the server adapter`);

const envExample = read(".env.example");
assert(envExample.includes("ONLINE_COMMERCE_MODE=legacy"), "Conservative commerce flag is missing");
assert(!/NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET)/.test(envExample), "A commerce secret is browser-visible");

const identity = read("lib/commerce/identity.ts");
assert(identity.includes('httpOnly: true'), "Guest cookie is not HttpOnly");
assert(identity.includes('sameSite: "lax"'), "Guest cookie does not use SameSite=Lax");
assert(identity.includes('createHmac("sha256"'), "Guest/customer identity is not keyed-hashed");

const client = read("lib/commerce/serverClient.ts");
assert(client.includes("OPTICAOLM_COMMERCE_BEARER_TOKEN"), "Server bearer token is not configured");
assert(client.includes('import "server-only"'), "Commerce client is not server-only");

const quickAdd = read("components/QuickAddToCartButton.tsx");
assert(quickAdd.includes('product.source === "opticaolm"'), "Authoritative quick-add is not isolated");
assert(quickAdd.includes('fetch("/api/commerce/cart"'), "Authoritative quick-add bypasses the BFF");

const cartPage = read("app/cart/page.tsx");
const cartUi = read("components/CommerceCartItems.tsx");
assert(cartPage.includes("CommerceCartItems"), "Cart page does not select the authoritative UI");
assert(cartUi.includes("Checkout disponible en una fase posterior"), "Phase 1F-B checkout boundary is missing");
assert(!cartUi.includes('href="/checkout"'), "Authoritative cart can reach legacy checkout");

const favorites = read("hooks/useLikes.tsx");
assert(favorites.includes("/api/commerce/favorites"), "Authoritative favorites bypass the BFF");
assert(favorites.includes('mode === "optica"'), "Favorites sources are not isolated");

for (const file of [
  "components/CheckoutSummary.tsx",
  "components/CheckoutForm.tsx",
  "app/api/orders/route.ts",
]) {
  assert(!read(file).includes("/api/commerce/"), `${file} was coupled to Phase 1F-A commerce`);
}

console.log("Phase 1F-A OLM isolation verification: PASS");
