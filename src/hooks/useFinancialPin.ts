import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const UNLOCK_KEY = "financeiro_unlocked";

/**
 * Controla o acesso à seção /admin/financeiro com um PIN próprio,
 * separado da senha usada para entrar no painel administrativo.
 *
 * O desbloqueio vale só para a aba/sessão do navegador (sessionStorage):
 * fechar a aba ou abrir em outra guia exige o PIN de novo.
 */
export function useFinancialPin() {
  const [checking, setChecking] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(UNLOCK_KEY) === "1",
  );

  useEffect(() => {
    let active = true;
    supabase.rpc("financial_pin_is_configured").then(({ data, error }) => {
      if (!active) return;
      if (!error) setConfigured(Boolean(data));
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const configure = useCallback(async (pin: string) => {
    const { error } = await supabase.rpc("financial_pin_configure", { new_pin: pin });
    if (error) throw error;
    setConfigured(true);
    setUnlocked(true);
    sessionStorage.setItem(UNLOCK_KEY, "1");
  }, []);

  const verify = useCallback(async (pin: string) => {
    const { data, error } = await supabase.rpc("financial_pin_verify", { input_pin: pin });
    if (error) throw error;
    if (data) {
      setUnlocked(true);
      sessionStorage.setItem(UNLOCK_KEY, "1");
    }
    return Boolean(data);
  }, []);

  const lock = useCallback(() => {
    sessionStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
  }, []);

  return { checking, configured, unlocked, configure, verify, lock };
}
