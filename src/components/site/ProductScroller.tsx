import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Fileira horizontal com rolagem (touch no celular, setas no desktop).
 * Cada item deve informar sua própria largura via className no wrapper
 * (veja o uso em produto.$slug.tsx) — este componente só cuida do scroll.
 *
 * `variant="onDark"` é usado quando a fileira fica dentro da faixa azul
 * (Encontre seu time): a seta ganha a cor primária e um respiro maior pra
 * fora da borda, como se estivesse "saindo" da faixa, com uma pulsação
 * bem sutil pra chamar atenção sem ser invasiva.
 */
export function ProductScroller({
  children,
  variant = "light",
  edgeGutter = false,
}: {
  children: ReactNode;
  /** "light" = setas brancas padrão. "onDark" = setas com destaque, pra usar sobre fundos coloridos. */
  variant?: "light" | "onDark";
  /** Quando true, reserva um respiro à esquerda antes do primeiro item (usado no card de Categoria). */
  edgeGutter?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Quando tudo cabe na tela (nada pra rolar pros dois lados), fica mais
  // bonito centralizado em vez de "grudado" na esquerda.
  const [fitsWithoutScroll, setFitsWithoutScroll] = useState(false);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setFitsWithoutScroll(el.scrollWidth <= el.clientWidth + 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [children]);

  function scrollByAmount(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85 * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  const onDark = variant === "onDark";

  return (
    <div className="group/scroller relative">
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          fitsWithoutScroll && "justify-center",
        )}
      >
        {edgeGutter && <div aria-hidden className="w-2 shrink-0 sm:w-6" />}
        {children}
      </div>

      {/* Dica bem sutil no mobile: gradiente + pontinha da seta encostando
          na borda da tela, indicando que dá pra rolar mais pro lado. */}
      {canScrollRight && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-0 top-0 h-full w-10 sm:hidden",
            onDark
              ? "bg-gradient-to-l from-[#0a1a33]/70 to-transparent"
              : "bg-gradient-to-l from-background/90 to-transparent",
          )}
        >
          <motion.span
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute right-1.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full",
              onDark ? "bg-primary text-primary-foreground" : "bg-foreground/80 text-background",
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.span>
        </div>
      )}

      {canScrollLeft && (
        <motion.button
          type="button"
          aria-label="Ver anteriores"
          onClick={() => scrollByAmount(-1)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center",
            "h-10 w-10 rounded-full shadow-lg transition-colors md:flex",
            onDark
              ? "-translate-x-[60%] bg-primary text-primary-foreground hover:bg-primary/90"
              : "-translate-x-1/2 bg-background ring-1 ring-border hover:bg-accent",
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      )}
      {canScrollRight && (
        <motion.button
          type="button"
          aria-label="Ver mais"
          onClick={() => scrollByAmount(1)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          animate={onDark ? { x: [0, 3, 0] } : undefined}
          transition={onDark ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
          className={cn(
            "absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center",
            "h-10 w-10 rounded-full shadow-lg transition-colors md:flex",
            onDark
              ? "translate-x-[60%] bg-primary text-primary-foreground hover:bg-primary/90"
              : "translate-x-1/2 bg-background ring-1 ring-border hover:bg-accent",
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}
