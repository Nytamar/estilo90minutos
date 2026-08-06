import { supabase } from "@/integrations/supabase/client";

export type Taxonomy = {
  id: string;
  type: "category" | "brand" | "club" | "league" | "country" | "season";
  name: string;
  slug: string;
};

export type ProductSize = { id: string; size: string; stock: number; position: number };

export type Product = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  images: string[];
  featured: boolean;
  sold_count: number;
  active: boolean;
  created_at: string;
  category_id: string | null;
  brand_id: string | null;
  club_id: string | null;
  league_id: string | null;
  country_id: string | null;
  season_id: string | null;
  availability: Availability;
  product_sizes: ProductSize[];
};

export type Availability = "pronta_entrega" | "encomenda";

export const availabilityLabel: Record<Availability, string> = {
  pronta_entrega: "Pronta entrega",
  encomenda: "Sob encomenda",
};

/** Aviso exibido em todas as peças sob encomenda. */
export const PRE_ORDER_NOTICE =
  "Peça sob encomenda: o prazo de produção e entrega é de 25 a 30 dias após a confirmação do pedido.";

/** Valor adicional cobrado pela personalização (nome + número). */
export const PERSONALIZATION_PRICE = 20;

/** Aviso sobre tamanhos indisponíveis. */
export const SIZE_ORDER_NOTICE =
  "Não encontrou seu tamanho? Todos os tamanhos (P ao EXG) podem ser feitos sob encomenda — fale com a gente pelo WhatsApp. Prazo de 25 a 30 dias.";


export function availabilityOf(product: { availability?: string | null }): Availability {
  return product.availability === "encomenda" ? "encomenda" : "pronta_entrega";
}


const SELECT = "*, product_sizes(id, size, stock, position)";

export async function fetchProducts(onlyActive = true): Promise<Product[]> {
  let query = supabase.from("products").select(SELECT).order("created_at", { ascending: false });
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Product) ?? null;
}

export async function fetchTaxonomies(): Promise<Taxonomy[]> {
  const { data, error } = await supabase.from("taxonomies").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Taxonomy[];
}

export function totalStock(product: Pick<Product, "product_sizes">): number {
  return product.product_sizes.reduce((sum, s) => sum + s.stock, 0);
}

export function effectivePrice(product: Pick<Product, "price" | "sale_price">): number {
  return product.sale_price ?? product.price;
}

export const productsQuery = (onlyActive = true) => ({
  queryKey: ["products", onlyActive],
  queryFn: () => fetchProducts(onlyActive),
});

export const taxonomiesQuery = () => ({
  queryKey: ["taxonomies"],
  queryFn: fetchTaxonomies,
});

export const productQuery = (slug: string) => ({
  queryKey: ["product", slug],
  queryFn: () => fetchProductBySlug(slug),
});
