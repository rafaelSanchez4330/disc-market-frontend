import type { Product } from "./types";

export const products: Product[] = [
  {
    productId: 1,
    category: "Pop",
    name: "Thriller",
    artist: "Michael Jackson",
    format: "VINYL",
    price: 699,
    description:
      "Edición en vinilo del álbum más vendido de la historia. Incluye los clásicos que definieron el pop de los 80.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#1b1024", to: "#c45a12", motif: "burst" },
    tracks: [
      { trackName: "Wanna Be Startin' Somethin'", trackOrder: 1, durationSeconds: 363 },
      { trackName: "Baby Be Mine", trackOrder: 2, durationSeconds: 260 },
      { trackName: "The Girl Is Mine", trackOrder: 3, durationSeconds: 222 },
      { trackName: "Thriller", trackOrder: 4, durationSeconds: 357 },
      { trackName: "Beat It", trackOrder: 5, durationSeconds: 258 },
      { trackName: "Billie Jean", trackOrder: 6, durationSeconds: 294 },
    ],
  },
  {
    productId: 2,
    category: "Pop",
    name: "30",
    artist: "Adele",
    format: "CD",
    price: 199,
    description:
      "El cuarto álbum de Adele, íntimo y cinematográfico. Edición en CD con libreto.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#2a2218", to: "#d4b483", motif: "wave" },
    tracks: [
      { trackName: "Strangers by Nature", trackOrder: 1, durationSeconds: 182 },
      { trackName: "Easy on Me", trackOrder: 2, durationSeconds: 224 },
      { trackName: "My Little Love", trackOrder: 3, durationSeconds: 389 },
      { trackName: "Oh My God", trackOrder: 4, durationSeconds: 225 },
      { trackName: "Can I Get It", trackOrder: 5, durationSeconds: 210 },
    ],
  },
  {
    productId: 3,
    category: "Rock",
    name: "Back in Black",
    artist: "AC/DC",
    format: "VINYL",
    price: 749,
    description:
      "Hard rock de referencia. Vinilo pesado, arte clásico y riffs que no envejecen.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "LOW_STOCK",
    cover: { from: "#0d0d0d", to: "#3d3d3d", motif: "bars" },
    tracks: [
      { trackName: "Hells Bells", trackOrder: 1, durationSeconds: 312 },
      { trackName: "Shoot to Thrill", trackOrder: 2, durationSeconds: 317 },
      { trackName: "Back in Black", trackOrder: 3, durationSeconds: 255 },
      { trackName: "You Shook Me All Night Long", trackOrder: 4, durationSeconds: 210 },
    ],
  },
  {
    productId: 4,
    category: "Custom",
    name: "Custom CD",
    artist: null,
    format: "CD",
    price: 99,
    description:
      "Arma tu propio CD: sube las pistas, diseña la portada y agrega un mensaje. Ideal para regalos.",
    productType: "CUSTOM_TEMPLATE",
    isCustomizable: true,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#12202b", to: "#e8a23a", motif: "grid" },
    tracks: [],
  },
  {
    productId: 5,
    category: "Custom",
    name: "Custom Vinyl",
    artist: null,
    format: "VINYL",
    price: 799,
    description:
      "Un vinilo hecho bajo pedido. Eliges formato visual, tracks, empaque y dedicatoria.",
    productType: "CUSTOM_TEMPLATE",
    isCustomizable: true,
    availabilityStatus: "MADE_TO_ORDER",
    cover: { from: "#2b1218", to: "#c43c3c", motif: "rings" },
    tracks: [],
  },
  {
    productId: 6,
    category: "Rock",
    name: "Abbey Road",
    artist: "The Beatles",
    format: "VINYL",
    price: 799,
    description:
      "El cruce de Abbey Road en vinilo. El último álbum que grabaron juntos, remasterizado.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#1a2e1a", to: "#c4a35a", motif: "bars" },
    tracks: [
      { trackName: "Come Together", trackOrder: 1, durationSeconds: 260 },
      { trackName: "Something", trackOrder: 2, durationSeconds: 182 },
      { trackName: "Here Comes the Sun", trackOrder: 3, durationSeconds: 185 },
      { trackName: "The End", trackOrder: 4, durationSeconds: 141 },
    ],
  },
  {
    productId: 7,
    category: "Rock",
    name: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    format: "VINYL",
    price: 829,
    description:
      "Prisma, silencio y el lado oscuro. Edición en vinilo para escuchar de una sola sentada.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#0b0b12", to: "#7b5cff", motif: "burst" },
    tracks: [
      { trackName: "Speak to Me / Breathe", trackOrder: 1, durationSeconds: 283 },
      { trackName: "Time", trackOrder: 2, durationSeconds: 413 },
      { trackName: "The Great Gig in the Sky", trackOrder: 3, durationSeconds: 276 },
      { trackName: "Money", trackOrder: 4, durationSeconds: 382 },
      { trackName: "Us and Them", trackOrder: 5, durationSeconds: 462 },
    ],
  },
  {
    productId: 8,
    category: "Pop",
    name: "Un Verano Sin Ti",
    artist: "Bad Bunny",
    format: "CD",
    price: 249,
    description:
      "El verano eterno en CD. Reguetón, bachata y nostalgia caribeña en un solo disco.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#0e2a3a", to: "#f2a65a", motif: "wave" },
    tracks: [
      { trackName: "Moscow Mule", trackOrder: 1, durationSeconds: 245 },
      { trackName: "Tití Me Preguntó", trackOrder: 2, durationSeconds: 243 },
      { trackName: "Efecto", trackOrder: 3, durationSeconds: 213 },
      { trackName: "Ojitos Lindos", trackOrder: 4, durationSeconds: 258 },
    ],
  },
  {
    productId: 9,
    category: "Pop",
    name: "Random Access Memories",
    artist: "Daft Punk",
    format: "VINYL",
    price: 899,
    description:
      "Disco, funk y analogía. Vinilo doble de la obra que devolvió el groove a las pistas.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "LOW_STOCK",
    cover: { from: "#1a1a1a", to: "#d8d8d8", motif: "grid" },
    tracks: [
      { trackName: "Give Life Back to Music", trackOrder: 1, durationSeconds: 274 },
      { trackName: "Get Lucky", trackOrder: 2, durationSeconds: 369 },
      { trackName: "Instant Crush", trackOrder: 3, durationSeconds: 337 },
      { trackName: "Contact", trackOrder: 4, durationSeconds: 381 },
    ],
  },
  {
    productId: 10,
    category: "Pop",
    name: "Sour",
    artist: "Olivia Rodrigo",
    format: "CD",
    price: 229,
    description:
      "Debut en CD: pop-punk, baladas y diarios abiertos. La banda sonora de una generación.",
    productType: "REGULAR",
    isCustomizable: false,
    availabilityStatus: "AVAILABLE",
    cover: { from: "#3d1f2b", to: "#f2c6d4", motif: "rings" },
    tracks: [
      { trackName: "brutal", trackOrder: 1, durationSeconds: 143 },
      { trackName: "traitor", trackOrder: 2, durationSeconds: 229 },
      { trackName: "drivers license", trackOrder: 3, durationSeconds: 242 },
      { trackName: "good 4 u", trackOrder: 4, durationSeconds: 178 },
      { trackName: "deja vu", trackOrder: 5, durationSeconds: 215 },
    ],
  },
];

export const customTemplates = products.filter((p) => p.productType === "CUSTOM_TEMPLATE");

export function getProduct(id: number) {
  return products.find((p) => p.productId === id);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const availabilityLabel: Record<Product["availabilityStatus"], string> = {
  AVAILABLE: "Disponible",
  LOW_STOCK: "Pocas piezas",
  MADE_TO_ORDER: "Bajo pedido",
  OUT_OF_STOCK: "Agotado",
};

export const formatLabel: Record<Product["format"], string> = {
  CD: "CD",
  VINYL: "Vinilo",
};
