import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/catalog";
import type { HomeTickerMessage } from "@/lib/home-ticker";

type TickerItem = {
  id: string;
  text: string;
  link?: string;
  newTab?: boolean;
};

export function HomeTicker({
  products,
  messages,
}: {
  products: Product[];
  messages: HomeTickerMessage[];
}) {
  const latestProducts: TickerItem[] = products
    .slice(0, 6)
    .map((product) => ({
      id: `product-${product.id}`,
      text: `NOVA PEÇA: ${product.name}`,
      link: `/produto/${product.slug}`,
    }));

  const customMessages: TickerItem[] = messages.map(
    (message) => ({
      id: `message-${message.id}`,
      text: message.text,
      link: message.link_url ?? undefined,
      newTab: message.new_tab,
    }),
  );

  const items = [
    ...latestProducts,
    ...customMessages,
  ];

  if (items.length === 0) return null;

  /*
   * Duplicamos o conteúdo para criar uma animação
   * contínua, sem aparecer espaço vazio quando
   * a primeira sequência termina.
   */
  const tickerItems = [...items, ...items];

  return (
    <div className="home-ticker w-full overflow-hidden bg-[#10325B]">
      <div
        className="
          home-ticker-track
          flex
          w-max
          items-center
          whitespace-nowrap
          py-4
          hover:[animation-play-state:paused]
        "
      >
        {tickerItems.map((item, index) => {
          const content = (
            <span
              className="
                inline-flex
                items-center
                justify-center
                gap-8
                px-8
                text-sm
                font-semibold
                uppercase
                tracking-[0.14em]
                text-primary-foreground
                sm:text-base
              "
            >
              <span>{item.text}</span>

              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center text-primary-foreground/70"
              >
                •
              </span>
            </span>
          );

          const key = `${item.id}-${index}`;

          /*
           * A segunda cópia existe apenas para a animação.
           * Não queremos que ela apareça duas vezes para
           * leitores de tela.
           */
          if (index >= items.length) {
            return (
              <span
                key={key}
                aria-hidden="true"
              >
                {content}
              </span>
            );
          }

          if (!item.link) {
            return (
              <span key={key}>
                {content}
              </span>
            );
          }

          if (item.newTab) {
            return (
              <a
                key={key}
                href={item.link}
                target="_blank"
                rel="noreferrer"
              >
                {content}
              </a>
            );
          }

          if (item.link.startsWith("/")) {
            return (
              <Link
                key={key}
                to={item.link}
              >
                {content}
              </Link>
            );
          }

          return (
            <a
              key={key}
              href={item.link}
            >
              {content}
            </a>
          );
        })}
      </div>
    </div>
  );
}
