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
import { Lock, LogOut, ShieldCheck, Trash2, Pencil } from "lucide-react";
import { useFinancialPin } from "@/hooks/useFinancialPin";
import { productsQuery } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  deleteSale,
  financialByProductQuery,
  financialDailyQuery,
  pendingSalesQuery,
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
    <form onSubmit={handleSubmit} className="surface-card grid gap-4 rounded-xl p-5 sm:grid-cols-[1fr_1fr_auto_auto]">
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
  const { data: recentSales = [] } = useQuery(recentSalesQuery());
  const { data: pendingSales = [] } = useQuery(pendingSalesQuery());
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

  const { mutate: markReceived } = useMutation({
    mutationFn: (id: string) => updateSale(id, { pendingAmount: 0 }),
    onSuccess: () => {
      toast.success("Marcado como recebido");
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: ["sales-pending"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
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

      {/* A receber */}
      {pendingSales.length > 0 && (
        <div className="surface-card rounded-xl border border-warning/30 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">A receber</h2>
            <span className="text-warning">
              {formatPrice(pendingSales.reduce((sum, s) => sum + Number(s.pending_amount), 0))}
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            {pendingSales.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-2">
                <div className="min-w-0">
                  <p>{new Date(s.sold_at).toLocaleDateString("pt-BR")}</p>
                  {s.customer_name && (
                    <p className="text-xs text-muted-foreground">{s.customer_name}</p>
                  )}
                  {s.notes && <p className="text-xs italic text-muted-foreground">{s.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-warning">{formatPrice(s.pending_amount)}</span>
                  <Button size="sm" variant="outline" onClick={() => markReceived(s.id)}>
                    Marcar como recebido
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <div className="min-w-0">
                <p>{new Date(s.sold_at).toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">
                  {s.quantity}x · custo {formatPrice(s.unit_cost_price)} · venda {formatPrice(s.unit_sale_price)}
                  {Number(s.customization_fee) > 0 && (
                    <> · personalização +{formatPrice(s.customization_fee)}</>
                  )}
                  {Number(s.customization_cost) > 0 && (
                    <> (custo {formatPrice(s.customization_cost)})</>
                  )}
                </p>
                {s.notes && <p className="mt-0.5 truncate text-xs italic text-muted-foreground">{s.notes}</p>}
                {Number(s.pending_amount) > 0 && (
                  <p className="mt-0.5 text-xs font-medium text-warning">
                    Falta receber {formatPrice(s.pending_amount)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-primary">{formatPrice(s.total_profit_amount)}</span>
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
            </li>
          ))}
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

function RegisterSaleForm({
  products,
  onSubmit,
  saving,
}: {
  products: { id: string; name: string; code: string }[];
  onSubmit: (input: RegisterSaleInput) => Promise<unknown>;
  saving: boolean;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [customizationFee, setCustomizationFee] = useState("0");
  const [customizationCost, setCustomizationCost] = useState("0");
  const [pendingAmount, setPendingAmount] = useState("");
  const [notes, setNotes] = useState("");

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
    const fee = Number(customizationFee || 0);
    const custoPersonalizacao = Number(customizationCost || 0);
    if (fee < 0 || custoPersonalizacao < 0) {
      toast.error("Os valores de personalização não podem ser negativos");
      return;
    }
    if (costPrice && Number(costPrice) < 0) {
      toast.error("O preço de custo não pode ser negativo");
      return;
    }
    if (salePrice && Number(salePrice) < 0) {
      toast.error("O preço de venda não pode ser negativo");
      return;
    }
    const pending = Number(pendingAmount || 0);
    if (pending < 0) {
      toast.error("O valor pendente não pode ser negativo");
      return;
    }

    await onSubmit({
      productId,
      quantity: qty,
      customizationFee: fee,
      customizationCost: custoPersonalizacao,
      unitCostPrice: costPrice ? Number(costPrice) : undefined,
      unitSalePrice: salePrice ? Number(salePrice) : undefined,
      pendingAmount: pending,
      notes: notes.trim() || undefined,
    });

    setQuantity("1");
    setCostPrice("");
    setSalePrice("");
    setCustomizationFee("0");
    setCustomizationCost("0");
    setPendingAmount("");
    setNotes("");
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-4 rounded-xl p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Label htmlFor="sale-product">Produto vendido</Label>
          <ProductCombobox
            id="sale-product"
            products={products}
            value={productId}
            onChange={setProductId}
          />
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
        <div>
          <Label htmlFor="sale-sale-price">Preço de venda (un.)</Label>
          <Input
            id="sale-sale-price"
            type="number"
            min={0}
            step="0.01"
            placeholder="Valor do site"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Vendeu por outro valor? Preencha aqui. Em branco, usa o preço do produto.
          </p>
        </div>

        <div>
          <Label htmlFor="sale-cost-price">Preço de custo (un.)</Label>
          <Input
            id="sale-cost-price"
            type="number"
            min={0}
            step="0.01"
            placeholder="Do cadastro"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Produto sem custo cadastrado? Informe aqui.
          </p>
        </div>
        <div>
          <Label htmlFor="sale-customization">Acréscimo personalização</Label>
          <Input
            id="sale-customization"
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            value={customizationFee}
            onChange={(e) => setCustomizationFee(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Quanto você cobrou a mais.</p>
        </div>
        <div>
          <Label htmlFor="sale-customization-cost">Custo da personalização</Label>
          <Input
            id="sale-customization-cost"
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            value={customizationCost}
            onChange={(e) => setCustomizationCost(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Quanto isso custou pra você.</p>
        </div>
        <div>
          <Label htmlFor="sale-pending">Valor pendente (se parcelado)</Label>
          <Input
            id="sale-pending"
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            value={pendingAmount}
            onChange={(e) => setPendingAmount(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Deixe em branco se já recebeu tudo.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="sale-notes">Anotação (opcional)</Label>
        <textarea
          id="sale-notes"
          rows={2}
          placeholder="Ex.: nome e número na camisa, forma de pagamento combinada, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <Button type="submit" disabled={saving}>
        Lançar venda
      </Button>
    </form>
  );
}
