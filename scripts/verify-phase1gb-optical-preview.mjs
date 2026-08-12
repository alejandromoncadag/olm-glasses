import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const serverClient = read("lib/optical/serverClient.ts");
assert(serverClient.includes('import "server-only"'), "Optical client is not server-only");
assert(serverClient.includes("OPTICAOLM_CATALOG_BEARER_TOKEN"), "Optical client does not use the server catalog token");
assert(!serverClient.includes("NEXT_PUBLIC_"), "Optical server client exposes a browser environment variable");
assert(serverClient.includes("Authorization: `Bearer ${token}`"), "Server-to-server bearer authentication is missing");

for (const file of [
  "app/api/optical/options/route.ts",
  "app/api/optical/preview/route.ts",
]) {
  const source = read(file);
  assert(source.includes("opticalPreviewRequest"), `${file} bypasses the optical server adapter`);
  assert(!source.includes("process.env"), `${file} reads secrets directly`);
}

const configurePage = read("app/product/[slug]/configurar/page.tsx");
assert(configurePage.includes("/api/catalog/products/"), "Configurator does not load the authoritative frame");
assert(configurePage.includes('nextProduct.source !== "opticaolm"'), "Legacy products can enter the authoritative configurator");
assert(configurePage.includes("productId: product.productId"), "Configurator does not pass the authoritative product ID");

const wrapper = read("components/ProductPurchasePanel.tsx");
assert(wrapper.includes("AuthoritativeOpticalPreviewPanel"), "Purchase panel does not use the read-only preview UI");
const panel = read("components/AuthoritativeOpticalPreviewPanel.tsx");
assert(panel.includes("/api/optical/options"), "Configurator options bypass the Next.js route");
assert(panel.includes("/api/optical/preview"), "Configurator preview bypasses the Next.js route");
assert(panel.includes("preview.previewFingerprint"), "Authoritative preview fingerprint is not preserved for the next phase");
assert(panel.includes("/api/optical/drafts"), "Approved Phase 1G-C handoff is missing after preview");
assert(!panel.includes("readCart"), "Configured preview reads the legacy cart");
assert(!panel.includes("writeCart"), "Configured preview writes the legacy cart");
assert(!panel.includes("/api/commerce/cart"), "Configured preview writes the authoritative cart");
assert(!panel.includes("NEXT_PUBLIC_"), "Configured preview references a browser-visible secret");
assert(!panel.includes("costo"), "Configured preview exposes internal cost language");

const productDetail = read("app/product/[slug]/page.tsx");
assert(productDetail.includes('label="Agregar al carrito"'), "Phase 1G-A direct frame cart action changed");
assert(productDetail.includes("Configurar micas"), "Separate optical configurator action changed");
assert(productDetail.includes("Armazón sin micas ni graduación. Color y modelo según las imágenes y descripción."), "Direct frame-only copy changed");

for (const protectedArea of [
  "components/CartItems.tsx",
  "components/CheckoutSummary.tsx",
  "app/api/orders/route.ts",
]) {
  assert(!read(protectedArea).includes("/api/optical/"), `${protectedArea} was coupled to Phase 1G-B`);
}

console.log("Phase 1G-B OLM optical preview verification: PASS");
