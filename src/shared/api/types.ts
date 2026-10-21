/**
 * Tipos de datos que representan los contratos recibidos desde la API REST de Disc Market.
 */

export interface BackendCategory {
  category_id: number;
  category_name: string;
}

export interface BackendInventory {
  inventory_id: number;
  product_id: number;
  quantity_available: number;
  quantity_reserved: number;
}

export interface BackendProduct {
  product_id: number;
  name: string;
  artist: string;
  format: string;
  price: string | number;
  description: string | null;
  image_url: string | null;
  category?: BackendCategory | null;
  inventory?: BackendInventory | null;
}

export interface BackendUser {
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface BackendAuthResponse {
  message: string;
  user: BackendUser;
  token: string;
}

export interface BackendCustomTrack {
  custom_track_id: number;
  custom_product_id: number;
  track_name: string;
  file_path: string;
  track_order: number;
  duration: number;
}

export interface BackendCustomProduct {
  custom_product_id: number;
  user_id: number;
  format: string;
  title: string;
  cover_image?: string | null;
  message?: string | null;
  packaging_option?: string | null;
  price: string | number;
  created_at?: string;
  custom_tracks?: BackendCustomTrack[];
}

export interface BackendCartItem {
  cart_item_id: number;
  cart_id: number;
  product_id: number | null;
  custom_product_id: number | null;
  quantity: number;
  unit_price: string | number;
  product?: BackendProduct | null;
  custom_product?: BackendCustomProduct | null;
}

export interface BackendShoppingCart {
  cart_id: number;
  user_id: number;
  status: string;
  created_at: string;
  cart_items: BackendCartItem[];
}

export interface BackendCheckoutResponse {
  message: string;
  order_id: number;
  total_amount: number;
  tracking_number: string;
}

export interface BackendOrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number | null;
  custom_product_id: number | null;
  quantity: number;
  unit_price: string | number;
  product?: BackendProduct | null;
  custom_product?: BackendCustomProduct | null;
}

export interface BackendOrder {
  order_id: number;
  user_id: number;
  total_amount: string | number;
  order_status: string;
  payment_status: string;
  created_at: string;
  order_items?: BackendOrderItem[];
  payment?: {
    payment_id: number;
    payment_method: string;
    payment_status: string;
    amount: string | number;
  };
  shipping?: {
    shipping_id: number;
    shipping_method: string;
    tracking_number: string;
    shipping_status: string;
  };
}

export interface BackendUserPreference {
  preference_id: number;
  user_id: number;
  phone?: string | null;
  preferred_format: string; // 'VINYL', 'CD', 'ALL'
  theme: string; // 'dark', 'light', 'high-contrast'
  notify_order_status: boolean;
  notify_newsletter: boolean;
  default_address_line1?: string | null;
  default_address_line2?: string | null;
  default_city?: string | null;
  default_state?: string | null;
  default_postal_code?: string | null;
  default_country: string;
  avatar_url?: string | null;
  updated_at?: string;
}

export interface BackendUserStats {
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export interface BackendUserProfileResponse {
  user: BackendUser;
  preferences: BackendUserPreference;
  stats: BackendUserStats;
}

