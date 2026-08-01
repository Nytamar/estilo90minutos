import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: `Meus favoritos — ${siteConfig.name}` },
      { name: "description", content: "As camisas que você salvou para pedir depois." },
      { property: "og:title", content: `Meus favoritos — ${siteConfig.name}` },
      { property: "og:description", content: "Sua lista de camisas favoritas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { favorites } = useFavorites();
  const { data: products = [] } = useQuery(productsQuery());
  const list = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl">Meus favoritos</h1>
      {list.length === 0 ? (
        <div className="surface-card mt-8 rounded-2xl p-12 text-center">
          <p className="font-display text-2xl">Você ainda não salvou nenhuma camisa</p>
          <Button asChild className="mt-6">
            <Link to="/catalogo">Explorar catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
