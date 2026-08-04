import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search, X } from "lucide-react";
import { z } from "zod";
import {
  productsQuery,
  taxonomiesQuery,
  effectivePrice,
  totalStock,
  availabilityOf,
  type Availability,
} from "@/lib/catalog";
import type { Taxonomy } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { siteConfig, SIZES } from "@/config/site";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  categoria: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Catálogo de Camisas de Futebol — ${siteConfig.name}` },
      {
        name: "description",
        content:
          "Filtre por categoria, clube, liga, país, marca, temporada, preço e tamanho. Camisas com pedido pelo WhatsApp.",
      },
      { property: "og:title", content: `Catálogo — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Todas as camisas disponíveis com filtros e busca instantânea.",
      },
    ],
  }),
  component: Catalogo,
});

type SortKey = "recentes" | "menor" | "maior" | "vendidos" | "az";

const PAGE_SIZE = 8;

const filterGroups = [
  { key: "category" as const, label: "Categoria", field: "category_id" as const },
  { key: "club" as const, label: "Clube", field: "club_id" as const },
  { key: "league" as const, label: "Liga", field: "league_id" as const },
  { key: "country" as const, label: "País", field: "country_id" as const },
  { key: "brand" as const, label: "Marca", field: "brand_id" as const },
  { key: "season" as const, label: "Temporada", field: "season_id" as const },
];

function Catalogo() {
  const params = Route.useSearch();
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const { data: taxonomies = [] } = useQuery(taxonomiesQuery());

  const [query, setQuery] = useState(params.q ?? "");
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [size, setSize] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("recentes");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const categorySlug = params.categoria;
  const categoryId = useMemo(
    () => taxonomies.find((t) => t.type === "category" && t.slug === categorySlug)?.id ?? null,
    [taxonomies, categorySlug],
  );

  const byType = (type: Taxonomy["type"]) => taxonomies.filter((t) => t.type === type);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      for (const g of filterGroups) {
        const value = selected[g.key];
        if (value && p[g.field] !== value) return false;
      }
      if (size && !p.product_sizes.some((s) => s.size === size && s.stock > 0)) return false;
      if (availability && availabilityOf(p) !== availability) return false;
      if (maxPrice != null && effectivePrice(p) > maxPrice) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!`${p.name} ${p.code} ${p.description}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "menor":
          return effectivePrice(a) - effectivePrice(b);
        case "maior":
          return effectivePrice(b) - effectivePrice(a);
        case "vendidos":
          return b.sold_count - a.sold_count;
        case "az":
          return a.name.localeCompare(b.name, "pt-BR");
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });
    return list;
  }, [products, categoryId, selected, size, availability, maxPrice, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const clearAll = () => {
    setSelected({});
    setSize(null);
    setAvailability(null);
    setMaxPrice(null);
    setQuery("");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-4xl">Catálogo</h1>
        <p className="mt-2 text-muted-foreground">
          {isLoading ? "Carregando camisas..." : `${filtered.length} camisas encontradas`}
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por time, código ou nome..."
            className="pl-9"
            aria-label="Buscar produtos"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Ordenar"
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="recentes">Mais recentes</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="vendidos">Mais vendidos</option>
          <option value="az">Ordem alfabética</option>
        </select>
        <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((v) => !v)}>
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={cn("space-y-6", !showFilters && "hidden lg:block")}>
          {categorySlug && (
            <Link to="/catalogo" className="inline-flex">
              <Badge variant="secondary" className="gap-1">
                {categorySlug} <X className="h-3 w-3" />
              </Badge>
            </Link>
          )}

          {filterGroups.map((group) => {
            const options = byType(group.key);
            if (options.length === 0) return null;
            return (
              <div key={group.key}>
                <h2 className="mb-2 font-display text-lg">{group.label}</h2>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => {
                    const active = selected[group.key] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelected((s) => ({ ...s, [group.key]: active ? null : o.id }));
                          setPage(1);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                        )}
                      >
                        {o.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <h2 className="mb-2 font-display text-lg">Disponibilidade</h2>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "pronta_entrega", label: "Pronta entrega" },
                { key: "encomenda", label: "Sob encomenda" },
              ] as const).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    setAvailability(availability === o.key ? null : o.key);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    availability === o.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg">Tamanho</h2>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(size === s ? null : s);
                    setPage(1);
                  }}
                  className={cn(
                    "h-9 w-11 rounded-md border text-sm transition-colors",
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg">Preço até</h2>
            <input
              type="range"
              min={100}
              max={500}
              step={10}
              value={maxPrice ?? 500}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setPage(1);
              }}
              className="w-full accent-[oklch(0.79_0.132_85)]"
              aria-label="Preço máximo"
            />
            <p className="text-sm text-muted-foreground">
              Até R$ {(maxPrice ?? 500).toFixed(0)}
            </p>
          </div>

          <Button variant="ghost" onClick={clearAll} className="w-full">
            Limpar filtros
          </Button>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="surface-card rounded-2xl p-12 text-center">
              <p className="font-display text-2xl">Nenhuma camisa encontrada</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente remover alguns filtros ou buscar por outro termo.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "h-9 w-9 rounded-md border text-sm transition-colors",
                        current === i + 1
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary",
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {filtered.filter((p) => totalStock(p) === 0).length} itens esgotados no momento
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
