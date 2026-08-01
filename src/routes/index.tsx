import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Sparkles, Truck, ShieldCheck, MessageCircle } from "lucide-react";
import { productsQuery, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
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
  { slug: "nacionais", label: "Nacionais", desc: "Times do Brasil" },
  { slug: "europeus", label: "Europeus", desc: "Clubes da Europa" },
  { slug: "selecoes", label: "Seleções", desc: "Camisas de países" },
  { slug: "retro", label: "Retrô", desc: "Clássicos eternos" },
];

function Home() {
  const { data: products = [], isLoading } = useQuery(productsQuery());

  const featured = products.filter((p) => p.featured).slice(0, 4);
  const recent = products.slice(0, 4);
  const bestSellers = [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Jogador de futebol em estádio iluminado segurando camisa"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="relative mx-auto flex min-h-[78vh] max-h-[760px] max-w-7xl flex-col justify-center gap-6 px-4 py-20 sm:px-6">
          <span className="w-fit rounded-full border border-primary/40 px-4 py-1 text-xs uppercase tracking-[0.25em] text-primary animate-fade-up">
            Coleção 2025/26
          </span>
          <h1 className="max-w-3xl text-5xl leading-[0.95] sm:text-7xl animate-fade-up">
            Vista o manto. <span className="gold-text">Sinta os 90 minutos.</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg animate-fade-up">
            Camisas nacionais, europeias, seleções e retrô com acabamento premium. Escolha a sua e
            finalize o pedido em segundos pelo WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3 animate-fade-up">
            <Button asChild size="lg" className="text-base">
              <Link to="/catalogo">
                Ver catálogo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/catalogo" search={{ categoria: "retro" }}>
                Linha retrô
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto -mt-8 grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
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

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl">Navegue por categoria</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/catalogo"
              search={{ categoria: c.slug }}
              className="surface-card hover-lift group rounded-2xl p-6"
            >
              <p className="font-display text-2xl transition-colors group-hover:text-primary">
                {c.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <ArrowRight className="mt-6 h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <ProductSection
        title="Em destaque"
        icon={<Sparkles className="h-5 w-5 text-primary" />}
        products={featured}
        loading={isLoading}
      />
      <ProductSection
        title="Recém adicionados"
        icon={<Flame className="h-5 w-5 text-primary" />}
        products={recent}
        loading={isLoading}
      />
      <ProductSection
        title="Mais vendidos"
        icon={<Flame className="h-5 w-5 text-primary" />}
        products={bestSellers}
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-card" />
            ))
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
