import { Link } from "@tanstack/react-router";
import type { HomePromotion } from "@/lib/home-promotions";

export function HomePromotions({
  promotions,
}: {
  promotions: HomePromotion[];
}) {
  if (promotions.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promotion) => {
          const content = (
            <picture className="block overflow-hidden rounded-xl">
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
                className="
                  block
                  aspect-[2.1/1]
                  w-full
                  object-cover
                  transition-transform
                  duration-500
                  hover:scale-[1.02]
                "
              />
            </picture>
          );

          if (!promotion.link_url) {
            return (
              <div key={promotion.id}>
                {content}
              </div>
            );
          }

          const external = /^https?:\/\//i.test(promotion.link_url);

          return external ? (
            <a
              key={promotion.id}
              href={promotion.link_url}
              target={promotion.new_tab ? "_blank" : undefined}
              rel={promotion.new_tab ? "noreferrer" : undefined}
              className="block"
            >
              {content}
            </a>
          ) : (
            <Link
              key={promotion.id}
              to={promotion.link_url}
              className="block"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
