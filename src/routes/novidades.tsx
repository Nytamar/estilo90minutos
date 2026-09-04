import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { productsQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/novidades")({
  head: () => ({
    meta: [
      { title: `Novidades — ${siteConfig.name}` },
      {
        name: "description",
        content:
          "Confira as camisas mais recentes adicionadas ao catálogo: lançamentos, retrôs e seleções.",
      },
      { property: "og:title", content: `Novidades — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "As camisas mais recentes adicionadas à loja, atualizadas automaticamente.",
      },
    ],
  }),
  component: Novidades,
});

function Novidades() {
  const { data: products = [], isLoading } = useQuery(productsQuery());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-4xl">Novidades</h1>
      </div>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Todo produto novo adicionado à loja aparece aqui primeiro, do mais recente para o mais
        antigo.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary" />
            ))
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!isLoading && products.length === 0 && (
        <p className="mt-10 text-muted-foreground">Nenhum produto cadastrado ainda.</p>
      )}
    </div>
  );
}
