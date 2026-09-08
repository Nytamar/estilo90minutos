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