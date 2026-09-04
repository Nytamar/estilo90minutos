import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck, Sparkles, Clock, Flame, Truck, ShieldCheck, MessageCircle } from "lucide-react";
import { productsQuery, taxonomiesQuery, availabilityOf, PRE_ORDER_NOTICE, type Product } from "@/lib/catalog";
import { bannersQuery } from "@/lib/banners";
import { BannerCarousel } from "@/components/site/BannerCarousel";
import { homePromotionsQuery } from "@/lib/home-promotions";
import { HomePromotions } from "@/components/site/HomePromotions";
import { homeTickerMessagesQuery } from "@/lib/home-ticker";
import { HomeTicker } from "@/components/site/HomeTicker";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductScroller } from "@/components/site/ProductScroller";
import { NavigationTabs } from "@/components/site/NavigationTabs";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteConfig.name} — Camisas de Futebol Nacionais, Europeias e Retrô` },
      {
        name: "description",
        content:
          "Camisas de futebol de clubes nacionais, europeus, seleções e retrô. Escolha o modelo e feche o pedido direto pelo WhatsApp.",
      },
      { property: "og:title", content: `${siteConfig.name} — Camisas de Futebol` },
      {
        property: "og:description",
        content: "Catálogo premium de camisas de futebol com pedido direto pelo WhatsApp.",
      },
    ],
  }),
  component: Home,
});

const categories = [
  { slug: "nacionais", label: "Nacionais", desc: "Times do Brasil", image: "/images/Nacionais.png" },
  { slug: "europeus", label: "Europeus", desc: "Clubes da Europa", image: "/images/Europeus.jpg" },
  { slug: "selecoes", label: "Seleções", desc: "Camisas de países", image: "/images/Selecoes.png" },
  { slug: "retro", label: "Retrô", desc: "Clássicos eternos", image: "/images/Retro.png" },
  { slug: "nba", label: "NBA", desc: "Regatas e jerseys", image: "/images/Nba.png" },
];

function Home() {
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const { data: taxonomies = [] } = useQuery(taxonomiesQuery());
  const leagues = taxonomies.filter((t) => t.type === "league");
  const clubsNacionais = taxonomies.filter((t) => t.type === "club" && t.region === "nacional");
  const clubsEuropeus = taxonomies.filter((t) => t.type === "club" && t.region === "europeu");
  const countries = taxonomies.filter((t) => t.type === "country");
  const { data: banners = [] } = useQuery(bannersQuery());
  const { data: promotions = [] } = useQuery(homePromotionsQuery());
  const { data: tickerMessages = [] } = useQuery(
  homeTickerMessagesQuery(),
);

  const featured = products.filter((p) => p.featured).slice(0, 4);
  const bestSellers = [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 4);
  const readyToShip = products.filter((p) => availabilityOf(p) === "pronta_entrega").slice(0, 8);
  const madeToOrder = products.filter((p) => availabilityOf(p) === "encomenda").slice(0, 8);

  return (
    <div>
      {/* Título principal da página, só pra leitor de tela e SEO — visualmente
          o carrossel de banners abaixo já cumpre esse papel. */}
      <h1 className="sr-only">
        {siteConfig.name} — Camisas de futebol nacionais, europeias, seleções e retrô
      </h1>

      {banners.length > 0 && <BannerCarousel banners={banners} />}

      <HomeTicker
        products={products}
        messages={tickerMessages}
      />
      
      <HomePromotions promotions={promotions} />

      {/* Benefícios */}
      <section className="relative z-10 mx-auto mt-6 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
        {[
          { icon: MessageCircle, title: "Pedido pelo WhatsApp", desc: "Atendimento humano e rápido" },
          { icon: Truck, title: "Enviamos para todo Brasil", desc: "Frete calculado no atendimento" },
          { icon: ShieldCheck, title: "Qualidade garantida", desc: "Tecido premium e acabamento fiel" },
        ].map((b) => (
          <div key={b.title} className="surface-card flex items-center gap-3 rounded-xl p-4">
            <b.icon className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <ProductSection
        title="Mais vendidos"
        icon={<Flame className="h-5 w-5 text-primary" />}
        products={bestSellers}
        loading={isLoading}
      />

      <NavigationTabs
        categories={categories}
        leagues={leagues}
        clubsNacionais={clubsNacionais}
        clubsEuropeus={clubsEuropeus}
        countries={countries}
      />

      <ProductSection
        title="Pronta entrega"
        icon={<PackageCheck className="h-5 w-5 text-primary" />}
        products={readyToShip}
        loading={isLoading}
      />
      {madeToOrder.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="surface-card flex items-start gap-3 rounded-xl border border-warning/40 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Atenção:</span> {PRE_ORDER_NOTICE}
            </p>
          </div>
        </div>
      )}

      <ProductSection
        title="Em destaque"
        icon={<Sparkles className="h-5 w-5 text-primary" />}
        products={featured}
        loading={isLoading}
      />

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="surface-card flex flex-col items-center gap-4 rounded-3xl p-10 text-center">
          <h2 className="text-3xl">Não achou o seu time?</h2>
          <p className="max-w-lg text-muted-foreground">
            Trabalhamos com encomendas. Chame no WhatsApp e conseguimos o manto para você.
          </p>
          <Button asChild size="lg">
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ProductSection({
  title,
  icon,
  products,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  loading: boolean;
}) {
  if (!loading && products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-3xl">
          {icon} {title}
        </h2>
        <Link to="/catalogo" className="text-sm text-primary hover:underline">
          Ver tudo
        </Link>
      </div>
      {loading ? (
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] w-[46%] shrink-0 animate-pulse rounded-2xl bg-card sm:w-[42%] lg:w-[23%]"
            />
          ))}
        </div>
      ) : (
        <ProductScroller>
          {products.map((p) => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[42%] lg:w-[23%]">
              <ProductCard product={p} />
            </div>
          ))}
        </ProductScroller>
      )}
    </section>
  );
}
