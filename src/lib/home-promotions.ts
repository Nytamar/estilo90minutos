import { supabase } from "@/integrations/supabase/client";

export type HomePromotion = {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  new_tab: boolean;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchHomePromotions(
  onlyActive = true,
): Promise<HomePromotion[]> {
  let query = supabase
    .from("home_promotions")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (onlyActive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as HomePromotion[];
}

export const homePromotionsQuery = (onlyActive = true) => ({
  queryKey: ["home-promotions", onlyActive],
  queryFn: () => fetchHomePromotions(onlyActive),
});
