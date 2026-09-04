import { createFileRoute } from "@tanstack/react-router";
import { Award, Heart, Truck } from "lucide-react";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: `Sobre a ${siteConfig.name} — Nossa história` },
      {
        name: "description",
        content: `Conheça a ${siteConfig.name}: loja de camisas de futebol com curadoria de mantos nacionais, europeus, seleções e retrô.`,
      },
      { property: "og:title", content: `Sobre a ${siteConfig.name}` },
      { property: "og:description", content: "A história e os valores da nossa loja de camisas." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl">Sobre a {siteConfig.name}</h1>
      <p className="mt-5 text-muted-foreground">
        Nascemos da paixão pelo futebol e pelo detalhe. Cada manto do nosso catálogo passa por uma
        curadoria cuidadosa: tecido, acabamento, escudo e caimento. Trabalhamos com camisas
        nacionais, europeias, seleções e a linha retrô que faz qualquer torcedor voltar no tempo.
      </p>
      <p className="mt-4 text-muted-foreground">
        Nosso atendimento é direto pelo WhatsApp, sem burocracia: você escolhe a camisa, o tamanho e
        a quantidade, e nós cuidamos do resto — do pagamento ao envio para todo o Brasil.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Award, title: "Curadoria", desc: "Só entra no catálogo o que a gente vestiria." },
          { icon: Heart, title: "Atendimento", desc: "Conversa direta, sem robô." },
          { icon: Truck, title: "Entrega", desc: "Enviamos para todo o país." },
        ].map((i) => (
          <div key={i.title} className="surface-card rounded-xl p-5">
            <i.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 font-display text-xl">{i.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
