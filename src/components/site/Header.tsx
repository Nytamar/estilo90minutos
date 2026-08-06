import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search, ShieldCheck, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

const categoryTabs = [
  { slug: "nacionais", label: "Nacionais" },
  { slug: "europeus", label: "Europeus" },
  { slug: "selecoes", label: "Seleções" },
  { slug: "retro", label: "Retrô" },
  { slug: "nba", label: "NBA" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { favorites } = useFavorites();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-lg text-primary-foreground">
            90
          </span>
          <span className="font-display text-xl leading-none tracking-wide gold-text">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Buscar produtos">
            <Link to="/catalogo">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Favoritos">
            <Link to="/favoritos" className="relative">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Painel administrativo">
            <Link to="/admin">
              <ShieldCheck className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border/70 bg-background px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
