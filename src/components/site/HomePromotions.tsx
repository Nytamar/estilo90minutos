import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { HomePromotion } from "@/lib/home-promotions";

export function HomePromotions({
  promotions,
}: {
  promotions: HomePromotion[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateCanScrollRight() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateCanScrollRight();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => updateCanScrollRight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [promotions]);

  if (promotions.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const amount = scrollRef.current.clientWidth * 0.85;

    scrollRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
      {/* -mx-4 cancela o padding do <section> no mobile, então esta fileira
          encosta de ponta a ponta na tela; no desktop (sm:mx-0) o respiro
          do container volta normalmente. */}
      <div className="relative -mx-4 sm:mx-0">

        {/* SETA ESQUERDA - DESKTOP */}
        {promotions.length > 3 && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Novidades anteriores"
            className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-lg ring-1 ring-border transition-opacity hover:bg-accent md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* CARDS — sem padding próprio: no mobile os cards encostam de
            ponta a ponta na tela, só a pontinha do próximo aparece na
            borda; no desktop ficam contidos pelo padding do <section>. */}
        <div
          ref={scrollRef}
          onScroll={updateCanScrollRight}
          className="
            flex
            gap-4
            overflow-x-auto
            overscroll-x-contain
            scroll-smooth
            snap-x
            snap-mandatory
            touch-pan-x
            pb-2
            scrollbar-none
            cursor-grab
            active:cursor-grabbing
          "
        >
          {promotions.map((promotion) => {
            const cardWrapperClass = `
              flex-none
              snap-start
              w-[78vw]
              sm:w-[55vw]
              lg:w-[calc((100%_-_2rem)/3)]
            `;

            const content = (
              <picture className="block">
                {promotion.mobile_image_url && (
                  <source
                    media="(max-width: 640px)"
                    srcSet={promotion.mobile_image_url}
                  />
                )}

                <img
                 src={promotion.image_url}
                 alt={promotion.title || "Novidade"}
                 loading="lazy"
                 draggable={false}
                 className="
                   block
                   h-auto
                   w-full
                   select-none
                  "
                />
              </picture>
            );

            const card = (
              <div
                className="
                  group
                  w-full
                  overflow-hidden
                  rounded-xl
                  border
                  border-border/50
                  bg-card
                  shadow-sm
                "
              >
                {content}
              </div>
            );

            if (!promotion.link_url) {
              return (
                <div key={promotion.id} className={cardWrapperClass}>
                  {card}
                </div>
              );
            }

            const external = /^https?:\/\//i.test(
              promotion.link_url
            );

            if (external) {
              return (
                <a
                  key={promotion.id}
                  href={promotion.link_url}
                  target={
                    promotion.new_tab ? "_blank" : undefined
                  }
                  rel={
                    promotion.new_tab ? "noreferrer" : undefined
                  }
                  className={cardWrapperClass}
                >
                  {card}
                </a>
              );
            }

            return (
              <Link
                key={promotion.id}
                to={promotion.link_url}
                className={cardWrapperClass}
              >
                {card}
              </Link>
            );
          })}
        </div>

        {/* SETA DIREITA - DESKTOP */}
        {promotions.length > 3 && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Próximas novidades"
            className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-background shadow-lg ring-1 ring-border transition-opacity hover:bg-accent md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Dica bem sutil no mobile de que dá pra rolar mais pro lado */}
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:hidden"
          >
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-foreground/80 text-background"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.span>
          </div>
        )}
      </div>
    </section>
  );
}
