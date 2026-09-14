import { useState, useMemo, type FormEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  // Só na Home a gente tem um hero por trás pra "flutuar" o header em
  // cima — nas outras páginas (fundo branco comum) ele continua sólido
  // e fixo no topo, como sempre foi.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overlay = pathname === "/";

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

  function SearchForm({ className }: { className?: string }) {
    return (
      <form onSubmit={onSearch} className={cn("relative", className)}>
        <div className="flex items-center gap-2 rounded-full bg-background/95 px-5 py-3 shadow-lg backdrop-blur">
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
    );
  }

  function NavLinks({ className, linkClassName }: { className?: string; linkClassName?: string }) {
    return (
      <nav className={className}>
        <Link
          to="/novidades"
          className={cn("whitespace-nowrap text-sm font-bold text-primary transition-colors hover:opacity-80", linkClassName)}
        >
          Novidades
        </Link>
        {categoryTabs.map((c) => (
          <Link
            key={c.slug}
            to="/catalogo"
            search={{ categoria: c.slug }}
            className={cn("whitespace-nowrap text-sm font-bold text-foreground transition-colors hover:text-primary", linkClassName)}
          >
            {c.label}
          </Link>
        ))}
        {extraLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={cn("whitespace-nowrap text-sm font-bold text-foreground transition-colors hover:text-primary", linkClassName)}
            activeProps={{ className: "text-primary" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    );
  }

  const Logo = ({ className }: { className?: string }) => (
    <Link to="/" aria-label={`${siteConfig.name} — Home`} className="inline-flex shrink-0 items-center">
      <img
        src={siteConfig.logo}
        alt={`${siteConfig.name} logo`}
        width={1920}
        height={512}
        className={className}
      />
    </Link>
  );

  return (
    <header
      className={cn(
        "z-50 w-full",
        overlay ? "absolute inset-x-0 top-0 bg-transparent" : "sticky top-0 border-b border-border bg-background",
      )}
    >
      {!overlay && <div className="h-1 w-full bg-primary" />}

      {/* ================= Desktop ================= */}
      {overlay ? (
        // Home: logo centralizada numa linha própria, e por baixo dela o
        // menu (dentro de uma pílula, pra ficar legível em cima da foto),
        // a busca e os links de carrinho/admin — tudo "flutuando" sobre
        // o hero, sem fundo próprio no <header>.
        <div className="mx-auto hidden max-w-7xl flex-col items-center gap-4 px-4 pb-5 pt-6 sm:px-6 md:flex">
          <Logo className="h-12 w-auto drop-shadow-lg lg:h-14" />
          <div className="flex w-full items-center gap-4">
            <NavLinks
              className="flex shrink-0 items-center gap-6 rounded-full bg-background/95 px-6 py-3 shadow-lg backdrop-blur"
            />
            <SearchForm className="min-w-0 flex-1" />
            <div className="flex shrink-0 items-center gap-5 text-sm font-semibold text-white drop-shadow-md">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 transition-opacity hover:opacity-80"
              >
                <ShoppingBag className="h-4 w-4" />
                Carrinho
                {cartCount > 0 && (
                  <span className="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </button>
              <Link to="/admin" className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:block">
          <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6">
            <Logo className="h-11 w-auto sm:h-12" />
            <SearchForm className="ml-2 flex-1" />
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
            </div>
          </div>

          <div className="border-t border-border">
            <NavLinks className="mx-auto flex max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4 py-3 sm:px-6" />
          </div>
        </div>
      )}

      {/* ================= Mobile ================= */}
      <div className="md:hidden">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            className={cn("shrink-0", overlay && !open && "text-white hover:bg-white/15 hover:text-white")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <form onSubmit={onSearch} className="relative min-w-0 flex-1">
            <div className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 100)}
                placeholder="O que você procura?"
                aria-label="Buscar produtos"
                autoComplete="off"
                className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <SuggestionList />
          </form>

          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Favoritos"
            className={cn("shrink-0", overlay && "text-white hover:bg-white/15 hover:text-white")}
          >
            <Link to="/favoritos" className="relative">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Carrinho"
            className={cn("relative shrink-0", overlay && "text-white hover:bg-white/15 hover:text-white")}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>

        {/* Logo pequena, centralizada abaixo da barra de busca */}
        <div className={cn("flex justify-center py-2", !overlay && "border-t border-border")}>
          <Logo className="h-7 w-auto drop-shadow" />
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
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
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-md border-t border-border px-2 pt-3 pb-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" /> Painel administrativo
          </Link>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
