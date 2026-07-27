export const CART_STORAGE_KEY = "olm-cart";
export const CART_UPDATED_EVENT = "olm-cart-updated";

type CartStorageOwner =
  | {
      id: string;
      role: "customer" | "admin";
    }
  | null;

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

let activeCartStorageKey = CART_STORAGE_KEY;

function storageKeyForOwner(owner: CartStorageOwner) {
  if (!owner) return CART_STORAGE_KEY;

  return `olm-cart:${owner.role}:${encodeURIComponent(owner.id)}`;
}

function readCartFromKey(storageKey: string): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(storageKey);
    const parsed = value ? (JSON.parse(value) as unknown) : [];

    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function mergeCartItems(current: CartItem[], incoming: CartItem[]) {
  const merged = [...current];

  for (const item of incoming) {
    const existingIndex = merged.findIndex(
      (existing) => existing.slug === item.slug
    );

    if (existingIndex === -1) {
      merged.push(item);
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      quantity: merged[existingIndex].quantity + item.quantity,
    };
  }

  return merged;
}

export function getCartStorageKey() {
  return activeCartStorageKey;
}

export function setCartStorageOwner(owner: CartStorageOwner) {
  if (typeof window === "undefined") return;

  const nextStorageKey = storageKeyForOwner(owner);

  if (owner?.role === "customer" && nextStorageKey !== CART_STORAGE_KEY) {
    const guestCart = readCartFromKey(CART_STORAGE_KEY);

    if (guestCart.length > 0) {
      const customerCart = readCartFromKey(nextStorageKey);
      window.localStorage.setItem(
        nextStorageKey,
        JSON.stringify(mergeCartItems(customerCart, guestCart))
      );
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  activeCartStorageKey = nextStorageKey;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function readCart(): CartItem[] {
  return readCartFromKey(activeCartStorageKey);
}

export function getCartCount() {
  return readCart().reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(activeCartStorageKey, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: {
        count: items.reduce((total, item) => total + item.quantity, 0),
      },
    })
  );
}

export function clearCart() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(activeCartStorageKey);
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
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
