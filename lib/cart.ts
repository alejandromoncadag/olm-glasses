export const CART_STORAGE_KEY = "olm-cart";
export const CART_UPDATED_EVENT = "olm-cart-updated";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lensOption: string;
  prescriptionMethod: string;
};

export type SimpleCartProduct = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  type: "accessory" | "contact_lenses";
};

export function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = value ? (JSON.parse(value) as unknown) : [];

    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function getCartCount() {
  return readCart().reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: {
        count: items.reduce((total, item) => total + item.quantity, 0),
      },
    })
  );
}

export function addSimpleProductToCart(product: SimpleCartProduct) {
  const currentCart = readCart();
  const existingItem = currentCart.find((item) => item.slug === product.slug);
  const currentQuantity = existingItem?.quantity ?? 0;

  if (currentQuantity >= product.stock) {
    return false;
  }

  const lensOption =
    product.type === "contact_lenses"
      ? "Lentes de contacto"
      : "Accesorio";
  const prescriptionMethod =
    product.type === "contact_lenses"
      ? "Graduación por confirmar"
      : "No aplica";

  const updatedCart = existingItem
    ? currentCart.map((item) =>
        item.slug === product.slug
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    : [
        ...currentCart,
        {
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: 1,
          lensOption,
          prescriptionMethod,
        },
      ];

  writeCart(updatedCart);
  return true;
}
