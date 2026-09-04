import { supabase } from "@/integrations/supabase/client";

export type HomeTickerMessage = {
  id: string;
  text: string;
  link_url: string | null;
  new_tab: boolean;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchHomeTickerMessages(
  onlyActive = true,
): Promise<HomeTickerMessage[]> {
  let query = supabase
    .from("home_ticker_messages")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (onlyActive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as HomeTickerMessage[];
}

export const homeTickerMessagesQuery = (
  onlyActive = true,
) => ({
  queryKey: ["home-ticker-messages", onlyActive],

  queryFn: () =>
    fetchHomeTickerMessages(onlyActive),
});
