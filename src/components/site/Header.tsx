import { useState, useMemo, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Button } from "@/components/ui/button";
import { productsQuery, effectivePrice, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


const categoryTabs = [
  { slug: "nacionais", label: "Nacionais" },
  { slug: "europeus", label: "Europeus" },
  { slug: "selecoes", label: "Seleções" },
  { slug: "retro", label: "Retrô" },
  { slug: "nba", label: "NBA" },
] as const;

const extraLinks = [
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const { favorites } = useFavorites();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const { data: allProducts = [] } = useQuery(productsQuery());

  const suggestions = useMemo(() => {
    const q = normalize(term);
    if (!q) return [];
    return allProducts.filter((p) => normalize(p.name).includes(q)).slice(0, 5);
  }, [term, allProducts]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/catalogo", search: term.trim() ? { q: term.trim() } : {} });
    setOpen(false);
    setSuggestOpen(false);
  }

  function goToProduct(p: Product) {
    navigate({ to: "/produto/$slug", params: { slug: p.slug } });
    setTerm("");
    setSuggestOpen(false);
    setOpen(false);
  }

  function SuggestionList() {
    if (!suggestOpen || suggestions.length === 0) return null;
    return (
      <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        {suggestions.map((p) => (
          <button
            key={p.id}
            type="button"
            onMouseDown={() => goToProduct(p)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <img
              src={p.images[0] ?? "/images/jersey-1.jpg"}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{p.name}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-primary">
              {formatPrice(effectivePrice(p))}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="h-1 w-full bg-primary" />

      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label={`${siteConfig.name} — Home`}>
          <img
            src={siteConfig.logo}
            alt={`${siteConfig.name} logo`}
            width={1920}
            height={512}
            className="h-11 w-auto sm:h-12"
          />
        </Link>

        <form onSubmit={onSearch} className="relative ml-2 hidden flex-1 md:block">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-5 py-3">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 100)}
              placeholder="O que você procura?"
              aria-label="Buscar produtos"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" aria-label="Buscar">
              <Search className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            </button>
          </div>
          <SuggestionList />
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Carrinho"
            className="relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Favoritos">
            <Link to="/favoritos" className="relative">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Painel administrativo">
            <Link to="/admin">
              <ShieldCheck className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Barra de categorias */}
      <div className="hidden border-t border-border md:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4 py-3 sm:px-6">
          <Link
            to="/novidades"
            className="whitespace-nowrap text-sm font-bold text-primary transition-colors hover:opacity-80"
          >
            Novidades
          </Link>
          {categoryTabs.map((c) => (
            <Link
              key={c.slug}
              to="/catalogo"
              search={{ categoria: c.slug }}
              className="whitespace-nowrap text-sm font-bold text-foreground transition-colors hover:text-primary"
            >
              {c.label}
            </Link>
          ))}
          {extraLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="whitespace-nowrap text-sm font-bold text-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <form onSubmit={onSearch} className="relative mb-3">
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 100)}
                placeholder="O que você procura?"
                aria-label="Buscar produtos"
                autoComplete="off"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" aria-label="Buscar">
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <SuggestionList />
          </form>
          <Link
            to="/novidades"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-2.5 text-sm font-bold text-primary"
          >
            Novidades
          </Link>
          {categoryTabs.map((c) => (
            <Link
              key={c.slug}
              to="/catalogo"
              search={{ categoria: c.slug }}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              {c.label}
            </Link>
          ))}
          {extraLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
