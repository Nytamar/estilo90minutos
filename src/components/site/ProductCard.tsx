import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { effectivePrice, totalStock, availabilityOf, availabilityLabel } from "@/lib/catalog";
import { formatPrice, stockLabel, stockStatus } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggle } = useFavorites();
  const stock = totalStock(product);
  const status = stockStatus(stock);
  const price = effectivePrice(product);
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const image = product.images[0] ?? "/images/jersey-1.jpg";
  const favorite = isFavorite(product.id);
  const availability = availabilityOf(product);

  return (
    <article className="group surface-card hover-lift relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 shadow-sm">
      <button
        type="button"
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        onClick={() => toggle(product.id)}
        className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <Heart
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            favorite ? "fill-primary text-primary" : "text-muted-foreground",
          )}
        />
      </button>

      <Link to="/produto/$slug" params={{ slug: product.slug }} className="flex h-full flex-col">
        <div className="relative aspect-square shrink-0 overflow-hidden bg-secondary">
          <img
            src={image}
            alt={`Camisa ${product.name}`}
            loading="lazy"
            decoding="async"
            width={900}
            height={900}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground shadow-sm">
              -{Math.round((1 - price / product.price) * 100)}%
            </span>
          )}
          {availability === "encomenda" && (
            <span className="absolute left-2 bottom-2 rounded-full bg-secondary/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-foreground shadow-sm">
              {availabilityLabel[availability]}
            </span>
          )}
          {status === "out_of_stock" && (
            <span className="absolute inset-x-0 bottom-0 bg-background/85 py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Esgotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2.5">
          <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-foreground sm:text-xs">
            {product.name}
          </p>
          <div className="mt-auto flex flex-wrap items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-primary sm:text-base">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {availability === "pronta_entrega" && (
            <p
              className={cn(
                "text-[10px] font-medium",
                status === "in_stock" && "text-success",
                status === "low_stock" && "text-warning",
                status === "out_of_stock" && "text-muted-foreground",
              )}
            >
              {stockLabel[status]}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
