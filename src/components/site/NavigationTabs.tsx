import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Taxonomy } from "@/lib/catalog";
import { TaxonomyBadgeRow } from "@/components/site/TaxonomyBadgeRow";
import { ProductScroller } from "@/components/site/ProductScroller";

type Category = { slug: string; label: string; image: string };

// Altura reservada pra fileira que "salta" pra fora da faixa (categoria).
// Fica fixa e igual pra qualquer aba ativa, pra faixa nunca mudar de
// altura ao trocar de aba — só a fileira de categoria usa essa margem
// negativa pra realmente aparecer saltando por fora.
const JUMP_OUT_CLASS = "pb-[236px] sm:pb-[380px] lg:pb-[354px]";
const JUMP_OUT_NEGATIVE_CLASS = "-mt-[236px] sm:-mt-[380px] lg:-mt-[354px]";

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function NavigationTabs({
  categories,
  leagues,
  clubsNacionais,
  clubsEuropeus,
  countries,
}: {
  categories: Category[];
  leagues: Taxonomy[];
  clubsNacionais: Taxonomy[];
  clubsEuropeus: Taxonomy[];
  countries: Taxonomy[];
}) {
  const tabs = [
    { key: "categoria", label: "Categoria", enabled: categories.length > 0 },
    { key: "liga", label: "Liga", enabled: leagues.length > 0 },
    { key: "time", label: "Time", enabled: clubsNacionais.length + clubsEuropeus.length > 0 },
    { key: "selecao", label: "Seleção", enabled: countries.length > 0 },
  ].filter((t) => t.enabled);

  const [active, setActive] = useState(tabs[0]?.key);
  const [teamRegion, setTeamRegion] = useState<"nacional" | "europeu">(
    clubsNacionais.length > 0 ? "nacional" : "europeu",
  );

  if (tabs.length === 0) return null;

  const isCategoria = active === "categoria";
  const hasBothRegions = clubsNacionais.length > 0 && clubsEuropeus.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-0 sm:px-6">
      {/* Barra em degradê azul, com textura granulada sutil por trás — sem cantos arredondados no
          mobile pra encostar de ponta a ponta na tela. A altura (pt + pb) é sempre a mesma,
          não importa qual aba está ativa — só a categoria usa a margem negativa abaixo pra
          saltar pra fora visualmente. */}
      <div
        className={cn(
          "relative overflow-hidden rounded-none px-4 pt-6 text-center sm:rounded-2xl sm:px-6",
          JUMP_OUT_CLASS,
        )}
        style={{
          background:
            "linear-gradient(120deg, #0a1a33 0%, #123a6b 45%, #1e5aa8 75%, #123a6b 100%)",
        }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] mix-blend-overlay"
        >
          <filter id="nav-tabs-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#nav-tabs-grain)" />
        </svg>

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Navegue por</p>
          <p className="mt-1 font-display text-2xl text-white">Encontre seu time</p>

          <div className="mt-4 inline-flex gap-1.5 rounded-full bg-white/10 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-white/75 hover:text-white",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Liga, Time e Seleção ficam dentro da própria barra, com uma
              transição suave (framer motion) ao trocar de aba. */}
          <AnimatePresence mode="wait">
            {active === "liga" && (
              <motion.div
                key="liga"
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-6"
              >
                <TaxonomyBadgeRow items={leagues} paramKey="liga" />
              </motion.div>
            )}

            {active === "time" && (
              <motion.div
                key="time"
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-6 space-y-4"
              >
                {hasBothRegions && (
                  <div className="inline-flex gap-6 text-sm font-semibold uppercase tracking-wide">
                    <button
                      type="button"
                      onClick={() => setTeamRegion("nacional")}
                      className={cn(
                        "relative pb-1 transition-colors",
                        teamRegion === "nacional" ? "text-white" : "text-white/50 hover:text-white/80",
                      )}
                    >
                      Nacionais
                      {teamRegion === "nacional" && (
                        <motion.span
                          layoutId="team-region-underline"
                          className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-primary"
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamRegion("europeu")}
                      className={cn(
                        "relative pb-1 transition-colors",
                        teamRegion === "europeu" ? "text-white" : "text-white/50 hover:text-white/80",
                      )}
                    >
                      Europeus
                      {teamRegion === "europeu" && (
                        <motion.span
                          layoutId="team-region-underline"
                          className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {teamRegion === "nacional" && clubsNacionais.length > 0 ? (
                    <motion.div
                      key="time-nacional"
                      variants={tabContentVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <TaxonomyBadgeRow items={clubsNacionais} paramKey="time" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="time-europeu"
                      variants={tabContentVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <TaxonomyBadgeRow items={clubsEuropeus} paramKey="time" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {active === "selecao" && (
              <motion.div
                key="selecao"
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-6"
              >
                <TaxonomyBadgeRow items={countries} paramKey="selecao" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categoria "salta" pra fora da barra */}
      <AnimatePresence>
        {isCategoria && (
          <motion.div
            key="categoria-jump-out"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={JUMP_OUT_NEGATIVE_CLASS}
          >
            <ProductScroller variant="onDark" edgeGutter>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/catalogo"
                  search={{ categoria: c.slug }}
                  className="group block w-[46%] shrink-0 snap-start sm:w-[42%] lg:w-[23%]"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl shadow-xl">
                    <img
                      src={c.image}
                      alt={c.label}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="surface-card -mt-1 flex items-center justify-between gap-2 rounded-b-2xl px-4 py-3">
                    <p className="font-headline truncate uppercase leading-none">{c.label}</p>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                      Ver <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </ProductScroller>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
