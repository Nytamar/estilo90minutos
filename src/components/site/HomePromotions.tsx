import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { HomePromotion } from "@/lib/home-promotions";

// Antes esses cards viviam num carrossel horizontal (scroll com snap).
// Agora eles formam a fileira que flutua por cima da borda inferior do
// hero (a seção que os envolve, em routes/index.tsx, aplica a margem
// negativa) — por isso viram um grid simples, sempre visível de uma vez,
// sem seta nem scroll: no mobile empilha em coluna única, do sm pra cima
// vira um grid de 2 colunas, e no lg abre pra 3 — acomodando bem tanto
// poucos banners quanto vários.
export function HomePromotions({ promotions }: { promotions: HomePromotion[] }) {
  if (promotions.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto -mt-20 w-full max-w-7xl px-4 pb-6 sm:-mt-24 sm:px-6 lg:-mt-28">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promotion, i) => (
          <PromotionCard key={promotion.id} promotion={promotion} index={i} />
        ))}
      </div>
    </section>
  );
}

function PromotionCard({
  promotion,
  index,
}: {
  promotion: HomePromotion;
  index: number;
}) {
  const content = (
    <picture className="block h-full w-full">
      {promotion.mobile_image_url && (
        <source media="(max-width: 640px)" srcSet={promotion.mobile_image_url} />
      )}
      <img
        src={promotion.image_url}
        alt={promotion.title || "Novidade"}
        loading="lazy"
        draggable={false}
        className="block h-full w-full select-none object-cover"
      />
    </picture>
  );

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group h-44 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 transition-shadow hover:shadow-2xl sm:h-52 lg:h-60"
    >
      {content}
    </motion.div>
  );

  if (!promotion.link_url) return card;

  const external = /^https?:\/\//i.test(promotion.link_url);

  if (external) {
    return (
      <a
        href={promotion.link_url}
        target={promotion.new_tab ? "_blank" : undefined}
        rel={promotion.new_tab ? "noreferrer" : undefined}
        className="block"
      >
        {card}
      </a>
    );
  }

  return (
    <Link to={promotion.link_url} className="block">
      {card}
    </Link>
  );
}
