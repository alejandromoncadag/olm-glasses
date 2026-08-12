import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const checks = [];
function requireCheck(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const panel = read("components/AuthoritativeOpticalPreviewPanel.tsx");
const client = read("lib/optical/serverClient.ts");
const summary = read("app/optical-order/[draftId]/page.tsx");
const createRoute = read("app/api/optical/drafts/route.ts");

requireCheck(panel.includes("Continuar con este pedido"), "real optical draft action is shown");
requireCheck(panel.includes('"later" | "exam"'), "only later and exam prescription methods are exposed");
requireCheck(panel.includes("availableBranches.length === 1"), "single-branch auto-selection is explicit");
requireCheck(panel.includes("Elige una sucursal"), "multiple branches require customer selection");
requireCheck(!panel.includes("writeCart("), "configured pair does not use the simple cart");
requireCheck(client.includes('"X-OLM-Owner-Type"') && client.includes('"Idempotency-Key"'), "server adapter sends owner and idempotency headers");
requireCheck(client.includes("OPTICAOLM_CATALOG_BEARER_TOKEN"), "server-only catalog credential is reused");
requireCheck(!client.includes("NEXT_PUBLIC"), "bearer credential is never public");
requireCheck(createRoute.includes("getCommerceOwner"), "Next route resolves the authoritative owner server-side");
requireCheck(summary.includes("Total configurado") && summary.includes("expiresAt"), "separate summary shows total and expiration");
requireCheck(summary.includes("Todavía no se creó una venta"), "summary clearly remains payment/sale neutral");

console.log("PHASE 1G-C OLM OPTICAL DRAFT VERIFIER: PASS");
for (const check of checks) console.log(`  [OK] ${check}`);
