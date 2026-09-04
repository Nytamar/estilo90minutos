import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  productId: string;
  code: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  unitPrice: number;
  quantity: number;
  customization?: { name: string; number: string } | null;
};

const KEY = "e90:cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("e90:cart:change"));
}

function sameLine(a: CartItem, b: Pick<CartItem, "productId" | "size">) {
  return a.productId === b.productId && a.size === b.size;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("e90:cart:change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("e90:cart:change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const addItem = useCallback((item: CartItem) => {
    const current = read();
    const idx = current.findIndex((i) => sameLine(i, item));
    let next: CartItem[];
    if (idx >= 0) {
      next = current.slice();
      next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
    } else {
      next = [...current, item];
    }
    write(next);
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    const current = read();
    const next = current
      .map((i) => (sameLine(i, { productId, size }) ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    write(next);
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    write(read().filter((i) => !sameLine(i, { productId, size })));
  }, []);

  const clear = useCallback(() => write([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return { items, addItem, updateQuantity, removeItem, clear, count, total };
}
