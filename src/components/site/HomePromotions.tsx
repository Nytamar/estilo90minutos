import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomePromotion } from "@/lib/home-promotions";

export function HomePromotions({
  promotions,
}: {
  promotions: HomePromotion[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div className="relative">

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

        {/* CARDS */}
        <div
          ref={scrollRef}
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
      </div>
    </section>
  );
}
