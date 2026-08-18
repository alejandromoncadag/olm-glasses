export const DIRECTLY_PURCHASABLE_CATEGORIES = Object.freeze([
  "lentes_de_sol",
  "lentes_de_contacto",
  "accesorios_y_refacciones",
  "soluciones_y_cuidado",
]);

/**
 * Only prescription eyeglasses outside the direct-purchase catalog use the
 * optical lens configurator.
 *
 * @param {{ category: string; type: string }} product
 */
export function requiresOpticalConfiguration(product) {
  return (
    (product.type === "eyeglasses" &&
      product.category === "lentes_opticos" &&
      (product.subcategory === "armazon" || product.subcategory === "clip_on")) ||
    (product.type === "sunglasses" &&
      product.category === "lentes_de_sol" &&
      product.subcategory === "armazon")
  );
}

/** A physical optical frame can be sold alone or sent to the lens configurator. */
export function supportsDirectFramePurchase(product) {
  return (
    product.type === "eyeglasses" &&
    product.category === "lentes_opticos" &&
    (product.subcategory === "armazon" || product.subcategory === "clip_on")
  );
}
