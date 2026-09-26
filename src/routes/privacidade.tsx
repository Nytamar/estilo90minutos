import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: `Política de Privacidade — ${siteConfig.name}` },
      {
        name: "description",
        content: `Como a ${siteConfig.name} coleta, usa e protege os dados dos visitantes e clientes.`,
      },
      { property: "og:title", content: `Política de Privacidade — ${siteConfig.name}` },
      { property: "og:description", content: "Nosso compromisso com seus dados pessoais." },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 text-muted-foreground sm:px-6">
      <h1 className="text-4xl text-foreground">Política de Privacidade</h1>
      <p>
        Esta política descreve como a {siteConfig.name} trata os dados pessoais coletados neste
        site, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
      </p>
      <h2 className="pt-4 text-2xl text-foreground">Dados coletados</h2>
      <p>
        Coletamos apenas o e-mail informado voluntariamente na newsletter e as informações enviadas
        por você no atendimento via WhatsApp. Favoritos ficam salvos apenas no seu navegador.
      </p>
      <h2 className="pt-4 text-2xl text-foreground">Uso dos dados</h2>
      <p>
        Utilizamos os dados exclusivamente para responder solicitações, processar pedidos e enviar
        novidades quando autorizado. Não vendemos nem compartilhamos dados com terceiros para fins
        publicitários.
      </p>
      <h2 className="pt-4 text-2xl text-foreground">Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo
        e-mail {siteConfig.email}.
      </p>
    </article>
  );
}
