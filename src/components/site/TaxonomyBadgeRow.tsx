import { Link } from "@tanstack/react-router";
import type { Taxonomy } from "@/lib/catalog";
import { ProductScroller } from "@/components/site/ProductScroller";

export function TaxonomyBadgeRow({
  items,
  paramKey,
}: {
  items: Taxonomy[];
  paramKey: "liga" | "time" | "selecao";
}) {
  if (items.length === 0) return null;

  return (
    <ProductScroller>
      {items.map((t) => (
        <Link
          key={t.id}
          to="/catalogo"
          search={{ [paramKey]: t.slug }}
          title={t.name}
          aria-label={t.name}
          className="group flex shrink-0 snap-start flex-col items-center justify-center gap-1"
        >
          <span className="flex h-16 w-24 shrink-0 items-center justify-center transition-transform group-hover:scale-110 sm:h-20 sm:w-28">
            {t.image_url ? (
              <img
                src={t.image_url}
                alt={t.name}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="font-headline text-lg text-muted-foreground">
                {t.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
        </Link>
      ))}
    </ProductScroller>
  );
}
