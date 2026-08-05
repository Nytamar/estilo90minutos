import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, Share2, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  productQuery,
  productsQuery,
  effectivePrice,
  totalStock,
  availabilityOf,
  PRE_ORDER_NOTICE,
} from "@/lib/catalog";

import { formatPrice, stockLabel, stockStatus } from "@/lib/format";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Camisa ${params.slug.replace(/-/g, " ")} — ${siteConfig.name}` },
      {
        name: "description",
        content: `Compre a camisa ${params.slug.replace(/-/g, " ")} com pedido direto pelo WhatsApp. Estoque por tamanho e entrega para todo o Brasil.`,
      },
      { property: "og:title", content: `Camisa ${params.slug.replace(/-/g, " ")}` },
      {
        property: "og:description",
        content: "Camisa de futebol premium com pedido pelo WhatsApp.",
      },
    ],
  }),
  component: ProdutoPage,
});

const sizeTable = [
  { size: "P", chest: "50 cm", length: "70 cm" },
  { size: "M", chest: "53 cm", length: "72 cm" },
  { size: "G", chest: "56 cm", length: "74 cm" },
  { size: "GG", chest: "59 cm", length: "76 cm" },
  { size: "EXG", chest: "62 cm", length: "78 cm" },
];

function ProdutoPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: all = [] } = useQuery(productsQuery());
  const { isFavorite, toggle } = useFavorites();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [personalize, setPersonalize] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");

  const sizes = useMemo(
    () => (product?.product_sizes ?? []).slice().sort((a, b) => a.position - b.position),
    [product],
  );

  useEffect(() => {
    const first = sizes.find((s) => s.stock > 0);
    if (first) setSelectedSize(first.size);
  }, [sizes]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-muted-foreground">Carregando...</div>;
  }
  if (!product) throw notFound();

  const price = effectivePrice(product);
  const hasDiscount = product.sale_price != null && product.sale_price < product.price;
  const stock = totalStock(product);
  const status = stockStatus(stock);
  const images = product.images.length > 0 ? product.images : ["/images/jersey-1.jpg"];
  const favorite = isFavorite(product.id);

  const related = all
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const whatsappLink = buildWhatsAppOrderLink({
    name: product.name,
    code: product.code,
    price,
    size: selectedSize ?? "-",
    quantity,
    url,
    customization: personalize ? { name: playerName.trim(), number: playerNumber.trim() } : null,
  });

  async function share() {
    if (!product) return;
    const data = { title: product.name, text: `Olha essa camisa: ${product.name}`, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* usuário cancelou */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Início
        </Link>{" "}
        /{" "}
        <Link to="/catalogo" className="hover:text-primary">
          Catálogo
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div
            className="surface-card overflow-hidden rounded-2xl"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            <img
              src={images[activeImage]}
              alt={`Camisa ${product.name}`}
              width={900}
              height={1100}
              className={cn(
                "aspect-[4/5] w-full object-cover transition-transform duration-500",
                zoom && "scale-125",
              )}
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "h-20 w-16 overflow-hidden rounded-lg border",
                    activeImage === i ? "border-primary" : "border-border",
                  )}
                  aria-label={`Imagem ${i + 1}`}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Código {product.code}
          </p>
          <h1 className="mt-2 text-4xl">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <p
            className={cn(
              "mt-2 text-sm font-medium",
              status === "in_stock" && "text-success",
              status === "low_stock" && "text-warning",
              status === "out_of_stock" && "text-muted-foreground",
            )}
          >
            {stockLabel[status]}
          </p>

          {availabilityOf(product) === "encomenda" && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Prazo de entrega:</span>{" "}
                {PRE_ORDER_NOTICE}
              </p>
            </div>
          )}


          <p className="mt-5 text-muted-foreground">{product.description}</p>

          <Separator className="my-6" />

          <div>
            <h2 className="font-display text-lg">Tamanho</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const disabled = s.stock <= 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedSize(s.size)}
                    className={cn(
                      "h-11 w-14 rounded-md border text-sm font-medium transition-colors",
                      disabled && "cursor-not-allowed border-border/50 text-muted-foreground/40 line-through",
                      !disabled && selectedSize === s.size
                        ? "border-primary bg-primary text-primary-foreground"
                        : !disabled && "border-border hover:border-primary",
                    )}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedSize
                ? `${sizes.find((s) => s.size === selectedSize)?.stock ?? 0} unidade(s) do tamanho ${selectedSize}`
                : "Selecione um tamanho"}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="font-display text-lg">Personalização</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPersonalize(false)}
                className={cn(
                  "h-11 rounded-md border text-sm font-medium transition-colors",
                  !personalize
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary",
                )}
              >
                Sem personalização
              </button>
              <button
                type="button"
                onClick={() => setPersonalize(true)}
                className={cn(
                  "h-11 rounded-md border text-sm font-medium transition-colors",
                  personalize
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary",
                )}
              >
                Com personalização
              </button>
            </div>
            {personalize && (
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
                <div>
                  <label htmlFor="pers-nome" className="text-xs text-muted-foreground">
                    Nome na camisa
                  </label>
                  <Input
                    id="pers-nome"
                    value={playerName}
                    maxLength={20}
                    placeholder="Ex.: NEYMAR"
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                  />
                </div>
                <div>
                  <label htmlFor="pers-numero" className="text-xs text-muted-foreground">
                    Número
                  </label>
                  <Input
                    id="pers-numero"
                    value={playerNumber}
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="10"
                    onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <button
                className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-primary"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-primary"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" size="icon" onClick={() => toggle(product.id)} aria-label="Favoritar">
              <Heart className={cn("h-5 w-5", favorite && "fill-primary text-primary")} />
            </Button>
            <Button variant="outline" size="icon" onClick={share} aria-label="Compartilhar">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {status !== "out_of_stock" ? (
            <Button
              asChild
              size="lg"
              className="mt-6 h-14 w-full bg-whatsapp text-base font-bold text-whatsapp-foreground hover:bg-whatsapp/90"
            >
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" /> PEDIR PELO WHATSAPP
              </a>
            </Button>
          ) : (
            <div className="mt-6 rounded-md border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
              Produto esgotado. Fale conosco para saber sobre reposição.
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" /> Envio para todo o Brasil
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Garantia de qualidade
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg">Tabela de tamanhos</h2>
            <table className="mt-3 w-full overflow-hidden rounded-lg text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="px-3 py-2">Tamanho</th>
                  <th className="px-3 py-2">Largura</th>
                  <th className="px-3 py-2">Altura</th>
                </tr>
              </thead>
              <tbody>
                {sizeTable.map((row) => (
                  <tr key={row.size} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{row.size}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.chest}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-3xl">Você também vai gostar</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
