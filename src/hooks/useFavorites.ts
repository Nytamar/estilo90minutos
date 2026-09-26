import { useCallback, useEffect, useState } from "react";

const KEY = "e90:favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(read());
    const onStorage = () => setFavorites(read());
    window.addEventListener("storage", onStorage);
    window.addEventListener("e90:favorites", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("e90:favorites", onStorage);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setFavorites(next);
    window.dispatchEvent(new Event("e90:favorites"));
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
