import { useState, useMemo } from "react";
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
import { Lock, LogOut, ShieldCheck, Trash2, Pencil, Plus, ChevronDown } from "lucide-react";
import { useFinancialPin } from "@/hooks/useFinancialPin";
import { productsQuery, effectivePrice, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  deleteSale,
  financialByProductQuery,
  financialMonthlyQuery,
  financialDailyQuery,
  notifySale,
  pendingSalesQuery,
  receiveGroupPayment,
  recentSalesQuery,
  registerSale,
  updateSale,
  type RegisterSaleInput,
  type UpdateSaleInput,
  type Sale,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductCombobox } from "@/components/site/ProductCombobox";

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

  return <FinanceiroDashboard onLock={lock} onChangePin={configure} />;
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

function ChangePinForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (pin: string) => Promise<void>;
  onClose: () => void;
}) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) {
      toast.error("O PIN precisa ter ao menos 4 dígitos");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Os PINs não conferem");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(newPin);
      toast.success("PIN atualizado");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao trocar o PIN");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card grid gap-4 rounded-2xl p-5 sm:grid-cols-[1fr_1fr_auto_auto]">
      <div>
        <Label htmlFor="new-pin">Novo PIN</Label>
        <Input
          id="new-pin"
          type="password"
          inputMode="numeric"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="confirm-new-pin">Confirme</Label>
        <Input
          id="confirm-new-pin"
          type="password"
          inputMode="numeric"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="self-end">
        Salvar
      </Button>
      <Button type="button" variant="outline" onClick={onClose} className="self-end">
        Cancelar
      </Button>
    </form>
  );
}

