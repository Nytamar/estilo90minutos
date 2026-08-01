export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function stockStatus(total: number): StockStatus {
  if (total <= 0) return "out_of_stock";
  if (total <= 3) return "low_stock";
  return "in_stock";
}

export const stockLabel: Record<StockStatus, string> = {
  in_stock: "Disponível",
  low_stock: "Poucas unidades",
  out_of_stock: "Esgotado",
};
