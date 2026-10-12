import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "../data/types";
import { useAuth } from "./AuthContext";
import { cartService } from "../shared/api/services/cartService";
import { mapBackendCartItem } from "../shared/api/mappers";

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "disc-market-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.user_id || user?.userId;

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(false);
  const isSyncingRef = useRef(false);

  // Guardar en localStorage siempre que cambie items
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Sincronizar con el backend cuando el usuario inicia sesión o cambia
  const syncWithBackend = async (uid: number) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setLoading(true);

    try {
      // 1. Obtener carrito del backend
      const backendCart = await cartService.getCart(uid);
      const remoteItems = (backendCart.cart_items || []).map(mapBackendCartItem);

      // 2. Revisar si hay ítems locales pendientes de sincronizar (que no tengan cartItemId)
      const localPendingItems = items.filter((item) => !item.cartItemId);

      if (localPendingItems.length > 0) {
        for (const localItem of localPendingItems) {
          try {
            await cartService.addItem({
              userId: uid,
              productId: localItem.customProductId ? undefined : localItem.productId,
              customProductId: localItem.customProductId,
              quantity: localItem.quantity,
            });
          } catch (syncErr) {
            console.warn("No se pudo sincronizar ítem local al backend:", syncErr);
          }
        }
        // Recargar el carrito consolidado
        const reloadedCart = await cartService.getCart(uid);
        setItems((reloadedCart.cart_items || []).map(mapBackendCartItem));
      } else {
        setItems(remoteItems);
      }
    } catch (err) {
      console.warn("Error al cargar carrito remoto:", err);
    } finally {
      setLoading(false);
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    if (userId) {
      syncWithBackend(userId);
    }
  }, [userId]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = async (item) => {
      const quantity = item.quantity ?? 1;
      const tempId = item.customId ?? `p-${item.productId}-${Date.now()}`;

      // 1. Actualización optimista local
      let itemAddedId = tempId;
      setItems((current) => {
        const match = current.find(
          (row) =>
            (item.customProductId && row.customProductId === item.customProductId) ||
            (item.customId && row.customId === item.customId) ||
            (!item.customProductId && item.productId && row.productId === item.productId)
        );

        if (match) {
          itemAddedId = match.id;
          return current.map((row) =>
            row.id === match.id ? { ...row, quantity: row.quantity + quantity } : row
          );
        }

        return [
          ...current,
          {
            ...item,
            quantity,
            id: tempId,
          },
        ];
      });

      // 2. Si el usuario está autenticado, sincronizar con backend
      if (userId) {
        try {
          const saved = await cartService.addItem({
            userId,
            productId: item.customProductId ? undefined : item.productId,
            customProductId: item.customProductId,
            quantity,
          });

          // Actualizar el ítem con el cartItemId del servidor
          setItems((current) =>
            current.map((row) => {
              const isMatch =
                row.id === itemAddedId ||
                (item.customProductId && row.customProductId === item.customProductId) ||
                (!item.customProductId && item.productId && row.productId === item.productId);

              if (isMatch) {
                return {
                  ...row,
                  id: `ci-${saved.cart_item_id}`,
                  cartItemId: saved.cart_item_id,
                  quantity: saved.quantity,
                };
              }
              return row;
            })
          );
        } catch (err) {
          console.warn("Error al persistir ítem en backend cart:", err);
        }
      }
    };

    const updateQuantity: CartContextValue["updateQuantity"] = async (id, quantity) => {
      const targetItem = items.find((item) => item.id === id);

      // 1. Actualización local
      setItems((current) =>
        current
          .map((item) => (item.id === id ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0)
      );

      // 2. Sincronización backend si tiene cartItemId
      const cartItemId =
        targetItem?.cartItemId ||
        (id.startsWith("ci-") ? parseInt(id.replace("ci-", ""), 10) : undefined);

      if (userId && cartItemId && !isNaN(cartItemId)) {
        try {
          if (quantity <= 0) {
            await cartService.removeItem(cartItemId);
          } else {
            await cartService.updateQuantity(cartItemId, quantity);
          }
        } catch (err) {
          console.warn("Error al actualizar cantidad en backend:", err);
        }
      }
    };

    const removeItem: CartContextValue["removeItem"] = async (id) => {
      const targetItem = items.find((item) => item.id === id);

      // 1. Actualización local
      setItems((current) => current.filter((item) => item.id !== id));

      // 2. Sincronización backend
      const cartItemId =
        targetItem?.cartItemId ||
        (id.startsWith("ci-") ? parseInt(id.replace("ci-", ""), 10) : undefined);

      if (userId && cartItemId && !isNaN(cartItemId)) {
        try {
          await cartService.removeItem(cartItemId);
        } catch (err) {
          console.warn("Error al eliminar ítem de backend:", err);
        }
      }
    };

    const clear: CartContextValue["clear"] = async () => {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);

      if (userId) {
        try {
          await cartService.clearCart(userId);
        } catch (err) {
          console.warn("Error al vaciar carrito en backend:", err);
        }
      }
    };

    const refreshCart = async () => {
      if (userId) {
        await syncWithBackend(userId);
      }
    };

    return {
      items,
      loading,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clear,
      refreshCart,
    };
  }, [items, userId, loading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
