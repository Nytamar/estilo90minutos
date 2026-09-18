import { useEffect, useState, useMemo, type FormEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Flame,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { HomeTicker } from "@/components/site/HomeTicker";
import { Button } from "@/components/ui/button";
import { productsQuery, effectivePrice, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { homeTickerMessagesQuery } from "@/lib/home-ticker";

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

// Termos "mais buscados" — lista curada, no estilo do "Termos mais buscados"
// de referência. Dá pra ir ajustando com o tempo conforme o que mais vende.
const TRENDING_TERMS = [
  "Camisa retrô",
  "Seleção Brasil",
  "Nacionais",
  "Europeus",
  "NBA",
  "Kit infantil",
  "Lançamentos",
  "Camisa comemorativa",
];

const RECENT_SEARCHES_KEY = "e90min:buscas-recentes";
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string, current: string[]): string[] {
  const clean = term.trim();
  if (!clean) return current;
  const next = [clean, ...current.filter((t) => normalize(t) !== normalize(clean))].slice(
    0,
    MAX_RECENT,
  );
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponível (modo privado, etc.) — segue sem persistir
  }
  return next;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { favorites } = useFavorites();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const { data: allProducts = [] } = useQuery(productsQuery());
  const { data: tickerMessages = [] } = useQuery(homeTickerMessagesQuery());
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Grade grande de "top produtos" enquanto a pessoa digita.
  const matches = useMemo(() => {
    const q = normalize(term);
    if (!q) return [];
    return allProducts.filter((p) => normalize(p.name).includes(q)).slice(0, 6);
  }, [term, allProducts]);

  // Variações simples do termo digitado, tipo "Sugestões" da referência.
  const queryVariants = useMemo(() => {
    const clean = term.trim();
    if (!clean) return [];
    const variants = [clean, `Camisa ${clean}`, `Camiseta ${clean}`, `Kit ${clean}`];
    const seen = new Set<string>();
    return variants.filter((v) => {
      const key = normalize(v);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [term]);

  // "Você também vai gostar" — alguns produtos em destaque pra mostrar antes
  // da pessoa digitar qualquer coisa.
  const featured = useMemo(() => allProducts.slice(0, 3), [allProducts]);

  function runSearch(value: string) {
    const clean = value.trim();
    setRecentSearches((prev) => saveRecentSearch(clean, prev));
    navigate({ to: "/catalogo", search: clean ? { q: clean } : {} });
    setOpen(false);
    setSuggestOpen(false);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    runSearch(term);
  }

  function pickTerm(value: string) {
    setTerm(value);
    runSearch(value);
  }

  function goToProduct(p: Product) {
    setRecentSearches((prev) => (term.trim() ? saveRecentSearch(term, prev) : prev));
    navigate({ to: "/produto/$slug", params: { slug: p.slug } });
    setTerm("");
    setSuggestOpen(false);
    setOpen(false);
  }

  function SuggestionList() {
    if (!suggestOpen) return null;

    // Nada digitado ainda: buscas recentes + mais buscados + recomendados.
    if (!term.trim()) {
      return (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-border bg-background p-5 text-left shadow-xl">
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Você já passou por aqui</p>
              </div>
              <ul className="space-y-1">
                {recentSearches.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      onMouseDown={() => pickTerm(t)}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={recentSearches.length > 0 ? "border-t border-border pt-4" : ""}>
            <div className="mb-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Mais buscados</p>
            </div>
            <ol className="grid grid-cols-2 gap-x-4 gap-y-1">
              {TRENDING_TERMS.map((t, i) => (
                <li key={t}>
                  <button
                    type="button"
                    onMouseDown={() => pickTerm(t)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    {t}
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {featured.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold">Você também vai gostar</p>
              <div className="space-y-1">
                {featured.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => goToProduct(p)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
                  >
                    <img
                      src={p.images[0] ?? "/images/jersey-1.jpg"}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-md object-cover"
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
            </div>
          )}
        </div>
      );
    }

    // Já digitou algo: sugestões de termo à esquerda + grade de produtos.
    return (
      <div className="absolute inset-x-0 top-full z-50 mt-2 flex max-h-[75vh] gap-6 overflow-y-auto rounded-2xl border border-border bg-background p-5 text-left shadow-xl">
        <div className="w-40 shrink-0 border-r border-border pr-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Sugestões
          </p>
          <ul className="space-y-1.5">
            {queryVariants.map((v) => (
              <li key={v}>
                <button
                  type="button"
                  onMouseDown={() => pickTerm(v)}
                  className="text-left text-sm text-foreground transition-colors hover:text-primary"
                >
                  {v}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Top produtos para "{term.trim()}"
          </p>
          {matches.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => goToProduct(p)}
                  className="text-left"
                >
                  <img
                    src={p.images[0] ?? "/images/jersey-1.jpg"}
                    alt=""
                    className="mb-1.5 aspect-square w-full rounded-lg object-cover"
                  />
                  <p className="line-clamp-2 text-xs">{p.name}</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(effectivePrice(p))}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          )}

          <button
            type="button"
            onMouseDown={() => runSearch(term)}
            className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Mostrar todos
          </button>
        </div>
      </div>
    );
  }

  return (
    <header className="sticky top-0 isolate z-50 border-b border-border bg-background">
      {/* Faixa de novidades passando: fica no topo absoluto de tudo — só na
          home, igual à referência. */}
      {isHome && <HomeTicker products={allProducts} messages={tickerMessages} />}

      <div className="h-1 w-full bg-primary" />

      {/* Barra única do desktop, igual ao print da Centauro: logo + busca +
          favoritos/conta/carrinho tudo numa linha só, e as categorias numa
          segunda linha, sem logo repetida. Vale pra todas as páginas. */}
      <div className="relative hidden bg-background md:block">
        <div className="border-b border-border/70">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
            <Link to="/" aria-label={`${siteConfig.name} — Home`} className="shrink-0">
              <img
                src={siteConfig.logo}
                alt={`${siteConfig.name} logo`}
                width={1920}
                height={512}
                className="h-10 w-auto"
              />
            </Link>

            <form onSubmit={onSearch} className="relative w-full max-w-2xl">
              <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 100)}
                  placeholder="O que você está procurando?"
                  aria-label="Buscar produtos"
                  autoComplete="off"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button type="submit" aria-label="Buscar">
                  <Search className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
                </button>
              </div>
              <SuggestionList />
            </form>

            <div className="ml-auto flex shrink-0 items-center gap-6 text-sm font-medium">
              <Link
                to="/favoritos"
                className="flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
              >
                <Heart className="h-4 w-4" />
                Favoritos
                {favorites.length > 0 && <span className="font-semibold text-primary">({favorites.length})</span>}
              </Link>
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
              >
                <ShoppingBag className="h-4 w-4" />
                Carrinho
                {cartCount > 0 && <span className="font-semibold text-primary">({cartCount})</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-7 overflow-x-auto">
            <Link
              to="/novidades"
              className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-primary transition-colors hover:opacity-80"
            >
              Novidades
            </Link>
            {categoryTabs.map((c) => (
              <Link
                key={c.slug}
                to="/catalogo"
                search={{ categoria: c.slug }}
                className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
              >
                {c.label}
              </Link>
            ))}
            {extraLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* MOBILE — hambúrguer, logo central e ícones numa única linha, com a
          busca em linha própria logo abaixo, igual à referência. */}
      <div className="relative flex items-center gap-2 bg-background px-4 py-2.5 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          className="shrink-0"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <Link to="/" aria-label={`${siteConfig.name} — Home`} className="mx-auto shrink-0">
          <img
            src={siteConfig.logo}
            alt={`${siteConfig.name} logo`}
            width={1920}
            height={512}
            className="h-8 w-auto"
          />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Favoritos">
            <Link to="/favoritos" className="relative">
              <User className="h-5 w-5" />
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
        </div>
      </div>

      <div className="relative bg-background px-4 pb-3 md:hidden">
        <form onSubmit={onSearch} className="relative">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2">
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
