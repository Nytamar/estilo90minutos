import { Link } from "@tanstack/react-router";
import type { HomePromotion } from "@/lib/home-promotions";

export function HomePromotions({
  promotions,
}: {
  promotions: HomePromotion[];
}) {
  if (promotions.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
      <div
        className="
          flex
          gap-4
          overflow-x-auto
          overscroll-x-contain
          pb-2
          snap-x
          snap-mandatory
          touch-pan-x
          scrollbar-none
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
                  object-cover
                  transition-transform
                  duration-300
                  group-hover:scale-[1.015]
                "
              />
            </picture>
          );

          const card = (
            <div
              className="
                group
                w-[88vw]
                shrink-0
                snap-center
                overflow-hidden
                rounded-xl
                border
                border-border/50
                bg-card
                shadow-sm
                sm:w-[520px]
                lg:w-[calc((100vw-7rem)/3)]
                lg:max-w-[420px]
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
            promotion.link_url,
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
    </section>
  );
}
