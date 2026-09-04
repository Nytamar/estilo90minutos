import { useEffect, useState } from "react";
import { X, Instagram } from "lucide-react";
import { siteConfig } from "@/config/site";

const STORAGE_KEY = "ig-follow-popup-seen";
const DELAY_MS = 2500;

/**
 * Aparece uma única vez por visitante (guardado no navegador), com um
 * pequeno atraso pra não "estourar" assim que a página abre.
 */
export function InstagramFollowPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Siga a gente no Instagram"
      onClick={close}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-fade-up"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-card relative w-full max-w-sm rounded-2xl p-7 text-center"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={close}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full"
          style={{ background: "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)" }}
        >
          <Instagram className="h-7 w-7 text-white" />
        </div>

        <p className="font-display text-2xl">Siga o Estilo 90 Minutos</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Lançamentos, promoções e bastidores em primeira mão no nosso Instagram.
        </p>
        <p className="mt-1 text-sm font-medium text-primary">{siteConfig.instagramHandle}</p>

        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noreferrer"
          onClick={close}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Instagram className="h-4 w-4" />
          Seguir no Instagram
        </a>
        <button
          type="button"
          onClick={close}
          className="mt-2 w-full py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