function FinanceiroDashboard({
  onLock,
  onChangePin,
}: {
  onLock: () => void;
  onChangePin: (pin: string) => Promise<void>;
}) {
  const [changingPin, setChangingPin] = useState(false);
  const qc = useQueryClient();
  const { data: daily = [], isLoading: loadingDaily } = useQuery(financialDailyQuery());
  const { data: byProduct = [], isLoading: loadingProducts } = useQuery(financialByProductQuery());
  const { data: monthly = [] } = useQuery(financialMonthlyQuery());
  const { data: recentSales = [] } = useQuery(recentSalesQuery());
  const { data: pendingSales = [] } = useQuery(pendingSalesQuery());
  const { data: products = [] } = useQuery(productsQuery(false));

  const productNameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  // Agrupa vendas com o mesmo comprador + exatamente o mesmo horário (as
  // camisas lançadas juntas numa mesma venda sempre compartilham os dois,
  // veja o "effectiveSoldAt" em RegisterSaleForm) — assim uma venda de 3
  // camisas pro mesmo cliente aparece como 1 cartão em "Últimas vendas",
  // com cada peça listada dentro, em vez de 3 linhas soltas e repetidas.
  // Sem nome de comprador, cada venda continua aparecendo separada, do
  // jeito que já era.
  type RecentSaleGroup = { key: string; customerName: string | null; sales: Sale[] };
  const recentSaleGroups = useMemo<RecentSaleGroup[]>(() => {
    const groups: RecentSaleGroup[] = [];
    const indexByKey = new Map<string, number>();
    for (const s of recentSales) {
      const name = s.customer_name?.trim() || null;
      const groupKey = name ? `${name.toLowerCase()}__${s.sold_at}` : `__solo__${s.id}`;
      const existingIndex = indexByKey.get(groupKey);
      if (existingIndex !== undefined) {
        groups[existingIndex].sales.push(s);
      } else {
        indexByKey.set(groupKey, groups.length);
        groups.push({ key: groupKey, customerName: name, sales: [s] });
      }
    }
    return groups;
  }, [recentSales]);

  // Mesmo agrupamento, mas para "A receber": um cartão por cliente/venda.
  const pendingGroups = useMemo<RecentSaleGroup[]>(() => {
    const groups: RecentSaleGroup[] = [];
    const indexByKey = new Map<string, number>();
    for (const s of pendingSales) {
      const name = s.customer_name?.trim() || null;
      const groupKey = name ? `${name.toLowerCase()}__${s.sold_at}` : `__solo__${s.id}`;
      const existingIndex = indexByKey.get(groupKey);
      if (existingIndex !== undefined) {
        groups[existingIndex].sales.push(s);
      } else {
        indexByKey.set(groupKey, groups.length);
        groups.push({ key: groupKey, customerName: name, sales: [s] });
      }
    }
    return groups;
  }, [pendingSales]);

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
      void qc.invalidateQueries({ queryKey: ["sales-pending"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao lançar a venda");
    },
  });

  const { mutateAsync: removeSale, isPending: deleting } = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      toast.success("Venda excluída");
      void qc.invalidateQueries({ queryKey: ["financial-daily"] });
      void qc.invalidateQueries({ queryKey: ["financial-by-product"] });
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: ["sales-pending"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir a venda");
    },
  });

  const { mutateAsync: receivePayment, isPending: receiving } = useMutation({
    mutationFn: ({ sales, amount }: { sales: Sale[]; amount: number }) =>
      receiveGroupPayment(sales, amount),
    onSuccess: () => {
      toast.success("Pagamento registrado");
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: ["sales-pending"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar o pagamento");
    },
  });

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const { mutateAsync: editSale, isPending: savingEdit } = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSaleInput }) => updateSale(id, input),
    onSuccess: () => {
      toast.success("Venda atualizada");
      setEditingSale(null);
      void qc.invalidateQueries({ queryKey: ["financial-daily"] });
      void qc.invalidateQueries({ queryKey: ["financial-by-product"] });
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: ["sales-pending"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar a venda");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-3xl">Financeiro</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setChangingPin(true)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Trocar PIN
          </button>
          <button
            onClick={onLock}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Travar
          </button>
        </div>
      </div>

      {changingPin && (
        <ChangePinForm
          onSubmit={onChangePin}
          onClose={() => setChangingPin(false)}
        />
      )}

      {/* Cards: faturamento / custo / lucro, separados automaticamente */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card flex items-center justify-between rounded-2xl p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Faturamento (30 dias)</p>
            <p className="mt-1 font-display text-2xl">{formatPrice(totals.revenue)}</p>
            <p className="text-xs text-muted-foreground">Valor total que entrou</p>
          </div>
          <span className="h-8 w-2 shrink-0 rounded-full bg-violet-400" />
        </div>
        <div className="surface-card flex items-center justify-between rounded-2xl p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Custo das peças</p>
            <p className="mt-1 font-display text-2xl text-warning">{formatPrice(totals.cost)}</p>
            <p className="text-xs text-muted-foreground">Reposição / fornecedor</p>
          </div>
          <span className="h-8 w-2 shrink-0 rounded-full bg-rose-400" />
        </div>
        <div className="surface-card flex items-center justify-between rounded-2xl p-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Lucro líquido</p>
            <p className="mt-1 font-display text-2xl text-primary">{formatPrice(totals.profit)}</p>
            <p className="text-xs text-muted-foreground">
              {totals.revenue > 0 ? `Margem de ${((totals.profit / totals.revenue) * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <span className="h-8 w-2 shrink-0 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* A receber */}
      {pendingSales.length > 0 && (
        <div className="surface-card rounded-2xl border border-amber-300/50 bg-amber-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl text-amber-900">A receber</h2>
            <span className="font-semibold text-amber-700">
              {formatPrice(pendingSales.reduce((sum, s) => sum + Number(s.pending_amount), 0))}
            </span>
          </div>
          <ul className="space-y-3 text-sm">
            {pendingGroups.map((group) => (
              <PendingGroupCard
                key={group.key}
                group={group}
                productNameById={productNameById}
                receiving={receiving}
                onReceive={(amount) => receivePayment({ sales: group.sales, amount })}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Lançar venda */}
      <RegisterSaleForm products={products} onSubmit={submitSale} saving={saving} />

      {/* Gráfico diário */}
      <div className="surface-card rounded-2xl p-5">
        <h2 className="mb-4 font-display text-xl">Faturamento x custo x lucro</h2>
        <div className="h-72 w-full">
          {!loadingDaily && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatPrice(v)}
                  width={90}
                />
                <Tooltip
                  formatter={(v: number) => formatPrice(v)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="Faturamento" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Custo" fill="#fb7185" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Lucro" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Faturamento por mês */}
      <div className="surface-card rounded-2xl p-5">
        <h2 className="mb-3 font-display text-xl">Faturamento por mês</h2>
        <div className="space-y-2 text-sm">
          {monthly.map((m) => {
            const label = new Date(m.month).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            });
            return (
              <div
                key={m.month}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2"
              >
                <span className="capitalize">{label}</span>
                <span className="text-xs text-muted-foreground">{m.total_sales} venda(s)</span>
                <span className="text-muted-foreground">Fat. {formatPrice(m.revenue)}</span>
                <span className="text-warning">Custo {formatPrice(m.cost)}</span>
                <span className="font-semibold text-primary">Lucro {formatPrice(m.profit)}</span>
              </div>
            );
          })}
          {monthly.length === 0 && <p className="text-muted-foreground">Nenhuma venda lançada ainda.</p>}
        </div>
      </div>

      {/* Lucro por produto */}
      <div className="surface-card rounded-2xl p-5">
        <h2 className="mb-3 font-display text-xl">Lucro por produto</h2>
        <ul className="space-y-3 text-sm">
          {!loadingProducts &&
            byProduct.map((p) => {
              const maxProfit = Math.max(1, ...byProduct.map((x) => Number(x.profit) || 0));
              const ratio = Math.max(0, Number(p.profit) || 0) / maxProfit;
              return (
                <li key={p.product_id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.units_sold} un. · margem {p.margin_pct ?? "—"}%
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-primary">{formatPrice(Number(p.profit))}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-emerald-400"
                      style={{ width: `${Math.max(4, ratio * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          {!loadingProducts && byProduct.length === 0 && (
            <li className="text-muted-foreground">Nenhuma venda lançada ainda.</li>
          )}
        </ul>
      </div>

      {/* Vendas recentes */}
      <div className="surface-card rounded-2xl p-5">
        <h2 className="mb-3 font-display text-xl">Últimas vendas</h2>
        <ul className="space-y-2 text-sm">
          {recentSaleGroups.map((group) =>
            group.sales.length > 1 ? (
              <li key={group.key} className="border-b border-border/50 py-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                    {(group.customerName || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{group.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(group.sales[0].sold_at).toLocaleString("pt-BR")} · {group.sales.length} camisas
                    </p>
                    {(() => {
                      const total = group.sales.reduce((sum, s) => sum + Number(s.total_sale_amount), 0);
                      const falta = group.sales.reduce((sum, s) => sum + Number(s.pending_amount), 0);
                      return (
                        <p className="text-xs">
                          <span className="font-medium">Total {formatPrice(total)}</span>
                          {falta > 0 && (
                            <>
                              <span className="text-muted-foreground"> · Pago {formatPrice(total - falta)} · </span>
                              <span className="font-medium text-warning">Falta {formatPrice(falta)}</span>
                            </>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    lucro {formatPrice(group.sales.reduce((sum, s) => sum + Number(s.total_profit_amount), 0))}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5 border-l-2 border-border pl-4">
                  {group.sales.map((s) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words">
                          {s.quantity}x {productNameById.get(s.product_id) ?? "Produto"}
                        </p>
                        {s.notes && (
                          <p className="text-xs italic text-muted-foreground">{s.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          venda {formatPrice(s.total_sale_amount)} · lucro {formatPrice(s.total_profit_amount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Editar venda"
                        onClick={() => setEditingSale(s)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <DeleteSaleButton sale={s} onConfirm={removeSale} deleting={deleting} />
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={group.key} className="flex items-center gap-3 border-b border-border/50 py-2">
                {(() => {
                  const s = group.sales[0];
                  return (
                    <>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                        {(s.customer_name || "?").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p>{new Date(s.sold_at).toLocaleString("pt-BR")}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.quantity}x {productNameById.get(s.product_id) ?? "Produto"} · custo{" "}
                          {formatPrice(s.unit_cost_price)} · venda {formatPrice(s.unit_sale_price)}
                          {Number(s.customization_fee) > 0 && (
                            <> · personalização +{formatPrice(s.customization_fee)}</>
                          )}
                          {Number(s.customization_cost) > 0 && (
                            <> (custo {formatPrice(s.customization_cost)})</>
                          )}
                        </p>
                        {s.notes && (
                          <p className="mt-0.5 truncate text-xs italic text-muted-foreground">{s.notes}</p>
                        )}
                        {Number(s.pending_amount) > 0 && (
                          <p className="mt-0.5 text-xs font-medium text-warning">
                            Falta receber {formatPrice(s.pending_amount)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold text-primary">{formatPrice(s.total_profit_amount)}</span>
                        <button
                          type="button"
                          aria-label="Editar venda"
                          onClick={() => setEditingSale(s)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <DeleteSaleButton sale={s} onConfirm={removeSale} deleting={deleting} />
                      </div>
                    </>
                  );
                })()}
              </li>
            ),
          )}
          {recentSales.length === 0 && <li className="text-muted-foreground">Nenhuma venda ainda.</li>}
        </ul>
      </div>

      {editingSale && (
        <EditSaleDialog
          sale={editingSale}
          products={products}
          saving={savingEdit}
          onClose={() => setEditingSale(null)}
          onSubmit={(input) => editSale({ id: editingSale.id, input })}
        />
      )}
    </div>
  );
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditSaleDialog({
  sale,
  products,
  saving,
  onClose,
  onSubmit,
}: {
  sale: Sale;
  products: { id: string; name: string; code: string }[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: UpdateSaleInput) => Promise<unknown>;
}) {
  const [productId, setProductId] = useState(sale.product_id);
  const [quantity, setQuantity] = useState(String(sale.quantity));
  const [costPrice, setCostPrice] = useState(String(sale.unit_cost_price));
  const [salePrice, setSalePrice] = useState(String(sale.unit_sale_price));
  const [customizationFee, setCustomizationFee] = useState(String(sale.customization_fee));
  const [customizationCost, setCustomizationCost] = useState(String(sale.customization_cost));
  const [pendingAmount, setPendingAmount] = useState(String(sale.pending_amount ?? 0));
  const [soldAt, setSoldAt] = useState(toDatetimeLocalValue(sale.sold_at));
  const [notes, setNotes] = useState(sale.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error("Quantidade inválida");
      return;
    }
    const cost = Number(costPrice);
    const price = Number(salePrice);
    const fee = Number(customizationFee || 0);
    const custoPersonalizacao = Number(customizationCost || 0);
    const pending = Number(pendingAmount || 0);
    if ([cost, price, fee, custoPersonalizacao, pending].some((v) => Number.isNaN(v) || v < 0)) {
      toast.error("Os valores não podem ser negativos");
      return;
    }

    await onSubmit({
      productId,
      quantity: qty,
      unitCostPrice: cost,
      unitSalePrice: price,
      customizationFee: fee,
      customizationCost: custoPersonalizacao,
      pendingAmount: pending,
      soldAt: soldAt ? new Date(soldAt).toISOString() : undefined,
      notes: notes.trim() || null,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-product">Produto vendido</Label>
            <ProductCombobox id="edit-product" products={products} value={productId} onChange={setProductId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-qty">Quantidade</Label>
              <Input
                id="edit-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-sale-price">Preço de venda (un.)</Label>
              <Input
                id="edit-sale-price"
                type="number"
                min={0}
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-cost-price">Preço de custo (un.)</Label>
              <Input
                id="edit-cost-price"
                type="number"
                min={0}
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-customization">Acréscimo personalização</Label>
              <Input
                id="edit-customization"
                type="number"
                min={0}
                step="0.01"
                value={customizationFee}
                onChange={(e) => setCustomizationFee(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-customization-cost">Custo da personalização</Label>
              <Input
                id="edit-customization-cost"
                type="number"
                min={0}
                step="0.01"
                value={customizationCost}
                onChange={(e) => setCustomizationCost(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-pending">Valor pendente (se parcelado)</Label>
              <Input
                id="edit-pending"
                type="number"
                min={0}
                step="0.01"
                value={pendingAmount}
                onChange={(e) => setPendingAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Data da venda</Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-notes">Anotação (opcional)</Label>
            <textarea
              id="edit-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSaleButton({
  sale,
  onConfirm,
  deleting,
}: {
  sale: Sale;
  onConfirm: (id: string) => Promise<unknown>;
  deleting: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Excluir venda"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir esta venda?</AlertDialogTitle>
          <AlertDialogDescription>
            {sale.quantity}x lançada em {new Date(sale.sold_at).toLocaleString("pt-BR")}, no valor de{" "}
            {formatPrice(sale.total_sale_amount)}. Essa ação não pode ser desfeita e vai recalcular
            os totais do dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            onClick={() => void onConfirm(sale.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Cartão de "A receber": um por cliente/venda, com total, pago e falta.
// O pagamento (parcial ou total) é abatido das camisas por trás.
function PendingGroupCard({
  group,
  productNameById,
  receiving,
  onReceive,
}: {
  group: { key: string; customerName: string | null; sales: Sale[] };
  productNameById: Map<string, string>;
  receiving: boolean;
  onReceive: (amount: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("");

  const total = group.sales.reduce((sum, s) => sum + Number(s.total_sale_amount), 0);
  const falta = group.sales.reduce((sum, s) => sum + Number(s.pending_amount), 0);

  async function confirm() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Informe quanto o cliente pagou");
      return;
    }
    if (value > falta + 0.005) {
      toast.error("O valor é maior do que o que falta receber");
      return;
    }
    await onReceive(Math.min(value, falta));
    setPaying(false);
    setAmount("");
  }

  return (
    <li className="rounded-xl border border-amber-200/70 bg-white/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-amber-900">{group.customerName ?? "Sem nome"}</p>
          <p className="text-xs text-amber-700/80">
            {new Date(group.sales[0].sold_at).toLocaleDateString("pt-BR")} · {group.sales.length}{" "}
            {group.sales.length === 1 ? "camisa" : "camisas"}
          </p>
        </div>
        <span className="shrink-0 font-semibold text-amber-700">Falta {formatPrice(falta)}</span>
      </div>
      <p className="mt-1 text-xs text-amber-800/80">
        Total {formatPrice(total)} · Pago {formatPrice(total - falta)}
      </p>

      {paying ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={0}
            step="0.01"
            max={falta}
            placeholder="Quanto pagou? 0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 w-40 bg-white"
            autoFocus
          />
          <Button size="sm" onClick={confirm} disabled={receiving}>
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPaying(false);
              setAmount("");
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPaying(true)} disabled={receiving}>
            Receber pagamento
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReceive(falta)}
            disabled={receiving}
            className="text-amber-800"
          >
            Receber tudo
          </Button>
          {group.sales.length > 1 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-amber-800 hover:underline"
            >
              {open ? "ocultar camisas" : "ver camisas"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      {open && (
        <ul className="mt-3 space-y-1 border-t border-amber-200/60 pt-2 text-xs text-amber-900">
          {group.sales.map((s) => (
            <li key={s.id} className="flex justify-between gap-3">
              <span className="min-w-0 break-words">
                {s.quantity}x {productNameById.get(s.product_id) ?? "Produto"}
                {s.notes ? ` — ${s.notes}` : ""}
              </span>
              <span className="shrink-0">
                {Number(s.pending_amount) > 0 ? `falta ${formatPrice(s.pending_amount)}` : "pago"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Um "item" de camisa dentro do lançamento — cada um vira, na hora de
// enviar, uma chamada separada a registerSale (uma linha na tabela
// "sales"). Isso permite lançar 2, 3 ou mais camisas diferentes numa
// venda só, sem perder a data/anotação compartilhada entre elas.
type SaleItemDraft = {
  key: string;
  productId: string;
  quantity: string;
  costPrice: string;
  salePrice: string;
  customizationFee: string;
  customizationCost: string;
  notes: string;
};

let itemKeySeq = 0;
function emptySaleItem(): SaleItemDraft {
  itemKeySeq += 1;
  return {
    key: `item-${itemKeySeq}`,
    productId: "",
    quantity: "1",
    costPrice: "",
    salePrice: "",
    customizationFee: "0",
    customizationCost: "0",
    notes: "",
  };
}

// Valor "cheio" de um item (preço unitário x quantidade + acréscimo de
// personalização) — usado só pra ratear o valor pendente da venda entre
// as camisas na hora de enviar; é a mesma conta que o banco faz pra
// total_sale_amount (quantity * unit_sale_price + customization_fee).
function itemFullValue(it: SaleItemDraft, productById: Map<string, Product>): number {
  const unitPrice = it.salePrice
    ? Number(it.salePrice)
    : (() => {
        const p = productById.get(it.productId);
        return p ? effectivePrice(p) : 0;
      })();
  return unitPrice * Number(it.quantity || 0) + Number(it.customizationFee || 0);
}

// Divide o valor pendente total da venda entre as camisas, proporcional
// ao valor de cada uma. O último item absorve a diferença de arredondamento,
// pra soma bater exatamente com o total pendente informado.
function splitPendingAmount(items: SaleItemDraft[], productById: Map<string, Product>, totalPending: number): number[] {
  const values = items.map((it) => itemFullValue(it, productById));
  const grandTotal = values.reduce((s, v) => s + v, 0);
  let allocated = 0;
  return values.map((value, idx) => {
    if (idx === values.length - 1) {
      return Math.max(0, Math.round((totalPending - allocated) * 100) / 100);
    }
    const share = grandTotal > 0 ? Math.round(totalPending * (value / grandTotal) * 100) / 100 : 0;
    allocated += share;
    return share;
  });
}

function RegisterSaleForm({
  products,
  onSubmit,
  saving,
}: {
  products: Pick<Product, "id" | "name" | "code" | "price" | "sale_price">[];
  onSubmit: (input: RegisterSaleInput) => Promise<Sale>;
  saving: boolean;
}) {
  const [items, setItems] = useState<SaleItemDraft[]>([emptySaleItem()]);
  const [soldAt, setSoldAt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pendingTotal, setPendingTotal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p as Product])), [products]);
  const grandTotal = useMemo(
    () => items.reduce((sum, it) => sum + itemFullValue(it, productById), 0),
    [items, productById],
  );

  function updateItem(key: string, patch: Partial<SaleItemDraft>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptySaleItem()]);
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const label = items.length > 1 ? ` (camisa ${i + 1})` : "";
      if (!it.productId) {
        toast.error(`Selecione o produto${label}`);
        return;
      }
      const qty = Number(it.quantity);
      if (!qty || qty <= 0) {
        toast.error(`Quantidade inválida${label}`);
        return;
      }
      const fee = Number(it.customizationFee || 0);
      const custoPersonalizacao = Number(it.customizationCost || 0);
      if (fee < 0 || custoPersonalizacao < 0) {
        toast.error(`Os valores de personalização não podem ser negativos${label}`);
        return;
      }
      if (it.costPrice && Number(it.costPrice) < 0) {
        toast.error(`O preço de custo não pode ser negativo${label}`);
        return;
      }
      if (it.salePrice && Number(it.salePrice) < 0) {
        toast.error(`O preço de venda não pode ser negativo${label}`);
        return;
      }
    }

    const totalPending = Number(pendingTotal || 0);
    if (totalPending < 0) {
      toast.error("O valor pendente não pode ser negativo");
      return;
    }
    if (totalPending > grandTotal + 0.01) {
      toast.error("O valor pendente não pode ser maior que o total da venda");
      return;
    }

    setSubmitting(true);
    let savedCount = 0;
    const savedSales: Sale[] = [];
    // Calculado UMA vez só e reaproveitado em todos os itens do loop —
    // é o que garante que todas as camisas desta venda fiquem com o
    // exato mesmo "sold_at" no banco, mesmo quando o campo de data é
    // deixado em branco (cada chamada a onSubmit roda em um momento
    // levemente diferente, então sem isso cada item pegaria um
    // "agora" próprio). Esse horário idêntico + o nome do comprador é o
    // que permite agrupar as camisas da mesma venda em "Últimas vendas".
    const effectiveSoldAt = soldAt ? new Date(soldAt).toISOString() : new Date().toISOString();
    const pendingPerItem = splitPendingAmount(items, productById, totalPending);
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const sale = await onSubmit({
          productId: it.productId,
          quantity: Number(it.quantity),
          customizationFee: Number(it.customizationFee || 0),
          customizationCost: Number(it.customizationCost || 0),
          unitCostPrice: it.costPrice ? Number(it.costPrice) : undefined,
          unitSalePrice: it.salePrice ? Number(it.salePrice) : undefined,
          pendingAmount: pendingPerItem[i],
          soldAt: effectiveSoldAt,
          customerName: customerName.trim() || undefined,
          notes: it.notes.trim() || undefined,
        });
        savedSales.push(sale);
        savedCount += 1;
      }

      // Venda(s) salvas — dispara o aviso de WhatsApp pro dono e pro sócio.
      // Não é aguardado nem bloqueia o reset do formulário: se o aviso
      // falhar (CallMeBot fora do ar, secrets não configurados etc.), a
      // venda já está salva de qualquer forma, então isso só fica registrado
      // no console (ver notifySale em src/lib/finance.ts).
      const productNameById = new Map(products.map((p) => [p.id, p.name]));
      void notifySale({
        items: savedSales.map((sale) => ({
          productName: productNameById.get(sale.product_id) ?? "Produto",
          quantity: sale.quantity,
          totalSaleAmount: Number(sale.total_sale_amount),
          totalProfitAmount: Number(sale.total_profit_amount),
          notes: sale.notes ?? null,
        })),
        totalAmount: savedSales.reduce((sum, s) => sum + Number(s.total_sale_amount), 0),
        totalProfit: savedSales.reduce((sum, s) => sum + Number(s.total_profit_amount), 0),
        customerName: customerName.trim() || null,
        soldAt: savedSales[0]?.sold_at ?? null,
      });

      setItems([emptySaleItem()]);
      setSoldAt("");
      setCustomerName("");
      setPendingTotal("");
    } catch {
      // As camisas já enviadas com sucesso ficaram salvas no banco — tira
      // elas da lista pra não arriscar lançar de novo, e deixa o resto
      // (incluindo a que falhou) pra corrigir e reenviar. O toast de erro
      // específico já é disparado pelo onSubmit (mutation) lá no dashboard.
      if (savedCount > 0) {
        const alreadyAllocated = pendingPerItem.slice(0, savedCount).reduce((s, v) => s + v, 0);
        setItems((prev) => prev.slice(savedCount));
        setPendingTotal((prev) => {
          const remaining = Number(prev || 0) - alreadyAllocated;
          return remaining > 0 ? remaining.toFixed(2) : "";
        });
        toast.error(
          `${savedCount} de ${items.length} camisa(s) já foram lançadas antes do erro — ajuste e envie o restante.`,
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const busy = saving || submitting;

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Lançar venda</h2>
        {items.length > 1 && (
          <span className="text-xs text-muted-foreground">{items.length} camisas nesta venda</span>
        )}
      </div>

      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={it.key} className="rounded-xl border border-border p-4">
            {items.length > 1 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Camisa {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(it.key)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover camisa ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Label htmlFor={`sale-product-${it.key}`}>Produto vendido</Label>
                <ProductCombobox
                  id={`sale-product-${it.key}`}
                  products={products}
                  value={it.productId}
                  onChange={(v) => updateItem(it.key, { productId: v })}
                />
              </div>
              <div>
                <Label htmlFor={`sale-qty-${it.key}`}>Quantidade</Label>
                <Input
                  id={`sale-qty-${it.key}`}
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateItem(it.key, { quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`sale-sale-price-${it.key}`}>Preço de venda (un.)</Label>
                <Input
                  id={`sale-sale-price-${it.key}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Valor do site"
                  value={it.salePrice}
                  onChange={(e) => updateItem(it.key, { salePrice: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Vendeu por outro valor? Preencha aqui. Em branco, usa o preço do produto.
                </p>
              </div>

              <div>
                <Label htmlFor={`sale-cost-price-${it.key}`}>Preço de custo (un.)</Label>
                <Input
                  id={`sale-cost-price-${it.key}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Do cadastro"
                  value={it.costPrice}
                  onChange={(e) => updateItem(it.key, { costPrice: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Produto sem custo cadastrado? Informe aqui.
                </p>
              </div>
              <div>
                <Label htmlFor={`sale-customization-${it.key}`}>Acréscimo personalização</Label>
                <Input
                  id={`sale-customization-${it.key}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={it.customizationFee}
                  onChange={(e) => updateItem(it.key, { customizationFee: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Quanto você cobrou a mais.</p>
              </div>
              <div>
                <Label htmlFor={`sale-customization-cost-${it.key}`}>Custo da personalização</Label>
                <Input
                  id={`sale-customization-cost-${it.key}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={it.customizationCost}
                  onChange={(e) => updateItem(it.key, { customizationCost: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Quanto isso custou pra você.</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Label htmlFor={`sale-item-notes-${it.key}`}>Anotação desta camisa (opcional)</Label>
                <textarea
                  id={`sale-item-notes-${it.key}`}
                  rows={2}
                  placeholder="Ex.: nome e número na camisa, tamanho, forma de pagamento combinada, etc."
                  value={it.notes}
                  onChange={(e) => updateItem(it.key, { notes: e.target.value })}
                  className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addItem} className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar outra camisa
      </Button>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total desta venda</span>
          <span className="font-semibold">{formatPrice(grandTotal)}</span>
        </div>
        <div className="mt-3">
          <Label htmlFor="sale-pending-total">Valor pendente desta venda (se parcelado)</Label>
          <Input
            id="sale-pending-total"
            type="number"
            min={0}
            step="0.01"
            max={grandTotal || undefined}
            placeholder="0,00"
            value={pendingTotal}
            onChange={(e) => setPendingTotal(e.target.value)}
            className="max-w-xs"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Deixe em branco se já recebeu tudo. Se a venda tiver mais de uma camisa, esse valor é
            dividido automaticamente entre elas, proporcional ao preço de cada uma.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="sale-customer">Nome do comprador (opcional)</Label>
        <Input
          id="sale-customer"
          type="text"
          placeholder="Ex.: João Silva"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="max-w-xs"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Preenchendo, todas as camisas desta venda aparecem agrupadas em "Últimas vendas".
        </p>
      </div>

      <div>
        <Label htmlFor="sale-date">Data da venda</Label>
        <Input
          id="sale-date"
          type="datetime-local"
          value={soldAt}
          onChange={(e) => setSoldAt(e.target.value)}
          className="max-w-xs"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Deixe em branco pra usar agora. Preencha pra lançar uma venda de outro dia/mês. Vale pra
          todas as camisas desta venda.
        </p>
      </div>

      <Button type="submit" disabled={busy}>
        {items.length > 1 ? `Lançar ${items.length} vendas` : "Lançar venda"}
      </Button>
    </form>
  );
}
