import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type StoreItem = {
  id: string;
  name: string;
  price: number;
  img: string;
  qty?: number;
  size?: string;
  color?: string;
  compare_price?: number | null;
};

type Ctx = {
  cart: StoreItem[];
  wishlist: StoreItem[];
  addToCart: (i: StoreItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (i: StoreItem) => void;
  inWishlist: (id: string) => boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StoreItem[]>([]);
  const [wishlist, setWishlist] = useState<StoreItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(load<StoreItem[]>("dor_cart", []));
    setWishlist(load<StoreItem[]>("dor_wishlist", []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("dor_cart", JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("dor_wishlist", JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const value: Ctx = {
    cart,
    wishlist,
    addToCart: (i) =>
      setCart((prev) => {
        const ex = prev.find((p) => p.id === i.id);
        if (ex) return prev.map((p) => (p.id === i.id ? { ...p, qty: (p.qty ?? 1) + 1 } : p));
        return [...prev, { ...i, qty: 1 }];
      }),
    removeFromCart: (id) => setCart((prev) => prev.filter((p) => p.id !== id)),
    updateQty: (id, qty) =>
      setCart((prev) =>
        qty <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, qty } : p)),
      ),
    clearCart: () => setCart([]),
    toggleWishlist: (i) =>
      setWishlist((prev) => (prev.find((p) => p.id === i.id) ? prev.filter((p) => p.id !== i.id) : [...prev, i])),
    inWishlist: (id) => wishlist.some((w) => w.id === id),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
