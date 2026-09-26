import { supabase } from "@/integrations/supabase/client";

export type Banner = {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  new_tab: boolean;
  position: number;
  active: boolean;
  created_at: string;
};

export async function fetchBanners(onlyActive = true): Promise<Banner[]> {
  let query = supabase
    .from("banners")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Banner[];
}

export const bannersQuery = (onlyActive = true) => ({
  queryKey: ["banners", onlyActive],
  queryFn: () => fetchBanners(onlyActive),
});
