export type Format = "CD" | "VINYL";
export type ProductType = "REGULAR" | "CUSTOM_TEMPLATE";
export type Availability =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "MADE_TO_ORDER"
  | "OUT_OF_STOCK";

export type ProductTrack = {
  trackName: string;
  trackOrder: number;
  durationSeconds: number;
};

export type CoverTheme = {
  from: string;
  to: string;
  motif: "rings" | "bars" | "burst" | "grid" | "wave";
};

export type Product = {
  productId: number;
  category: string;
  name: string;
  artist: string | null;
  format: Format;
  price: number;
  description: string;
  productType: ProductType;
  isCustomizable: boolean;
  availabilityStatus: Availability;
  cover: CoverTheme;
  tracks: ProductTrack[];
};

export type CartItem = {
  id: string;
  productId?: number;
  customId?: string;
  name: string;
  artist: string | null;
  format: Format;
  quantity: number;
  unitPrice: number;
  cover: CoverTheme;
  customSummary?: string;
};

export type CustomDraft = {
  format: Format;
  title: string;
  message: string;
  packaging: "standard" | "gift" | "collector";
  coverName: string | null;
  tracks: { name: string; order: number }[];
};
