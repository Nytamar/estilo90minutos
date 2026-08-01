import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-sidebar">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <span className="font-display text-2xl gold-text">{siteConfig.name}</span>
          <p className="mt-3 text-sm text-muted-foreground">{siteConfig.description}</p>
          <div className="mt-4 flex items-center gap-3 text-muted-foreground">
            <a href={siteConfig.instagram} aria-label="Instagram" className="hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={buildWhatsAppContactLink("Olá! Vim pelo site.")}
              aria-label="WhatsApp"
              className="hover:text-primary"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg">Loja</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/catalogo" className="hover:text-primary">
                Catálogo completo
              </Link>
            </li>
            <li>
              <Link to="/favoritos" className="hover:text-primary">
                Meus favoritos
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-primary">
                Sobre a loja
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-primary">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg">Institucional</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/privacidade" className="hover:text-primary">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link to="/termos" className="hover:text-primary">
                Termos de Uso
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {siteConfig.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {siteConfig.city}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg">Newsletter</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Receba lançamentos e promoções antes de todo mundo.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
