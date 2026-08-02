import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
const { Pool } = require("pg");
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);

const upstreamPort = 4011;
const nextPort = 3011;
const upstreamBase = `http://127.0.0.1:${upstreamPort}`;
const nextBase = `http://127.0.0.1:${nextPort}`;
const verificationToken = randomBytes(32).toString("hex");
let upstreamMode = "success";
let sellingPrice = "1499.00";
let upstreamRequests = 0;

function product({ id, slug, stock, productType = "producto_fisico" }) {
  return {
    productId: String(id),
    sku: `VERIFY-${id}`,
    slug,
    name: `Producto verificación ${id}`,
    description: "Producto transaccional de verificación Phase 1E.",
    category: productType === "componente_mica" ? "micas" : "lentes_opticos",
    subcategory: productType === "componente_mica" ? "diseno" : "armazon",
    productType,
    sellingPrice: { amount: sellingPrice, currency: "MXN" },
    images: [
      {
        imageId: String(id),
        url: `${upstreamBase}/media/products/verified.webp`,
        altText: "Imagen verificada",
        displayOrder: 0,
        isPrimary: true,
        mimeType: "image/webp",
        width: 1200,
        height: 900,
      },
    ],
    availability: {
      mode: "branch_stock",
      controlsStock: true,
      availableOnline: stock > 0,
      totalOnlineAvailability: stock,
      branches: [
        {
          branchId: "1",
          branchCode: "EDOMEX",
          branchName: "EdoMex",
          availableQuantity: stock,
        },
        {
          branchId: "2",
          branchCode: "PLAYA",
          branchName: "Playa",
          availableQuantity: 0,
        },
      ],
    },
    publishedOnline: true,
    purchasableOnline: false,
    favoritable: true,
    maximumQuantityPerLine: null,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };
}

const upstream = createServer((request, response) => {
  upstreamRequests += 1;
  if (request.headers.authorization !== `Bearer ${verificationToken}`) {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ detail: "Unauthorized" }));
    return;
  }
  if (upstreamMode === "timeout") return;
  if (upstreamMode === "500") {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ detail: "Unavailable" }));
    return;
  }
  if (upstreamMode === "401") {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ detail: "Unauthorized" }));
    return;
  }
  if (upstreamMode === "invalid") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ schemaVersion: "invalid", products: [] }));
    return;
  }

  const url = new URL(request.url || "/", upstreamBase);
  const published = [
    product({ id: 1, slug: "phase1e-publicado", stock: 3 }),
    product({ id: 2, slug: "phase1e-agotado", stock: 0 }),
    product({ id: 3, slug: "phase1e-componente", stock: 0, productType: "componente_mica" }),
  ];
  if (url.pathname === "/public/catalog/v1/products") {
    const items = upstreamMode === "empty" ? [] : published;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        schemaVersion: "1.0",
        generatedAt: new Date().toISOString(),
        products: items,
        total: items.length,
        limit: 200,
        offset: 0,
      })
    );
    return;
  }
  const detailMatch = url.pathname.match(/^\/public\/catalog\/v1\/products\/(.+)$/);
  if (detailMatch) {
    const item = published.find((entry) => entry.slug === decodeURIComponent(detailMatch[1]));
    if (!item || item.slug === "phase1e-no-publicado") {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ detail: "Product not found" }));
      return;
    }
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        schemaVersion: "1.0",
        generatedAt: new Date().toISOString(),
        product: item,
      })
    );
    return;
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ schemaVersion: "1.0", products: [], branches: [], categories: [] }));
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function requestJson(pathname) {
  const response = await fetch(`${nextBase}${pathname}`, { cache: "no-store" });
  const body = await response.json();
  return { response, body };
}

