import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banners";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;
  const multiple = total > 1;

  useEffect(() => {
    if (!multiple || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [multiple, paused, total]);

  if (total === 0) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + total) % total);

  return (
    <section
      className="relative w-full overflow-hidden bg-secondary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((b, i) => (
          <BannerSlide key={b.id} banner={b} priority={i === 0} />
        ))}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70 text-foreground opacity-70 shadow-sm backdrop-blur transition hover:opacity-100 sm:left-5 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/70 text-foreground opacity-70 shadow-sm backdrop-blur transition hover:opacity-100 sm:right-5 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Ir para o banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full bg-foreground/30 transition-all",
                  i === index ? "w-6 bg-primary" : "w-2.5 hover:bg-foreground/50",
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
