import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/black-friday")({
  head: () => ({
    meta: [
      { title: `Black Friday — ${siteConfig.name}` },
      {
        name: "description",
        content: "Camisas de futebol com preço especial de Black Friday. Aproveite enquanto durar o estoque.",
      },
      { property: "og:title", content: `Black Friday — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Camisas de futebol com preço especial de Black Friday.",
      },
    ],
  }),
  component: BlackFriday,
});

function BlackFriday() {
  const { data: products = [], isLoading } = useQuery(productsQuery());

  // Entra na Black Friday toda peça com preço promocional (sale_price menor
  // que o preço normal). Pra incluir/tirar uma peça, é só colocar/remover o
  // "preço promocional" dela no admin de produtos — não precisa mexer em código.
  const deals = useMemo(() => {
    return products
      .filter((p) => p.sale_price != null && p.sale_price < p.price)
      .sort((a, b) => {
        const da = 1 - Number(a.sale_price) / Number(a.price);
        const db = 1 - Number(b.sale_price) / Number(b.price);
        return db - da; // maiores descontos primeiro
      });
  }, [products]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl bg-neutral-950 px-6 py-10 text-white sm:px-10">
        <div className="flex items-center gap-2 text-amber-400">
          <Flame className="h-6 w-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Oferta por tempo limitado</span>
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl">Black Friday</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Camisas com preço especial. Os maiores descontos aparecem primeiro — peça pelo WhatsApp
          antes que acabe.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary" />
            ))
          : deals.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!isLoading && deals.length === 0 && (
        <p className="mt-10 text-muted-foreground">
          As ofertas de Black Friday ainda não foram publicadas. Volte em breve!
        </p>
      )}
    </div>
  );
}
