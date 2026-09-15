import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Banner } from "@/lib/banners";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

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
 * Nav "flutuante" só pro desktop da home: logo + categorias + busca soltos,
 * cada um num "pill" branco, sobrepostos direto na foto do banner — igual
 * à referência que o cliente mandou (nada de barra sólida por trás).
 */
function OverlayNav() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/catalogo", search: term.trim() ? { q: term.trim() } : {} });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden flex-col items-center gap-3 px-6 pt-5 md:flex">
      <Link
        to="/"
        aria-label={`${siteConfig.name} — Home`}
        className="pointer-events-auto rounded-full bg-background/95 px-5 py-2 shadow-lg backdrop-blur"
      >
        <img src={siteConfig.logo} alt={`${siteConfig.name} logo`} className="h-9 w-auto" />
      </Link>

      <div className="flex w-full max-w-5xl items-center justify-between gap-4">
        <nav className="pointer-events-auto flex items-center gap-6 rounded-full bg-background/95 px-6 py-3 shadow-lg backdrop-blur">
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
              className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
            >
              {c.label}
            </Link>
          ))}
          {extraLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={onSearch}
          className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-full bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur"
        >
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="O que você procura?"
            aria-label="Buscar produtos"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" aria-label="Buscar">
            <Search className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
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

  // Com mais de 1 banner, adicionamos um clone do último no início e um
  // clone do primeiro no fim. Isso permite "avançar" ou "voltar" sem
  // nunca precisar pular de volta ao índice 0 de forma visível — o pulo
  // acontece só entre os clones, sem transição, então ninguém percebe.
  const slides = multiple ? [banners[total - 1], ...banners, banners[0]] : banners;
  const [index, setIndex] = useState(multiple ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragPx, setDragPx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!multiple || paused) return;
    const id = window.setInterval(() => setIndex((i) => i + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [multiple, paused]);

  if (total === 0) return null;

  const go = (dir: number) => setIndex((i) => i + dir);

  // Ao terminar a transição, se paramos num clone, "teletransporta"
  // (sem animação) para o slide real correspondente.
  function handleTransitionEnd() {
    if (!multiple) return;
    if (index === 0) {
      setWithTransition(false);
      setIndex(total);
    } else if (index === total + 1) {
      setWithTransition(false);
      setIndex(1);
    }
  }

  // Reativa a transição no próximo frame, depois do "teletransporte" acima.
  useEffect(() => {
    if (withTransition) return;
    const raf = requestAnimationFrame(() => setWithTransition(true));
    return () => cancelAnimationFrame(raf);
  }, [withTransition]);

  const activeDot = !multiple ? 0 : index === 0 ? total - 1 : index === total + 1 ? 0 : index - 1;

  // --- Arrastar com o dedo no celular ---
  function onTouchStart(e: React.TouchEvent) {
    if (!multiple) return;
    touchStartX.current = e.touches[0].clientX;
    dragging.current = true;
    setPaused(true);
    setWithTransition(false); // segue o dedo 1:1, sem "atraso" de animação
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current || touchStartX.current === null) return;
    setDragPx(e.touches[0].clientX - touchStartX.current);
  }

  function onTouchEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    touchStartX.current = null;
    setPaused(false);

    const width = containerRef.current?.clientWidth ?? 1;
    const threshold = width * 0.15; // arrastou mais de 15% da largura → troca de slide
    setWithTransition(true);
    if (dragPx > threshold) go(-1);
    else if (dragPx < -threshold) go(1);
    setDragPx(0);
  }

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
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden bg-secondary",
          fullBleed ? "rounded-none" : "rounded-[1.75rem]",
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
      {overlayNav && <OverlayNav />}
      <div
        className="flex ease-out"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragPx}px))`,
          transition: withTransition ? "transform 700ms ease-out" : "none",
          touchAction: "pan-y",
        }}
        onTransitionEnd={handleTransitionEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {slides.map((b, i) => (
          <BannerSlide
            key={`${b.id}-${i}`}
            banner={b}
            priority={i === (multiple ? 1 : 0)}
            tall={fullBleed}
          />
        ))}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Banner anterior"
            className={cn(
              "absolute top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/15 text-white/70 opacity-60 transition hover:bg-black/30 hover:opacity-100 sm:h-9 sm:w-9",
              fullBleed ? "left-3 sm:left-16" : "left-2 sm:left-4",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo banner"
            className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/15 text-white/70 opacity-60 transition hover:bg-black/30 hover:opacity-100 sm:right-4 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {fullBleed ? (
            /* Numeração vertical no canto esquerdo — igual à referência.
               Fica encostada na borda, empilhada de cima a baixo. */
            <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 sm:left-5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Ir para o banner ${i + 1}`}
                  onClick={() => setIndex(i + 1)}
                  className={cn(
                    "text-sm font-bold tabular-nums transition-colors",
                    i === activeDot ? "text-primary" : "text-white/50 hover:text-white/80",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Ir para o banner ${i + 1}`}
                  onClick={() => setIndex(i + 1)}
                  className={cn(
                    "h-1.5 rounded-full bg-foreground/30 transition-all",
                    i === activeDot ? "w-6 bg-primary" : "w-2.5 hover:bg-foreground/50",
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </section>
  );
}

function BannerSlide({
  banner,
  priority,
  tall = false,
}: {
  banner: Banner;
  priority: boolean;
  tall?: boolean;
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
          tall ? "h-[420px] sm:h-[520px] md:h-[600px] lg:h-[680px]" : "h-[220px] sm:h-auto",
        )}
      />
    </picture>
  );

  const wrapper = "block w-full shrink-0";

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
