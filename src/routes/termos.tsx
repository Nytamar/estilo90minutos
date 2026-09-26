import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: `Termos de Uso — ${siteConfig.name}` },
      {
        name: "description",
        content: `Regras de uso do site e condições de pedido da ${siteConfig.name}.`,
      },
      { property: "og:title", content: `Termos de Uso — ${siteConfig.name}` },
      { property: "og:description", content: "Condições de uso do catálogo e dos pedidos." },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-14 text-muted-foreground sm:px-6">
      <h1 className="text-4xl text-foreground">Termos de Uso</h1>
      <p>
        Ao navegar neste site você concorda com os termos abaixo. A {siteConfig.name} funciona como
        catálogo: os pedidos são concluídos por atendimento no WhatsApp.
      </p>
      <h2 className="pt-4 text-2xl text-foreground">Preços e disponibilidade</h2>
      <p>
        Preços e estoque podem ser alterados sem aviso prévio. A confirmação do pedido ocorre
        somente após o atendimento no WhatsApp.
      </p>
      <h2 className="pt-4 text-2xl text-foreground">Trocas e devoluções</h2>
      <p>
        Aceitamos trocas por defeito de fabricação ou tamanho em até 7 dias após o recebimento,
        conforme o Código de Defesa do Consumidor, com o produto sem uso e com etiqueta.
      </p>
      <h2 className="pt-4 text-2xl text-foreground">Propriedade intelectual</h2>
      <p>
        Marcas e escudos exibidos pertencem aos respectivos clubes e federações e são utilizados
        apenas para identificação dos produtos.
      </p>
    </article>
  );
}
