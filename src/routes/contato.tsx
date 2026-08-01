import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: `Contato — ${siteConfig.name}` },
      {
        name: "description",
        content: `Fale com a ${siteConfig.name} pelo WhatsApp ou e-mail. Tire dúvidas sobre camisas, tamanhos e entregas.`,
      },
      { property: "og:title", content: `Contato — ${siteConfig.name}` },
      { property: "og:description", content: "Canais de atendimento da loja." },
    ],
  }),
  component: Contato,
});

function Contato() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const link = buildWhatsAppContactLink(
    `Olá! Meu nome é ${name || "(sem nome)"}.\n\n${message || "Gostaria de mais informações."}`,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl">Contato</h1>
      <p className="mt-3 text-muted-foreground">
        Preencha os campos e envie sua mensagem direto no nosso WhatsApp.
      </p>

      <form
        className="surface-card mt-8 space-y-4 rounded-2xl p-6"
        onSubmit={(e) => {
          e.preventDefault();
          window.open(link, "_blank", "noopener");
        }}
      >
        <div>
          <Label htmlFor="nome">Seu nome</Label>
          <Input id="nome" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="msg">Mensagem</Label>
          <Textarea
            id="msg"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          <MessageCircle className="mr-2 h-5 w-5" /> Enviar pelo WhatsApp
        </Button>
      </form>

      <div className="mt-8 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> {siteConfig.email}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> {siteConfig.city}
        </p>
      </div>
    </div>
  );
}
