export type CommerceMode = "legacy" | "shadow" | "optica";

export type AuthoritativeCartIssue =
  | "inactive"
  | "unpublished"
  | "purchase_disabled"
  | "unavailable"
  | "quantity_exceeds_total_availability"
  | "price_changed"
  | "requires_review";

export type AuthoritativeCartItem = {
  itemId: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  configuration: Record<string, unknown>;
  status: "valid" | AuthoritativeCartIssue;
  issues: AuthoritativeCartIssue[];
  requiresReview: boolean;
  previouslyObservedPrice: string;
  currentPrice: string;
  priceChanged: boolean;
  priceAcknowledged: boolean;
  lineTotal: string;
  currency: string;
  totalOnlineAvailability: number;
  maximumQuantityPerLine: number | null;
  availabilityIsInformational: true;
  image: { url: string; altText: string } | null;
  updatedAt: string;
};

export type AuthoritativeCart = {
  schemaVersion: "1.0";
  ownerType: "guest" | "customer";
  cartId: string | null;
  state: string;
  version: number;
  items: AuthoritativeCartItem[];
  itemCount: number;
  subtotal: string;
  currency: string;
  readyForFutureCheckout: boolean;
  availabilityNotice?: string;
};

export type AuthoritativeFavorite = {
  favoriteId: string;
  productId: string;
  sku: string;
  slug: string;
  name: string;
  likedAt: string;
  available: boolean;
  unavailableReason: string | null;
  description: string | null;
  category: string | null;
  price: string | null;
  currency: string | null;
  image: { url: string; altText: string } | null;
};

export type AuthoritativeFavorites = {
  schemaVersion: "1.0";
  ownerType: "guest" | "customer";
  favorites: AuthoritativeFavorite[];
  count: number;
};

export type CommerceCartRouteResponse =
  | { mode: "legacy" | "shadow"; source: "legacy" }
  | { mode: "optica"; source: "opticaolm"; cart: AuthoritativeCart };

export type CommerceFavoritesRouteResponse =
  | { mode: "legacy" | "shadow"; source: "legacy" }
  | {
      mode: "optica";
      source: "opticaolm";
      favorites: AuthoritativeFavorites;
    };
