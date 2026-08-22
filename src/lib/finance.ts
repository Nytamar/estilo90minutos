import { supabase } from "@/integrations/supabase/client";

export type Sale = {
  id: string;
  product_id: string;
  product_size_id: string | null;
  quantity: number;
  unit_cost_price: number;
  unit_sale_price: number;
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
  paymentMethod?: string;
  customerName?: string;
  notes?: string;
};

// Não enviamos custo nem preço de venda: o trigger no banco busca esses
// valores automaticamente do cadastro do produto no momento da venda.
export async function registerSale(input: RegisterSaleInput): Promise<Sale> {
  const { data, error } = await supabase
    .from("sales")
    .insert({
      product_id: input.productId,
      product_size_id: input.productSizeId ?? null,
      quantity: input.quantity,
      payment_method: input.paymentMethod ?? null,
      customer_name: input.customerName ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Sale;
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
