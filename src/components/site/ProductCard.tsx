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
    <article className="group surface-card hover-lift relative flex h-full flex-col overflow-hidden rounded-2xl">
      <button
        type="button"
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        onClick={() => toggle(product.id)}
        className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur transition-colors hover:bg-background"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            favorite ? "fill-primary text-primary" : "text-muted-foreground",
          )}
        />
      </button>

      <Link to="/produto/$slug" params={{ slug: product.slug }} className="flex h-full flex-col">
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-secondary">
          <img
            src={image}
            alt={`Camisa ${product.name}`}
            loading="lazy"
            decoding="async"
            width={900}
            height={1100}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              -{Math.round((1 - price / product.price) * 100)}%
            </span>
          )}
          <span
            className={cn(
              "absolute left-3 bottom-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
              availability === "pronta_entrega"
                ? "bg-success/90 text-background"
                : "bg-secondary/90 text-foreground",
            )}
          >
            {availabilityLabel[availability]}
          </span>
          {status === "out_of_stock" && (
            <span className="absolute inset-x-0 bottom-0 bg-background/85 py-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Esgotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground sm:text-[11px]">
            {product.code}
          </p>
          <h3 className="font-display text-base leading-tight sm:text-lg">{product.name}</h3>
          <div className="mt-auto space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-primary sm:text-lg">{formatPrice(price)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {availability === "pronta_entrega" && (
              <p
                className={cn(
                  "text-xs font-medium",
                  status === "in_stock" && "text-success",
                  status === "low_stock" && "text-warning",
                  status === "out_of_stock" && "text-muted-foreground",
                )}
              >
                {stockLabel[status]}
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
