import { useEffect, useState, type FormEvent } from "react";
import { Heart, Instagram, Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Banner } from "@/lib/banners";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";

const AUTOPLAY_MS = 6000;

const categoryTabs = [
  { slug: "nacionais", label: "Nacionais" },
  { slug: "europeus", label: "Europeus" },
  { slug: "selecoes", label: "Seleções" },
  { slug: "retro", label: "Retrô" },
  { slug: "nba", label: "NBA" },
] as const;

const extraLinks = [
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

/**
 * Nav "flutuante" só pro desktop da home: logo solta (sem fundo) ao lado das
 * categorias, e favoritos/carrinho/admin/instagram junto da busca — tudo
 * sobreposto direto na foto do banner, igual à referência do cliente.
 */
function OverlayNav() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { count: cartCount } = useCart();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/catalogo", search: term.trim() ? { q: term.trim() } : {} });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-center px-6 pt-16 sm:pt-20 lg:pt-24 md:flex">
      <div className="flex w-full max-w-6xl items-center justify-between gap-10">
        <Link to="/" aria-label={`${siteConfig.name} — Home`} className="pointer-events-auto shrink-0">
          <img src={siteConfig.logo} alt={`${siteConfig.name} logo`} className="h-10 w-auto drop-shadow" />
        </Link>

        <nav className="pointer-events-auto flex items-center gap-6 rounded-full bg-white px-6 py-3 shadow-lg">
          <Link
            to="/novidades"
            className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:opacity-80"
          >
            Novidades
          </Link>
          {categoryTabs.map((c) => (
            <Link
              key={c.slug}
              to="/catalogo"
              search={{ categoria: c.slug }}
              className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-[#10325B] transition-colors hover:text-primary"
            >
              {c.label}
            </Link>
          ))}
          {extraLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-[#10325B] transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={onSearch}
          className="pointer-events-auto ml-4 flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-lg"
        >
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-[#10325B] transition-colors hover:text-primary"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <Link
            to="/favoritos"
            aria-label="Favoritos"
            className="relative text-[#10325B] transition-colors hover:text-primary"
          >
            <Heart className="h-4 w-4" />
            {favorites.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                {favorites.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Carrinho"
            className="relative text-[#10325B] transition-colors hover:text-primary"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
          <Link to="/admin" aria-label="Admin" className="text-[#10325B] transition-colors hover:text-primary">
            <ShieldCheck className="h-4 w-4" />
          </Link>

          <span className="h-4 w-px bg-border" aria-hidden />

          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="O que você procura?"
            aria-label="Buscar produtos"
            autoComplete="off"
            className="w-36 bg-transparent text-sm text-[#10325B] outline-none placeholder:text-[#10325B]/60 lg:w-48"
          />
          <button type="submit" aria-label="Buscar">
            <Search className="h-4 w-4 text-[#10325B]/70 transition-colors hover:text-primary" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function BannerCarousel({
  banners,
  overlayNav = false,
  fullBleed = false,
}: {
  banners: Banner[];
  /** Mostra logo + categorias + busca flutuando por cima da foto (desktop). */
  overlayNav?: boolean;
  /** Remove cantos arredondados e a margem lateral — banner de ponta a ponta. */
  fullBleed?: boolean;
}) {
  const total = banners.length;
  const multiple = total > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!multiple || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [multiple, paused, total]);

  if (total === 0) return null;

  return (
    <section
      className={cn(
        "relative isolate z-0 w-full",
        fullBleed ? "mt-0" : "mx-auto mt-4 max-w-7xl px-4 sm:mt-6 sm:px-6",
      )}
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-secondary",
          fullBleed ? "rounded-none" : "rounded-[1.75rem]",
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {overlayNav && <OverlayNav />}

        {/* Esmaecendo de uma imagem pra outra, ao invés de deslizar. */}
        <div className="relative">
          {banners.map((b, i) => (
            <BannerSlide
              key={b.id}
              banner={b}
              priority={i === index}
              tall={fullBleed}
              active={i === index}
              stacked={i > 0}
            />
          ))}
        </div>

        {multiple && (
          /* Numeração vertical com bolinha, no canto esquerdo — igual à
             referência: ativa preenchida, inativas só o contorno. */
          <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 sm:left-5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Ir para o banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-bold tabular-nums transition-colors",
                  i === index
                    ? "bg-background text-foreground shadow"
                    : "border border-white/35 text-white/45 hover:border-white/60 hover:text-white/70",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BannerSlide({
  banner,
  priority,
  tall = false,
  active,
  stacked,
}: {
  banner: Banner;
  priority: boolean;
  tall?: boolean;
  active: boolean;
  stacked: boolean;
}) {
  const img = (
    <picture>
      {banner.mobile_image_url && (
        <source media="(max-width: 640px)" srcSet={banner.mobile_image_url} />
      )}
      <img
        src={banner.image_url}
        alt={banner.title || "Banner promocional"}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        // @ts-expect-error fetchpriority ainda não está nos tipos do React, mas é suportado pelos navegadores
        fetchpriority={priority ? "high" : "low"}
        className={cn(
          "block w-full object-cover",
          tall ? "h-[460px] sm:h-[570px] md:h-[660px] lg:h-[750px]" : "h-[220px] sm:h-auto",
        )}
      />
    </picture>
  );

  const wrapper = cn(
    "block w-full transition-opacity duration-700 ease-in-out",
    stacked && "absolute inset-0",
    active ? "opacity-100" : "pointer-events-none opacity-0",
  );

  if (banner.link_url) {
    const external = /^https?:\/\//i.test(banner.link_url);
    return (
      <a
        href={banner.link_url}
        target={banner.new_tab ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={wrapper}
      >
        {img}
      </a>
    );
  }
  return <div className={wrapper}>{img}</div>;
}
