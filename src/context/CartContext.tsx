import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "../data/types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "disc-market-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = (item) => {
      setItems((current) => {
        const quantity = item.quantity ?? 1;
        const match = current.find(
          (row) =>
            (item.productId && row.productId === item.productId) ||
            (item.customId && row.customId === item.customId),
        );
        if (match && item.productId) {
          return current.map((row) =>
            row.id === match.id ? { ...row, quantity: row.quantity + quantity } : row,
          );
        }
        return [
          ...current,
          {
            ...item,
            quantity,
            id: item.customId ?? `p-${item.productId}-${Date.now()}`,
          },
        ];
      });
    };

    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      addItem,
      updateQuantity: (id, quantity) => {
        setItems((current) =>
          current
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        );
      },
      removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
