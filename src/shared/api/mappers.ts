import type {
  Availability,
  CartItem,
  CoverTheme,
  Format,
  Product,
} from "../../data/types";
import type {
  BackendCartItem,
  BackendCustomProduct,
  BackendProduct,
} from "./types";

const UPLOADS_BASE_URL =
  (import.meta.env.VITE_UPLOADS_URL as string) || "http://localhost:5000";

/**
 * Normaliza la URL de una imagen o recurso multimedia subido.
 */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${UPLOADS_BASE_URL}${cleanPath}`;
}

/**
 * Genera un CoverTheme CSS armonioso de forma determinista basado en el ID y nombre.
 */
const MOTIFS: CoverTheme["motif"][] = ["rings", "bars", "burst", "grid", "wave"];
const GRADIENTS = [
  { from: "#1b1024", to: "#c45a12" }, // Thriller style
  { from: "#2a2218", to: "#d4b483" }, // Adele style
  { from: "#121214", to: "#3f3f46" }, // Rock style
  { from: "#0a192f", to: "#0284c7" }, // Blue electronic
  { from: "#2e1065", to: "#ec4899" }, // Synthwave
  { from: "#14532d", to: "#84cc16" }, // Acoustic indie
  { from: "#701a75", to: "#f43f5e" }, // Jazz soul
];

export function generateCoverTheme(name: string, id: number): CoverTheme {
  const hash = (id * 31 + name.length) % GRADIENTS.length;
  const motif = MOTIFS[(id + name.charCodeAt(0)) % MOTIFS.length];
  const { from, to } = GRADIENTS[hash];
  return { from, to, motif };
}

/**
 * Normaliza el formato hacia el tipo estricto "CD" | "VINYL".
 */
export function normalizeFormat(rawFormat: string | undefined): Format {
  if (!rawFormat) return "CD";
  const upper = rawFormat.toUpperCase();
  return upper.includes("VINYL") || upper.includes("VINIL") ? "VINYL" : "CD";
}

/**
 * Mapea un producto del backend a la estructura que utiliza la interfaz.
 */
export function mapBackendProduct(p: BackendProduct): Product {
  const stock = p.inventory?.quantity_available ?? 10;
  let availabilityStatus: Availability = "AVAILABLE";
  if (stock <= 0) {
    availabilityStatus = "OUT_OF_STOCK";
  } else if (stock <= 5) {
    availabilityStatus = "LOW_STOCK";
  }

  const price = typeof p.price === "string" ? parseFloat(p.price) : Number(p.price || 0);
  const format = normalizeFormat(p.format);
  const imageUrl = resolveAssetUrl(p.image_url);
  const cover = generateCoverTheme(p.name, p.product_id);

  return {
    productId: p.product_id,
    category: p.category ? p.category.category_name : "General",
    name: p.name,
    artist: p.artist || "Varios artistas",
    format,
    price,
    description: p.description || "Sin descripción disponible.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus,
    cover,
    imageUrl,
    tracks: [],
  };
}

/**
 * Mapea un disco personalizado del backend para representarlo en la vista o carrito.
 */
export function mapBackendCustomProduct(cp: BackendCustomProduct): Product {
  const price = typeof cp.price === "string" ? parseFloat(cp.price) : Number(cp.price || 0);
  const format = normalizeFormat(cp.format);
  const imageUrl = resolveAssetUrl(cp.cover_image);
  const cover = generateCoverTheme(cp.title, cp.custom_product_id);

  return {
    productId: cp.custom_product_id,
    category: "Personalizado",
    name: cp.title,
    artist: "Edición personalizada",
    format,
    price,
    description: cp.message || "Disco personalizado creado a medida.",
    productType: "CUSTOM_TEMPLATE",
    isCustomizable: true,
    availabilityStatus: "MADE_TO_ORDER",
    cover,
    imageUrl,
    tracks: (cp.custom_tracks || []).map((t) => ({
      trackName: t.track_name,
      trackOrder: t.track_order,
      durationSeconds: t.duration || 180,
    })),
  };
}

/**
 * Mapea un ítem del carrito devuelto por la base de datos al tipo CartItem del frontend.
 */
export function mapBackendCartItem(item: BackendCartItem): CartItem {
  const unitPrice =
    typeof item.unit_price === "string"
      ? parseFloat(item.unit_price)
      : Number(item.unit_price || 0);

  if (item.custom_product) {
    const cp = item.custom_product;
    const format = normalizeFormat(cp.format);
    const imageUrl = resolveAssetUrl(cp.cover_image);
    const cover = generateCoverTheme(cp.title, cp.custom_product_id);

    return {
      id: `ci-${item.cart_item_id}`,
      customId: `custom-${cp.custom_product_id}`,
      productId: cp.custom_product_id,
      name: cp.title,
      artist: "Edición personalizada",
      format,
      quantity: item.quantity,
      unitPrice,
      cover,
      imageUrl,
      customSummary: `${cp.packaging_option ? `Empaque ${cp.packaging_option}` : "Personalizado"}${
        cp.custom_tracks?.length ? ` · ${cp.custom_tracks.length} pistas` : ""
      }`,
    };
  }

  const p = item.product;
  const name = p?.name || "Producto";
  const artist = p?.artist || null;
  const format = normalizeFormat(p?.format);
  const imageUrl = resolveAssetUrl(p?.image_url);
  const cover = generateCoverTheme(name, item.product_id || item.cart_item_id);

  return {
    id: `ci-${item.cart_item_id}`,
    productId: item.product_id || undefined,
    name,
    artist,
    format,
    quantity: item.quantity,
    unitPrice,
    cover,
    imageUrl,
  };
}
