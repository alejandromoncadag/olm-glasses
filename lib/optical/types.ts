export type OpticalVariant = {
  variantId: string;
  code: string;
  name: string;
  displayAdjustment: string | null;
};

export type OpticalOption = {
  productId: string | null;
  sku: string | null;
  name: string;
  description: string;
  displayAdjustment: string;
  requiresVariant: boolean;
  variants: OpticalVariant[];
};

export type OpticalOptionsResponse = {
  schemaVersion: "1.0";
  generatedAt: string;
  currency: string;
  frame: {
    productId: string;
    sku: string;
    slug: string;
    name: string;
    price: string;
    currency: string;
  };
  lensDesigns: OpticalOption[];
  treatments: OpticalOption[];
};

export type OpticalPreviewRequest = {
  frameProductId: number;
  lensDesignProductId: number;
  treatmentProductId: number | null;
  treatmentVariantId: number | null;
};

export type OpticalPreviewResponse = {
  schemaVersion: "1.0";
  previewFingerprint: string;
  generatedAt: string;
  currency: string;
  frame: OpticalOptionsResponse["frame"];
  lensDesign: { productId: string; sku: string; name: string; adjustment: string };
  treatment: { productId: string; sku: string; name: string; adjustment: string } | null;
  variant: { variantId: string; code: string; name: string } | null;
  subtotal: string;
  configuredTotal: string;
  binding: false;
};

export type OpticalPrescriptionMethod = "later" | "exam";

export type OpticalDraftRequest = OpticalPreviewRequest & {
  previewFingerprint: string;
  prescriptionMethod: OpticalPrescriptionMethod;
  branchId: number;
  intendedUse: "lejos" | "cerca" | "intermedio" | "multifocal" | "sin_graduacion" | "otro" | null;
};

export type OpticalDraftResponse = {
  schemaVersion: "1.0";
  draftPublicId: string;
  configurationPublicId: string;
  reservationPublicId: string;
  status: "pendiente_receta" | "listo_para_pago" | "pendiente_pago" | "cancelado" | "expirado";
  paymentStatus: "sin_pago";
  prescriptionMethod: OpticalPrescriptionMethod;
  prescriptionStatus: "pending" | "provided";
  intendedUse: string | null;
  branch: { code: string; name: string };
  configuration: {
    frame: OpticalOptionsResponse["frame"];
    lensDesign: OpticalPreviewResponse["lensDesign"];
    treatment: OpticalPreviewResponse["treatment"];
    variant: OpticalPreviewResponse["variant"];
    currency: string;
    configuredTotal: string;
    capturedAt: string;
    previewFingerprint: string;
    schemaVersion: string;
  };
  currency: string;
  configuredTotal: string;
  previewFingerprint: string;
  reservation: {
    status: "activa" | "cancelada" | "expirada";
    expiresAt: string;
    releasedAt: string | null;
    reservedFrameQuantity: 0 | 1;
  };
  createdAt: string;
  updatedAt: string;
  paymentCreated: false;
  saleCreated: false;
};
