export type FulfillmentOption = {
  optionId: string;
  branchId: string;
  branchName: string;
  carrierCode: string;
  carrierName: string;
  serviceLevel: string;
  amount: string;
  currency: string;
  identityStatus?: "pendiente" | "resuelto" | "requiere_revision";
  minimumDeliveryDays: number;
  maximumDeliveryDays: number;
  quoteIdentifier: string;
  calculatedAt: string;
  expiresAt: string;
};

export type FulfillmentRequest = {
  schemaVersion: "1.0";
  requestId: string;
  method: "shipping" | "pickup";
  status: "pending" | "quoted" | "selected" | "expired" | "unavailable" | "cancelled";
  contact: { fullName: string; email: string; phone: string };
  address: Record<string, string | null> | null;
  packages: Array<Record<string, unknown>>;
  options: FulfillmentOption[];
  selectedOptionId: string | null;
  ranking: {
    cheapestOptionId: string;
    fastestOptionId: string;
    recommendedOptionId: string;
  } | null;
  reservation: Reservation | null;
  expiresAt: string;
  createdAt: string;
};

export type Reservation = {
  schemaVersion: "1.0";
  reservationId: string;
  requestId: string;
  selectedOptionId: string;
  branchId: string;
  branchName: string;
  status: "active" | "released" | "expired" | "cancelled";
  createdAt: string;
  expiresAt: string;
  releasedAt: string | null;
  lifetimeMinutes: number;
  lines: Array<{
    lineId: string;
    productId: string;
    branchId: string;
    cartItemId: string | null;
    configurationHash: string;
    sku: string;
    name: string;
    quantity: number;
  }>;
  stockReserved: true;
  orderCreated: false;
  paymentCreated: false;
  saleCreated: false;
  shipmentCreated: false;
};

export type OnlineOrder = {
  schemaVersion: "1.0";
  orderId: string;
  requestId: string;
  reservationId: string;
  status: "pending_payment";
  fulfillmentMethod: "shipping" | "pickup";
  branchId: string;
  branch: Record<string, unknown>;
  contact: Record<string, unknown>;
  address: Record<string, unknown> | null;
  shippingQuote: Record<string, unknown> | null;
  lines: Array<{
    lineId: string;
    productId: string;
    branchId: string;
    cartItemId: string | null;
    configurationHash: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  shipping: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  paymentCreated: false;
  saleCreated: false;
  shipmentCreated: false;
  inventoryDeducted: false;
};

export type PaymentSession = {
  schemaVersion: "1.0";
  paymentSessionId: string;
  orderId: string;
  requestId: string;
  provider: "conekta" | string;
  status: "pending" | "checkout_created" | "failed" | "canceled" | "expired" | "paid";
  amount: string;
  currency: string;
  providerSessionRef: string | null;
  checkoutUrl: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  attempts: Array<Record<string, unknown>>;
  paymentCreated: false;
  chargeCreated: false;
  orderMarkedPaid: false;
};

export type CheckoutPreview = {
  schemaVersion: "1.0";
  previewId: string;
  label: string;
  requestId: string;
  fulfillment: FulfillmentOption;
  subtotal: string;
  shipping: string;
  total: string;
  currency: string;
  reservationCreated: false;
  orderCreated: false;
  createdAt: string;
  expiresAt: string;
};

export type PickupBranch = {
  branchId: string;
  name: string;
  city: string | null;
  state: string | null;
};
