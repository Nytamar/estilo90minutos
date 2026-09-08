import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Taxonomy } from "@/lib/catalog";
import { TaxonomyBadgeRow } from "@/components/site/TaxonomyBadgeRow";

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

  const isCategoria = active === "categoria";

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Barra em degradê azul, com textura granulada sutil por trás */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl px-4 py-6 text-center sm:px-6",
          isCategoria && "pb-16",
        )}
        style={{
          background:
            "linear-gradient(120deg, #0a1a33 0%, #123a6b 45%, #1e5aa8 75%, #123a6b 100%)",
        }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay"
        >
          <filter id="nav-tabs-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#nav-tabs-grain)" />
        </svg>

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Navegue por</p>
          <p className="mt-1 font-display text-2xl text-white">Encontre seu time</p>

          <div className="mt-4 inline-flex gap-1.5 rounded-full bg-white/10 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-white/75 hover:text-white",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Liga, Time e Seleção ficam dentro da própria barra */}
          {active === "liga" && (
            <div className="mt-6">
              <TaxonomyBadgeRow items={leagues} paramKey="liga" />
            </div>
          )}

          {active === "time" && (
            <div className="mt-6 space-y-6">
              {clubsNacionais.length > 0 && (
                <div>
                  <p className="mb-3 text-sm text-white/70">Times nacionais</p>
                  <TaxonomyBadgeRow items={clubsNacionais} paramKey="time" />
                </div>
              )}
              {clubsEuropeus.length > 0 && (
                <div>
                  <p className="mb-3 text-sm text-white/70">Times europeus</p>
                  <TaxonomyBadgeRow items={clubsEuropeus} paramKey="time" />
                </div>
              )}
            </div>
          )}

          {active === "selecao" && (
            <div className="mt-6">
              <TaxonomyBadgeRow items={countries} paramKey="selecao" />
            </div>
          )}
        </div>
      </div>

      {/* Categoria "salta" pra fora da barra */}
      {isCategoria && (
        <div className="-mt-12 grid gap-4 px-2 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.slug} to="/catalogo" search={{ categoria: c.slug }} className="group block">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl shadow-xl">
                <img
                  src={c.image}
                  alt={c.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="surface-card -mt-1 flex items-center justify-between gap-2 rounded-b-2xl px-4 py-3">
                <p className="font-headline truncate uppercase leading-none">{c.label}</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                  Ver <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
