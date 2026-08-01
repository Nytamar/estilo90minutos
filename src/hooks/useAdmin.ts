import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async (current: Session | null) => {
      if (!active) return;
      setSession(current);
      if (!current) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: current.user.id,
        _role: "admin",
      });
      if (!active) return;
      setIsAdmin(Boolean(data));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => void check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setLoading(true);
      void check(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, isAdmin, loading };
}
