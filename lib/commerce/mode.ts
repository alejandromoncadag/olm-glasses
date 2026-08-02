import "server-only";

import type { CommerceMode } from "@/lib/commerce/types";

export function getCommerceMode(): CommerceMode {
  const value = (process.env.ONLINE_COMMERCE_MODE || "legacy")
    .trim()
    .toLowerCase();
  if (value !== "legacy" && value !== "shadow" && value !== "optica") {
    throw new Error("ONLINE_COMMERCE_MODE is invalid");
  }
  return value;
}
