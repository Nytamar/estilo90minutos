import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/banners";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const total = banners.length;
  const multiple = total > 1;

  // Com mais de 1 banner, adicionamos um clone do último no início e um
  // clone do primeiro no fim. Isso permite "avançar" ou "voltar" sem
  // nunca precisar pular de volta ao índice 0 de forma visível — o pulo
  // acontece só entre os clones, sem transição, então ninguém percebe.
  const slides = multiple ? [banners[total - 1], ...banners, banners[0]] : banners;
  const [index, setIndex] = useState(multiple ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragPx, setDragPx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!multiple || paused) return;
    const id = window.setInterval(() => setIndex((i) => i + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [multiple, paused]);

  if (total === 0) return null;

  const go = (dir: number) => setIndex((i) => i + dir);

  // Ao terminar a transição, se paramos num clone, "teletransporta"
  // (sem animação) para o slide real correspondente.
  function handleTransitionEnd() {
    if (!multiple) return;
    if (index === 0) {
      setWithTransition(false);
      setIndex(total);
    } else if (index === total + 1) {
      setWithTransition(false);
      setIndex(1);
    }
  }