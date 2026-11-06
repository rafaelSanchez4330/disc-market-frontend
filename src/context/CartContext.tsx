import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CartItem } from '../data/types';
import { useAuth } from './AuthContext';
import { cartService } from '../shared/api/services/cartService';
import { mapBackendCartItem } from '../shared/api/mappers';

type CartContextValue = {
  items: CartItem[]; count: number; total: number; loading: boolean; checkoutPending: boolean;
  isPendingSync: boolean; syncError: string | null;
  retrySync: () => Promise<void>;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => Promise<void>; refreshCart: () => Promise<void>;
};
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'disc-market-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.user_id || user?.userId;
  const [items, setItems] = useState<CartItem[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(saved) ? saved : []; } catch { return []; }
  });
  const currentItems = useRef(items); currentItems.current = items;
  const [loading, setLoading] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncing = useRef(false);
  const mutating = useRef(false);
  const previousUser = useRef<number | undefined>(userId);
  const isPendingSync = Boolean(userId) && (items.some(item => !item.cartItemId) || syncError !== null);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const loadCart = useCallback(async (uid: number, importGuests = false) => {
    const initial = await cartService.getCart(uid);
    setCheckoutPending(Boolean(initial.checkout_pending));
    const pending = currentItems.current.filter(item => !item.cartItemId);
    const failed: CartItem[] = [];
    let failure = '';
    if (importGuests) for (const item of pending) {
      try {
        await cartService.addItem({ userId: uid, productId: item.customProductId ? undefined : item.productId,
          customProductId: item.customProductId, quantity: item.quantity });
      } catch (error) { failed.push(item); failure = error instanceof Error ? error.message : 'No se pudo sincronizar el carrito.'; }
    }
    const remote = importGuests && pending.length ? await cartService.getCart(uid) : initial;
    setCheckoutPending(Boolean(remote.checkout_pending));
    setItems([...(remote.cart_items || []).map(mapBackendCartItem), ...(importGuests ? failed : pending)]);
    setSyncError(failure || null);
    if (failure) throw new Error(failure);
  }, []);

  const retrySync = useCallback(async () => {
    if (!userId) return;
    if (syncing.current || mutating.current) throw new Error('Espera a que termine la actualización del carrito.');
    syncing.current = true; setLoading(true);
    try { await loadCart(userId, true); }
    catch (error) { setSyncError(error instanceof Error ? error.message : 'No se pudo sincronizar el carrito.'); throw error; }
    finally { syncing.current = false; setLoading(false); }
  }, [userId, loadCart]);

  useEffect(() => {
    if (previousUser.current && previousUser.current !== userId) { setItems([]); currentItems.current = []; setCheckoutPending(false); setSyncError(null); }
    previousUser.current = userId;
    if (userId) void retrySync().catch(() => {});
  }, [userId, retrySync]);
  useEffect(() => {
    const retry = () => { if (userId && navigator.onLine) void retrySync().catch(() => {}); };
    window.addEventListener('online', retry);
    const interval = isPendingSync ? window.setInterval(retry, 15000) : undefined;
    return () => { window.removeEventListener('online', retry); if (interval) clearInterval(interval); };
  }, [userId, isPendingSync, retrySync]);

  async function mutate(action: () => Promise<unknown>) {
    if (mutating.current || syncing.current) throw new Error('Espera a que termine la actualización del carrito.');
    if (checkoutPending) throw new Error('Cancela el pago abierto antes de cambiar el carrito.');
    mutating.current = true; setLoading(true);
    try { await action(); if (userId) await loadCart(userId); }
    catch (error) {
      // Reload on business rejection; never display a quantity the server refused.
      if (userId) await loadCart(userId).catch(() => setSyncError('No se pudo consultar el carrito.'));
      throw error;
    } finally { mutating.current = false; setLoading(false); }
  }

  const addItem: CartContextValue['addItem'] = async item => {
    const quantity = item.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Indica una cantidad entera mayor que cero.');
    if (userId) {
      await mutate(() => cartService.addItem({ userId, productId: item.customProductId ? undefined : item.productId, customProductId: item.customProductId, quantity }));
    } else {
      setItems(current => {
        const match = current.find(row => item.customProductId ? row.customProductId === item.customProductId : row.productId === item.productId);
        return match ? current.map(row => row.id === match.id ? { ...row, quantity: row.quantity + quantity } : row)
          : [...current, { ...item, quantity, id: item.customId ?? `p-${item.productId}-${Date.now()}` }];
      });
    }
  };
  const updateQuantity: CartContextValue['updateQuantity'] = async (id, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Indica una cantidad entera válida.');
    const item = items.find(row => row.id === id);
    if (userId && item?.cartItemId) await mutate(() => quantity === 0 ? cartService.removeItem(item.cartItemId!) : cartService.updateQuantity(item.cartItemId!, quantity));
    else { setItems(current => current.map(row => row.id === id ? { ...row, quantity } : row).filter(row => row.quantity > 0)); setSyncError(null); }
  };
  const removeItem = (id: string) => updateQuantity(id, 0);
  const clear = async () => {
    if (userId) await mutate(() => cartService.clearCart(userId));
    else setItems([]);
  };
  const refreshCart = async () => { if (userId) await loadCart(userId); };
  const value: CartContextValue = { items, count: items.reduce((n, item) => n + item.quantity, 0), total: items.reduce((n, item) => n + item.quantity * item.unitPrice, 0),
    loading, checkoutPending, isPendingSync, syncError, retrySync, addItem, updateQuantity, removeItem, clear, refreshCart };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
