import { useEffect, useState } from "react";

export type Brightness = "light" | "dark";

/**
 * Carrega a imagem, amostra os pixels num canvas pequeno (rápido, não trava
 * a tela) e calcula a luminância média. Se a imagem for clara em média, o
 * texto deve ficar escuro por cima — e vice-versa.
 *
 * Funciona sem problema com imagens do próprio site (mesmo domínio, como
 * /images/hero.jpg). Para imagens de outro domínio (ex.: Supabase Storage),
 * depende do servidor permitir CORS para leitura de pixels — se não permitir,
 * o hook simplesmente mantém o valor padrão (`fallback`) sem quebrar nada.
 */
export function useImageBrightness(src: string | null | undefined, fallback: Brightness = "dark"): Brightness {
  const [brightness, setBrightness] = useState<Brightness>(fallback);

  useEffect(() => {
    if (!src) {
      setBrightness(fallback);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (cancelled) return;
      try {
        const SAMPLE = 32; // amostra pequena só pra tirar a média — não precisa da imagem inteira
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          // luminância perceptual (o olho humano é mais sensível ao verde)
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const average = total / (data.length / 4);
        setBrightness(average > 150 ? "light" : "dark");
      } catch {
        // bloqueado por CORS ou outro erro — mantém o valor padrão
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  return brightness;
}
