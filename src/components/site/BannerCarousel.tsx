import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banners";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
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
      ref={containerRef}
      className="relative w-full overflow-hidden bg-secondary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
    >
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
          <BannerSlide key={`${b.id}-${i}`} banner={b} priority={i === (multiple ? 1 : 0)} />
        ))}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Banner anterior"
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/15 text-white/70 opacity-60 transition hover:bg-black/30 hover:opacity-100 sm:left-4 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo banner"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/15 text-white/70 opacity-60 transition hover:bg-black/30 hover:opacity-100 sm:right-4 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

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
        </>
      )}
    </section>
  );
}

function BannerSlide({ banner, priority }: { banner: Banner; priority: boolean }) {
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
        className="block h-auto w-full"
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
