import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  PackageX,
  Percent,
  Shirt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { productsQuery, totalStock } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  financialByProductQuery,
  financialDailyQuery,
  pendingSalesQuery,
  recentSalesQuery,
} from "@/lib/finance";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Dashboard() {
  const { data: products = [], isLoading } = useQuery(productsQuery(false));
  const { data: byProduct = [] } = useQuery(financialByProductQuery());
  const { data: daily = [] } = useQuery(financialDailyQuery());
  const { data: recentSales = [] } = useQuery(recentSalesQuery(6));
  const { data: pending = [] } = useQuery(pendingSalesQuery());

  const outOfStock = products.filter((p) => totalStock(p) === 0);
  const lowStock = products.filter((p) => {
    const t = totalStock(p);
    return t > 0 && t <= 3;
  });
  const soldByProduct = [...byProduct].sort((a, b) => b.units_sold - a.units_sold);
  const recent = [...products]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  // --- Números gerais, pra alimentar os cards de KPI e o gráfico ---
  const totalRevenue = byProduct.reduce((s, p) => s + Number(p.revenue ?? 0), 0);
  const totalProfit = byProduct.reduce((s, p) => s + Number(p.profit ?? 0), 0);
  const totalUnits = byProduct.reduce((s, p) => s + Number(p.units_sold ?? 0), 0);
  const avgTicket = totalUnits > 0 ? totalRevenue / totalUnits : 0;
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const pendingAmount = pending.reduce((s, p) => s + Number(p.pending_amount ?? 0), 0);

  // Últimos 14 dias, em ordem cronológica, pra "linha do tempo" de vendas.
  const chartData = [...daily]
    .reverse()
    .slice(-14)
    .map((d) => {
      const date = new Date(`${d.day}T00:00:00`);
      return {
        label: `${WEEKDAY[date.getDay()]} ${date.getDate()}`,
        receita: Number(d.revenue ?? 0),
        custo: Number(d.cost ?? 0),
      };
    });
  const maxRevenue = Math.max(1, ...chartData.map((d) => d.receita));

  const kpis = [
    {
      label: "Faturamento",
      value: formatPrice(totalRevenue),
      icon: Wallet,
      bar: "bg-emerald-400",
      ratio: 1,
    },
    {
      label: "Lucro líquido",
      value: formatPrice(totalProfit),
      icon: TrendingUp,
      bar: "bg-violet-400",
      ratio: totalRevenue > 0 ? Math.min(1, totalProfit / totalRevenue) : 0,
    },
    {
      label: "Peças vendidas",
      value: totalUnits,
      icon: Shirt,
      bar: "bg-sky-400",
      ratio: 1,
    },
    {
      label: "Ticket médio",
      value: formatPrice(avgTicket),
      icon: Percent,
      bar: "bg-amber-400",
      ratio: 0.6,
    },
  ];

  if (isLoading) return <p className="text-muted-foreground">Carregando dados...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Dashboard</h1>
        <span className="hidden text-xs text-muted-foreground sm:block">
          Últimos 14 dias de movimento
        </span>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex items-center justify-between rounded-2xl bg-white p-5 text-slate-900 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{k.label}</p>
              <p className="mt-2 truncate text-2xl font-semibold">{k.value}</p>
            </div>
            <div className="flex h-10 shrink-0 items-end">
              <span
                className={`w-2 rounded-full ${k.bar}`}
                style={{ height: `${8 + k.ratio * 32}px` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gráfico principal: linha do tempo de receita x custo */}
        <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Linha do tempo de vendas</h2>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-violet-600">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Receita
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Custo
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="fillReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillCusto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0f4" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${Math.round(v / 1)}`}
                />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #eef0f4",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  }}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#fillReceita)"
                />
                <Area
                  type="monotone"
                  dataKey="custo"
                  stroke="#fb7185"
                  strokeWidth={2}
                  fill="url(#fillCusto)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coluna direita: resumo em card + últimas vendas */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b1a63] via-[#5b34c9] to-[#8b5cf6] p-5 text-white shadow-sm">
            <p className="text-xs font-medium text-white/70">Margem média</p>
            <p className="mt-2 text-3xl font-bold">{avgMargin.toFixed(0)}%</p>
            <p className="mt-1 text-xs text-white/60">
              {totalProfit >= 0 ? "de lucro sobre o faturamento" : "prejuízo no período"}
            </p>
            {pendingAmount > 0 && (
              <p className="mt-4 border-t border-white/15 pt-3 text-xs text-white/70">
                {formatPrice(pendingAmount)} ainda a receber
              </p>
            )}
          </div>

          <div className="flex-1 rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Últimas vendas</h2>
              <Link to="/admin/financeiro" className="text-xs font-medium text-violet-600 hover:underline">
                Ver tudo
              </Link>
            </div>
            <ul className="space-y-3">
              {recentSales.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-bold text-violet-600">
                    {(s.customer_name || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.customer_name || "Cliente não identificado"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(s.sold_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatPrice(s.total_sale_amount)}
                  </span>
                </li>
              ))}
              {recentSales.length === 0 && (
                <li className="text-sm text-slate-400">Nenhuma venda lançada ainda.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Ranking de produtos + situação de estoque */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div id="vendidos" className="scroll-mt-24 rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Mais vendidos</h2>
          <ul className="space-y-3">
            {soldByProduct.slice(0, 6).map((p, i) => {
              const ratio = totalUnits > 0 ? p.units_sold / (soldByProduct[0]?.units_sold || 1) : 0;
              return (
                <li key={p.product_id} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-xs font-semibold text-slate-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{p.product_name}</span>
                      <span className="shrink-0 text-slate-400">{p.units_sold} un.</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-violet-500"
                        style={{ width: `${Math.max(4, ratio * 100)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
            {soldByProduct.length === 0 && (
              <li className="text-sm text-slate-400">Nenhuma venda lançada ainda.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Situação do estoque</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="#sem-estoque"
              className="rounded-xl bg-rose-50 p-4 transition-colors hover:bg-rose-100"
            >
              <PackageX className="h-4 w-4 text-rose-500" />
              <p className="mt-2 text-2xl font-bold text-rose-600">{outOfStock.length}</p>
              <p className="text-xs text-rose-500">Sem estoque</p>
            </a>
            <a
              href="#estoque-baixo"
              className="rounded-xl bg-amber-50 p-4 transition-colors hover:bg-amber-100"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="mt-2 text-2xl font-bold text-amber-600">{lowStock.length}</p>
              <p className="text-xs text-amber-600">Estoque baixo</p>
            </a>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500">Produtos cadastrados</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
            {totalProfit >= 0 ? (
              <ArrowUpRight className="h-6 w-6 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-6 w-6 text-rose-500" />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Últimos cadastrados</h2>
          <ul className="space-y-2 text-sm">
            {recent.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <Link
                  to="/admin/produtos/$id"
                  params={{ id: p.id }}
                  className="truncate hover:text-violet-600"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 text-slate-400">{formatPrice(p.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="sem-estoque" className="scroll-mt-24 rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Sem estoque</h2>
          <ul className="space-y-2 text-sm">
            {outOfStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <Link
                  to="/admin/produtos/$id"
                  params={{ id: p.id }}
                  className="truncate hover:text-violet-600"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 text-rose-500">0 un.</span>
              </li>
            ))}
            {outOfStock.length === 0 && (
              <li className="text-slate-400">Nenhum produto sem estoque.</li>
            )}
          </ul>
        </div>
      </div>

      <div id="estoque-baixo" className="scroll-mt-24 rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Estoque baixo</h2>
        <ul className="space-y-2 text-sm">
          {lowStock.map((p) => (
            <li key={p.id} className="flex justify-between gap-2">
              <Link
                to="/admin/produtos/$id"
                params={{ id: p.id }}
                className="truncate hover:text-violet-600"
              >
                {p.name}
              </Link>
              <span className="shrink-0 text-amber-600">{totalStock(p)} un.</span>
            </li>
          ))}
          {lowStock.length === 0 && (
            <li className="text-slate-400">Nenhum produto com estoque baixo.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
