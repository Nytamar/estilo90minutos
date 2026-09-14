import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
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
    <article className="group surface-card hover-lift relative flex h-full flex-col overflow-hidden rounded-[1.75rem] shadow-sm">
      <button
        type="button"
        aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        onClick={() => toggle(product.id)}
        className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            favorite ? "fill-primary text-primary" : "text-muted-foreground",
          )}
        />
      </button>

      <Link to="/produto/$slug" params={{ slug: product.slug }} className="flex h-full flex-col">
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden rounded-[1.5rem] bg-secondary m-1.5">
          <img
            src={image}
            alt={`Camisa ${product.name}`}
            loading="lazy"
            decoding="async"
            width={900}
            height={1100}
            className="h-full w-full rounded-[1.5rem] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
              -{Math.round((1 - price / product.price) * 100)}%
            </span>
          )}
          <span
            className={cn(
              "absolute left-3 bottom-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm",
              availability === "pronta_entrega"
                ? "bg-success/90 text-background"
                : "bg-secondary/90 text-foreground",
            )}
          >
            {availabilityLabel[availability]}
          </span>
          {status === "out_of_stock" && (
            <span className="absolute inset-x-0 bottom-0 rounded-b-[1.5rem] bg-background/85 py-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Esgotado
            </span>
          )}

          {/* Botão circular flutuante, meio sobre a foto — leva pra página do
              produto pra escolher o tamanho (igual clicar no card). */}
          <span
            aria-hidden
            className="absolute -bottom-4 right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-6 sm:gap-2">
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
