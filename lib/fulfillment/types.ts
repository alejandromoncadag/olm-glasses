export type FulfillmentOption = {
  optionId: string;
  branchId: string;
  branchName: string;
  carrierCode: string;
  carrierName: string;
  serviceLevel: string;
  amount: string;
  currency: string;
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
  expiresAt: string;
  createdAt: string;
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
