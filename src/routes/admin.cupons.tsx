import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/cupons")({
  component: AdminCupons,
});

type Coupon = { id: string; code: string; discount_percent: number; active: boolean };

function AdminCupons() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["coupons"] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: code.trim().toUpperCase(),
        discount_percent: Number(percent),
        active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCode("");
      toast.success("Cupom criado (desativado)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Cupons</h1>
      <p className="text-sm text-muted-foreground">
        Cupons são criados desativados por padrão. Ative apenas quando quiser divulgar o desconto
        no atendimento.
      </p>

      <div className="surface-card flex flex-wrap items-end gap-3 rounded-xl p-5">
        <div>
          <Label htmlFor="code">Código</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MANTO10" />
        </div>
        <div>
          <Label htmlFor="pct">Desconto (%)</Label>
          <Input
            id="pct"
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="w-28"
          />
        </div>
        <Button onClick={() => code.trim() && add.mutate()}>
          <Plus className="mr-2 h-4 w-4" /> Criar cupom
        </Button>
      </div>

      <div className="surface-card overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.discount_percent}%</td>
                <td className="px-4 py-3">
                  <Switch
                    checked={c.active}
                    onCheckedChange={(v) => toggle.mutate({ id: c.id, active: v })}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove.mutate(c.id)}
                    aria-label={`Excluir ${c.code}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
