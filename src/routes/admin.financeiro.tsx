import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Lock, LogOut, ShieldCheck } from "lucide-react";
import { useFinancialPin } from "@/hooks/useFinancialPin";
import { productsQuery } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  financialByProductQuery,
  financialDailyQuery,
  recentSalesQuery,
  registerSale,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { checking, configured, unlocked, configure, verify, lock } = useFinancialPin();

  if (checking) {
    return <p className="text-muted-foreground">Verificando acesso...</p>;
  }

  if (!unlocked) {
    return (
      <PinGate
        mode={configured ? "unlock" : "setup"}
        onSubmit={configured ? verify : configure}
      />
    );
  }

  return <FinanceiroDashboard onLock={lock} />;
}

function PinGate({
  mode,
  onSubmit,
}: {
  mode: "setup" | "unlock";
  onSubmit: (pin: string) => Promise<boolean | void>;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error("O PIN precisa ter ao menos 4 dígitos");
      return;
    }
    if (mode === "setup" && pin !== confirmPin) {
      toast.error("Os PINs não conferem");
      return;
    }
    setLoading(true);
    try {
      const result = await onSubmit(pin);
      if (mode === "unlock" && result === false) {
        toast.error("PIN incorreto");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao verificar o PIN");
    } finally {
      setLoading(false);
      setPin("");
      setConfirmPin("");
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center">
      <div className="surface-card flex h-14 w-14 items-center justify-center rounded-full">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <h1 className="mt-4 text-2xl">Financeiro</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "setup"
          ? "Primeiro acesso: crie um PIN próprio para esta seção. Ele é diferente da senha do painel."
          : "Digite o PIN do financeiro para continuar. Ele é diferente da senha do painel."}
      </p>
      <form onSubmit={handleSubmit} className="surface-card mt-6 w-full space-y-4 rounded-2xl p-6">
        <div>
          <Label htmlFor="pin">{mode === "setup" ? "Novo PIN" : "PIN"}</Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        {mode === "setup" && (
          <div>
            <Label htmlFor="confirmPin">Confirme o PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
            />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {mode === "setup" ? "Criar PIN e entrar" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

function FinanceiroDashboard({ onLock }: { onLock: () => void }) {
  const qc = useQueryClient();
  const { data: daily = [], isLoading: loadingDaily } = useQuery(financialDailyQuery());
  const { data: byProduct = [], isLoading: loadingProducts } = useQuery(financialByProductQuery());
  const { data: recentSales = [] } = useQuery(recentSalesQuery());
  const { data: products = [] } = useQuery(productsQuery(false));

  const totals = daily.reduce(
    (acc, d) => ({
      revenue: acc.revenue + Number(d.revenue ?? 0),
      cost: acc.cost + Number(d.cost ?? 0),
      profit: acc.profit + Number(d.profit ?? 0),
    }),
    { revenue: 0, cost: 0, profit: 0 },
  );

  const chartData = [...daily].reverse().map((d) => ({
    dia: new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Faturamento: Number(d.revenue ?? 0),
    Custo: Number(d.cost ?? 0),
    Lucro: Number(d.profit ?? 0),
  }));

  const { mutateAsync: submitSale, isPending: saving } = useMutation({
    mutationFn: registerSale,
    onSuccess: () => {
      toast.success("Venda lançada — custo e lucro calculados automaticamente");
      void qc.invalidateQueries({ queryKey: ["financial-daily"] });
      void qc.invalidateQueries({ queryKey: ["financial-by-product"] });
      void qc.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao lançar a venda");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-3xl">Financeiro</h1>
        </div>
        <button
          onClick={onLock}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Travar
        </button>
      </div>

      {/* Cards: faturamento / custo / lucro, separados automaticamente */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Faturamento (30 dias)</p>
          <p className="mt-1 font-display text-2xl">{formatPrice(totals.revenue)}</p>
          <p className="text-xs text-muted-foreground">Valor total que entrou</p>
        </div>
        <div className="surface-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Custo das peças</p>
          <p className="mt-1 font-display text-2xl text-warning">{formatPrice(totals.cost)}</p>
          <p className="text-xs text-muted-foreground">Reposição / fornecedor</p>
        </div>
        <div className="surface-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground">Lucro líquido</p>
          <p className="mt-1 font-display text-2xl text-primary">{formatPrice(totals.profit)}</p>
          <p className="text-xs text-muted-foreground">
            {totals.revenue > 0 ? `Margem de ${((totals.profit / totals.revenue) * 100).toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Lançar venda */}
      <RegisterSaleForm products={products} onSubmit={submitSale} saving={saving} />

      {/* Gráfico diário */}
      <div className="surface-card rounded-xl p-5">
        <h2 className="mb-4 font-display text-xl">Faturamento x custo x lucro</h2>
        <div className="h-72 w-full">
          {!loadingDaily && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.33 0.045 259)" />
                <XAxis dataKey="dia" stroke="oklch(0.72 0.022 255)" fontSize={12} />
                <YAxis stroke="oklch(0.72 0.022 255)" fontSize={12} tickFormatter={(v) => formatPrice(v)} width={90} />
                <Tooltip
                  formatter={(v: number) => formatPrice(v)}
                  contentStyle={{
                    background: "oklch(0.22 0.047 259)",
                    border: "1px solid oklch(0.33 0.045 259)",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="Faturamento" fill="oklch(0.62 0.13 255)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Custo" fill="oklch(0.72 0.15 55)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Lucro" fill="oklch(0.79 0.132 145)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Lucro por produto */}
      <div className="surface-card rounded-xl p-5">
        <h2 className="mb-3 font-display text-xl">Lucro por produto</h2>
        <ul className="space-y-2 text-sm">
          {!loadingProducts &&
            byProduct.map((p) => (
              <li key={p.product_id} className="flex items-center justify-between gap-2 border-b border-border/50 py-2">
                <div className="min-w-0">
                  <p className="truncate">{p.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.units_sold} un. · margem {p.margin_pct ?? "—"}%
                  </p>
                </div>
                <span className="shrink-0 text-primary">{formatPrice(Number(p.profit))}</span>
              </li>
            ))}
          {!loadingProducts && byProduct.length === 0 && (
            <li className="text-muted-foreground">Nenhuma venda lançada ainda.</li>
          )}
        </ul>
      </div>

      {/* Vendas recentes */}
      <div className="surface-card rounded-xl p-5">
        <h2 className="mb-3 font-display text-xl">Últimas vendas</h2>
        <ul className="space-y-2 text-sm">
          {recentSales.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-2">
              <div>
                <p>{new Date(s.sold_at).toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">
                  {s.quantity}x · custo {formatPrice(s.unit_cost_price)} · venda {formatPrice(s.unit_sale_price)}
                </p>
              </div>
              <span className="shrink-0 text-primary">{formatPrice(s.total_profit_amount)}</span>
            </li>
          ))}
          {recentSales.length === 0 && <li className="text-muted-foreground">Nenhuma venda ainda.</li>}
        </ul>
      </div>
    </div>
  );
}

function RegisterSaleForm({
  products,
  onSubmit,
  saving,
}: {
  products: { id: string; name: string; code: string }[];
  onSubmit: (input: { productId: string; quantity: number }) => Promise<unknown>;
  saving: boolean;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      toast.error("Selecione o produto");
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error("Quantidade inválida");
      return;
    }
    await onSubmit({ productId, quantity: qty });
    setQuantity("1");
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card grid gap-4 rounded-xl p-5 sm:grid-cols-[1fr_120px_140px]">
      <div>
        <Label htmlFor="sale-product">Produto vendido</Label>
        <select
          id="sale-product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
        >
          <option value="">Selecione...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="sale-qty">Quantidade</Label>
        <Input
          id="sale-qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={saving} className="self-end">
        Lançar venda
      </Button>
    </form>
  );
}
