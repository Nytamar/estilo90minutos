import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fileira horizontal com rolagem (touch no celular, setas no desktop).
 * Cada item deve informar sua própria largura via className no wrapper
 * (veja o uso em produto.$slug.tsx) — este componente só cuida do scroll.
 */
export function ProductScroller({ children }: { children: ReactNode }) {
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
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Ver anteriores"
          onClick={() => scrollByAmount(-1)}
          className={cn(
            "absolute left-0 top-1/2 hidden -translate-y-1/2 -translate-x-1/2 items-center justify-center",
            "h-10 w-10 rounded-full bg-background shadow-lg ring-1 ring-border",
            "transition-opacity md:flex hover:bg-accent",
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Ver mais"
          onClick={() => scrollByAmount(1)}
          className={cn(
            "absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center",
            "h-10 w-10 rounded-full bg-background shadow-lg ring-1 ring-border",
            "transition-opacity md:flex hover:bg-accent",
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