async function waitForNext() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${nextBase}/api/catalog/products`);
      if (response.status) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Next.js verification server did not start");
}

function startNext(mode, fallback) {
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `npm.cmd run start -- --port ${nextPort}`]
      : ["run", "start", "--", "--port", String(nextPort)];
  return spawn(command, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      CATALOG_MODE: mode,
      ONLINE_COMMERCE_MODE: "legacy",
      CATALOG_LEGACY_FALLBACK_ENABLED: String(fallback),
      CATALOG_REQUEST_TIMEOUT_MS: "350",
      OPTICAOLM_CATALOG_API_URL: upstreamBase,
      OPTICAOLM_CATALOG_BEARER_TOKEN: verificationToken,
      OPTICAOLM_CATALOG_IMAGE_ORIGINS: upstreamBase,
    },
    stdio: "ignore",
  });
}

function stopNext(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
  } else {
    child.kill("SIGTERM");
  }
}

async function trackedCounts() {
  if (!process.env.DATABASE_URL) return null;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const tables = ["orders", "customer_carts", "customer_favorites"];
    const counts = {};
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      counts[table] = Number(result.rows[0].count);
    }
    return counts;
  } finally {
    await pool.end();
  }
}

async function run() {
  await new Promise((resolve) => upstream.listen(upstreamPort, "127.0.0.1", resolve));
  const before = await trackedCounts();
  let child;
  try {
    child = startNext("optica", true);
    await waitForNext();

    upstreamMode = "success";
    let result = await requestJson("/api/catalog/products");
    assert(result.response.status === 200, "OPTICA mode did not return 200");
    assert(result.body.source === "opticaolm", "OPTICA source was not selected");
    assert(result.body.products.length === 2, "Optical component was rendered as a normal product");
    assert(result.body.products.every((item) => item.purchasableOnline === false), "Authoritative product became purchasable");
    assert(result.body.products.every((item) => item.favoritable === false), "Authoritative product became favoritable");
    assert(result.body.products[0].availability.branches[0].availableQuantity === 3, "Branch stock was not preserved");
    assert(result.body.products[0].availability.branches[1].availableQuantity === 0, "Branch stock was merged");
    assert(result.body.products[1].isAvailable === false, "Zero-stock product was marked available");
    assert(!JSON.stringify(result.body).includes(verificationToken), "Bearer token reached the browser response");

    sellingPrice = "1777.00";
    result = await requestJson("/api/catalog/products");
    assert(result.body.products[0].price === 1777, "Authoritative price did not refresh");

    result = await requestJson("/api/catalog/products/phase1e-no-publicado");
    assert(result.response.status === 404, "Missing/unpublished product did not stay 404");
    result = await requestJson("/api/catalog/products/phase1e-componente");
    assert(result.response.status === 404, "Optical component reached the normal detail page");

    upstreamMode = "empty";
    result = await requestJson("/api/catalog/products");
    assert(result.response.status === 200 && result.body.source === "opticaolm" && result.body.products.length === 0, "Valid empty catalog incorrectly fell back");

    upstreamMode = "401";
    result = await requestJson("/api/catalog/products");
    assert(result.response.status === 503, "401 incorrectly fell back to legacy");
    upstreamMode = "invalid";
    result = await requestJson("/api/catalog/products");
    assert(result.response.status === 503, "Invalid schema incorrectly fell back to legacy");

    upstreamMode = "500";
    result = await requestJson("/api/catalog/products");
    assert(result.response.status === 200 && result.body.source === "legacy", "500 did not use the approved fallback");
    upstreamMode = "timeout";
    result = await requestJson("/api/catalog/products");
    assert(result.response.status === 200 && result.body.source === "legacy", "Timeout did not use the approved fallback");
    stopNext(child);
    child = undefined;

    upstreamMode = "success";
    const beforeShadowRequests = upstreamRequests;
    child = startNext("shadow", true);
    await waitForNext();
    result = await requestJson("/api/catalog/products");
    assert(result.body.source === "legacy", "Shadow mode changed the visible source");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert(upstreamRequests > beforeShadowRequests, "Shadow mode did not check OPTICAOLM");
    stopNext(child);
    child = undefined;

    const beforeLegacyRequests = upstreamRequests;
    child = startNext("legacy", true);
    await waitForNext();
    result = await requestJson("/api/catalog/products");
    assert(result.body.source === "legacy", "Legacy mode stopped working");
    assert(upstreamRequests === beforeLegacyRequests, "Legacy mode contacted OPTICAOLM");

    const after = await trackedCounts();
    if (before && after) {
      assert(JSON.stringify(before) === JSON.stringify(after), "Catalog reads changed OLM carts, favorites, or orders");
    }
    console.log("Phase 1E adapter verification: PASS");
  } finally {
    stopNext(child);
    await new Promise((resolve) => upstream.close(resolve));
  }
}

run().catch((error) => {
  console.error(`Phase 1E adapter verification: FAIL - ${error.message}`);
  process.exitCode = 1;
});
