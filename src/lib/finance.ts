import { supabase } from "@/integrations/supabase/client";

export type Sale = {
  id: string;
  product_id: string;
  product_size_id: string | null;
  quantity: number;
  unit_cost_price: number;
  unit_sale_price: number;
  customization_fee: number;
  customization_cost: number;
  total_sale_amount: number;
  total_cost_amount: number;
  total_profit_amount: number;
  payment_method: string | null;
  customer_name: string | null;
  notes: string | null;
  sold_at: string;
};

export type FinancialDailyRow = {
  day: string;
  total_sales: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type FinancialByProductRow = {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin_pct: number | null;
};

export type RegisterSaleInput = {
  productId: string;
  productSizeId?: string | null;
  quantity: number;
  customizationFee?: number;
  /** Custo da peça nesta venda — use quando o produto não tem preço de custo cadastrado (ou pra sobrescrever). Se não informado, o banco puxa do cadastro do produto. */
  unitCostPrice?: number;
  /** Preço de venda desta unidade — use quando vendeu por um valor diferente do que está no site. Se não informado, o banco puxa o preço do produto. */
  unitSalePrice?: number;
  /** Quanto a personalização custou pra loja nesta venda. */
  customizationCost?: number;
  paymentMethod?: string;
  customerName?: string;
  notes?: string;
};

// Custo e preço de venda: se não informados aqui, o trigger no banco busca
// automaticamente do cadastro do produto no momento da venda. Informar aqui
// serve pra dois casos: o produto não tem custo cadastrado, ou essa venda em
// específico foi por um valor diferente do site (mais ou menos).
// O acréscimo/custo de personalização é sempre informado aqui, pois varia
// venda a venda e não faz parte do cadastro do produto.
export async function registerSale(input: RegisterSaleInput): Promise<Sale> {
  const { data, error } = await supabase
    .from("sales")
    .insert({
      product_id: input.productId,
      product_size_id: input.productSizeId ?? null,
      quantity: input.quantity,
      customization_fee: input.customizationFee ?? 0,
      customization_cost: input.customizationCost ?? 0,
      ...(input.unitCostPrice != null ? { unit_cost_price: input.unitCostPrice } : {}),
      ...(input.unitSalePrice != null ? { unit_sale_price: input.unitSalePrice } : {}),
      payment_method: input.paymentMethod ?? null,
      customer_name: input.customerName ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Sale;
}

export type UpdateSaleInput = {
  productId?: string;
  productSizeId?: string | null;
  quantity?: number;
  customizationFee?: number;
  customizationCost?: number;
  unitCostPrice?: number;
  unitSalePrice?: number;
  paymentMethod?: string | null;
  customerName?: string | null;
  notes?: string | null;
};

export async function updateSale(id: string, input: UpdateSaleInput): Promise<Sale> {
  const patch: Record<string, unknown> = {};
  if (input.productId !== undefined) patch.product_id = input.productId;
  if (input.productSizeId !== undefined) patch.product_size_id = input.productSizeId;
  if (input.quantity !== undefined) patch.quantity = input.quantity;
  if (input.customizationFee !== undefined) patch.customization_fee = input.customizationFee;
  if (input.customizationCost !== undefined) patch.customization_cost = input.customizationCost;
  if (input.unitCostPrice !== undefined) patch.unit_cost_price = input.unitCostPrice;
  if (input.unitSalePrice !== undefined) patch.unit_sale_price = input.unitSalePrice;
  if (input.paymentMethod !== undefined) patch.payment_method = input.paymentMethod;
  if (input.customerName !== undefined) patch.customer_name = input.customerName;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase
    .from("sales")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Sale;
}

export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchFinancialDaily(): Promise<FinancialDailyRow[]> {
  const { data, error } = await supabase
    .from("v_financial_daily")
    .select("*")
    .order("day", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as FinancialDailyRow[];
}

export async function fetchFinancialByProduct(): Promise<FinancialByProductRow[]> {
  const { data, error } = await supabase
    .from("v_financial_by_product")
    .select("*")
    .order("profit", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FinancialByProductRow[];
}

export async function fetchRecentSales(limit = 15): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("sold_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Sale[];
}

export const financialDailyQuery = () => ({
  queryKey: ["financial-daily"],
  queryFn: fetchFinancialDaily,
});

export const financialByProductQuery = () => ({
  queryKey: ["financial-by-product"],
  queryFn: fetchFinancialByProduct,
});

export const recentSalesQuery = (limit = 15) => ({
  queryKey: ["sales", limit],
  queryFn: () => fetchRecentSales(limit),
});
