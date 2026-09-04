import { supabase } from "@/integrations/supabase/client";

export type Coupon = {
  code: string;
  discount_percent: number;
};

/** Confere se o cupom existe e está ativo. Retorna null se inválido. */
export async function validateCoupon(rawCode: string): Promise<Coupon | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await supabase
    .from("coupons")
    .select("code, discount_percent, active")
    .ilike("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return { code: data.code, discount_percent: data.discount_percent };
}
