import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Taxonomy } from "@/lib/catalog";
import { TaxonomyBadgeRow } from "@/components/site/TaxonomyBadgeRow";
import { ProductScroller } from "@/components/site/ProductScroller";

type Category = { slug: string; label: string; image: string };

// Altura fixa da área abaixo das abas — SEMPRE a mesma, pras 4 abas, tanto
// pra caber a fileira de Categoria "saltando" pra fora quanto pros escudos
// de Liga/Time/Seleção, que ficam centralizados dentro dela.
// Antes isso era feito com padding-bottom, mas o conteúdo dos escudos
// (que fica DENTRO da faixa) somava altura em cima do padding e a faixa
// ainda mudava de tamanho — por isso agora é uma altura fixa de verdade.
const RESERVED_HEIGHT_CLASS = "h-[236px] sm:h-[380px] lg:h-[354px]";
const RESERVED_NEGATIVE_CLASS = "-mt-[236px] sm:-mt-[380px] lg:-mt-[354px]";

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Indicador (traço) de "Nacionais" / "Europeus": em vez do truque de
// layoutId compartilhado entre dois elementos que são desmontados e
// remontados a cada clique (o que deixava a transição com uma "mola"
// estranha e, combinado com a troca de aba, podia corromper o cálculo
// de layout do framer-motion), medimos a posição real dos botões e
// deslizamos um único traço sempre montado — simples, previsível e sem
// depender de unmount/remount pra animar.
function TeamRegionToggle({
  teamRegion,
  setTeamRegion,
}: {
  teamRegion: "nacional" | "europeu";
  setTeamRegion: (r: "nacional" | "europeu") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nacionalRef = useRef<HTMLButtonElement>(null);
  const europeuRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; width: number } | null>(null);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      const btn = teamRegion === "nacional" ? nacionalRef.current : europeuRef.current;
      if (!container || !btn) return;
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicator({ x: btnRect.left - containerRect.left, width: btnRect.width });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [teamRegion]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex gap-6 text-sm font-semibold uppercase tracking-wide"
    >
      <button
        ref={nacionalRef}
        type="button"
        onClick={() => setTeamRegion("nacional")}
        className={cn(
          "relative pb-1 transition-colors",
          teamRegion === "nacional" ? "text-white" : "text-white/50 hover:text-white/80",
        )}
      >
        Nacionais
      </button>
      <button
        ref={europeuRef}
        type="button"
        onClick={() => setTeamRegion("europeu")}
        className={cn(
          "relative pb-1 transition-colors",
          teamRegion === "europeu" ? "text-white" : "text-white/50 hover:text-white/80",
        )}
      >
        Europeus
      </button>
      {indicator && (
        <motion.span
          className="absolute -bottom-0.5 h-0.5 rounded-full bg-primary"
          initial={false}
          animate={{ x: indicator.x, width: indicator.width }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

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
      {/* Barra em degradê azul — a altura (topo + área reservada fixa abaixo) é
          sempre a mesma, não importa qual aba está ativa. */}
      <div
        className="relative overflow-hidden rounded-none px-4 pt-6 text-center sm:rounded-2xl sm:px-6"
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
        </div>

        {/* Área reservada: altura fixa, sempre igual. Pra Categoria fica vazia
            (as cartas dela "saltam" por fora, num bloco separado logo abaixo).
            Pras outras abas, o conteúdo fica centralizado aqui dentro. */}
        <div className={cn("relative mx-auto flex max-w-full flex-col items-center justify-center", RESERVED_HEIGHT_CLASS)}>
          {/* Antes cada aba (liga/time/selecao) era um filho separado dentro de
              um AnimatePresence com mode="wait": a nova aba só entrava depois
              da anterior terminar de sair. Se o usuário trocasse de aba de
              novo enquanto essa saída ainda estava em andamento (bem comum
              ao navegar rápido), o framer-motion podia perder a referência
              do elemento que estava saindo e travar o próximo com
              opacidade 0 pra sempre — os escudos "somem" e só um reload
              limpa o estado. Agora é um único filho, identificado pela aba
              ativa, sem "wait": a entrada e a eventual saída acontecem em
              paralelo, então não existe uma saída pendente pra travar.  */}
          {/* mode="popLayout": o elemento que está saindo é tirado do fluxo
              (position: absolute) assim que a saída começa, em vez de ficar
              ocupando espaço ao lado do que está entrando — sem isso, os
              dois ficavam empilhados por uma fração de segundo e dava um
              "pulo" de layout, o que fazia a troca parecer seca mesmo com
              fade. Com popLayout o crossfade fica no lugar certo e mais
              lento/suave, e continua sem "esperar" a saída terminar (por
              isso não reintroduz o bug dos escudos sumindo). */}
          <AnimatePresence initial={false} mode="popLayout">
            {active !== "categoria" && (
              <motion.div
                key={active}
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full space-y-4"
              >
                {active === "liga" && <TaxonomyBadgeRow items={leagues} paramKey="liga" />}

                {active === "time" && (
                  <>
                    {hasBothRegions && (
                      <TeamRegionToggle teamRegion={teamRegion} setTeamRegion={setTeamRegion} />
                    )}
                    {teamRegion === "nacional" && clubsNacionais.length > 0 ? (
                      <TaxonomyBadgeRow items={clubsNacionais} paramKey="time" />
                    ) : (
                      <TaxonomyBadgeRow items={clubsEuropeus} paramKey="time" />
                    )}
                  </>
                )}

                {active === "selecao" && <TaxonomyBadgeRow items={countries} paramKey="selecao" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categoria "salta" pra fora da barra — usa a mesma altura reservada
          acima como margem negativa, então sobe exatamente até onde a área
          reservada começa, nunca mais nem menos. */}
      <AnimatePresence>
        {isCategoria && (
          <motion.div
            key="categoria-jump-out"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={RESERVED_NEGATIVE_CLASS}
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
