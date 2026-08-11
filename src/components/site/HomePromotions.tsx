import { useRef } from "react";
import { Link } from "@tanstack/react-router";
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
            className="
              absolute
              left-2
              top-1/2
              z-20
              hidden
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-border/60
              bg-white/95
              text-xl
              shadow-md
              backdrop-blur-sm
              transition
              hover:scale-105
              lg:flex
            "
          >
            ‹
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
                  shrink-0
                  snap-start
                  overflow-hidden
                  rounded-xl
                  border
                  border-border/50
                  bg-card
                  shadow-sm

                  /* MOBILE */
                  w-[78vw]

                  /* TABLET */
                  sm:w-[55vw]

                  /* DESKTOP */
                  lg:w-[calc((100%_-_2rem)/3)]
                "
              >
                {content}
              </div>
            );

            if (!promotion.link_url) {
              return (
                <div key={promotion.id}>
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
                  className="block"
                >
                  {card}
                </a>
              );
            }

            return (
              <Link
                key={promotion.id}
                to={promotion.link_url}
                className="block"
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
            className="
              absolute
              right-2
              top-1/2
              z-20
              hidden
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-border/60
              bg-white/95
              text-xl
              shadow-md
              backdrop-blur-sm
              transition
              hover:scale-105
              lg:flex
            "
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
