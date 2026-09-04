import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Taxonomy } from "@/lib/catalog";
import { TaxonomyBadgeRow } from "@/components/site/TaxonomyBadgeRow";
import { ProductScroller } from "@/components/site/ProductScroller";

type Category = { slug: string; label: string; image: string };

export function NavigationTabs({
  categories,
  leagues,
  clubsNacionais,
  clubsEuropeus,
  countries,
}: {
  categories: Category[];
  leagues: Taxonomy[];
  clubsNacionais: Taxonomy[];
  clubsEuropeus: Taxonomy[];
  countries: Taxonomy[];
}) {
  const tabs = [
    { key: "categoria", label: "Categoria", enabled: categories.length > 0 },
    { key: "liga", label: "Liga", enabled: leagues.length > 0 },
    { key: "time", label: "Time", enabled: clubsNacionais.length + clubsEuropeus.length > 0 },
    { key: "selecao", label: "Seleção", enabled: countries.length > 0 },
  ].filter((t) => t.enabled);

  const [active, setActive] = useState(tabs[0]?.key);

  if (tabs.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6">
      <h2 className="text-3xl">Navegue por</h2>

      <div className="mt-6 flex justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active === t.key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {active === "categoria" && (
          <ProductScroller>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/catalogo"
                search={{ categoria: c.slug }}
                className="group relative aspect-[3/4] w-36 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-48 lg:w-56"
              >
                <img
                  src={c.image}
                  alt={c.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
                <p className="font-headline absolute inset-x-0 bottom-3 text-lg uppercase leading-none text-white sm:bottom-4 sm:text-2xl">
                  {c.label}
                </p>
              </Link>
            ))}
          </ProductScroller>
        )}

        {active === "liga" && <TaxonomyBadgeRow items={leagues} paramKey="liga" />}

        {active === "time" && (
          <div className="space-y-8">
            {clubsNacionais.length > 0 && (
              <div>
                <p className="mb-3 text-sm text-muted-foreground">Times nacionais</p>
                <TaxonomyBadgeRow items={clubsNacionais} paramKey="time" />
              </div>
            )}
            {clubsEuropeus.length > 0 && (
              <div>
                <p className="mb-3 text-sm text-muted-foreground">Times europeus</p>
                <TaxonomyBadgeRow items={clubsEuropeus} paramKey="time" />
              </div>
            )}
          </div>
        )}

        {active === "selecao" && <TaxonomyBadgeRow items={countries} paramKey="selecao" />}
      </div>
    </section>
  );
}
