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
import { AlertTriangle, PackageX, Shirt, TrendingUp } from "lucide-react";
import { productsQuery, totalStock } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { financialByProductQuery, financialDailyQuery } from "@/lib/finance";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Dashboard() {
  const { data: products = [], isLoading } = useQuery(productsQuery(false));
  // Só a quantidade vendida por produto — nada de valores em dinheiro aqui,
  // isso fica só na aba Financeiro.
  const { data: byProduct = [] } = useQuery(financialByProductQuery());
  const { data: daily = [] } = useQuery(financialDailyQuery());

  const outOfStock = products.filter((p) => totalStock(p) === 0);
  const lowStock = products.filter((p) => {
    const t = totalStock(p);
    return t > 0 && t <= 3;
  });
  const soldByProduct = [...byProduct].sort((a, b) => b.units_sold - a.units_sold);
  const sold = soldByProduct.reduce((s, p) => s + Number(p.units_sold ?? 0), 0);
  const recent = [...products]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  // Últimos 14 dias — quantidade de vendas por dia (sem valores em R$).
  const chartData = [...daily]
    .reverse()
    .slice(-14)
    .map((d) => {
      const date = new Date(`${d.day}T00:00:00`);
      return {
        label: `${WEEKDAY[date.getDay()]} ${date.getDate()}`,
        vendas: Number(d.total_sales ?? 0),
      };
    });

  const kpis = [
    { label: "Produtos cadastrados", value: products.length, icon: Shirt, bar: "bg-sky-400" },
    { label: "Produtos vendidos", value: sold, icon: TrendingUp, anchor: "#vendidos", bar: "bg-emerald-400" },
    { label: "Sem estoque", value: outOfStock.length, icon: PackageX, anchor: "#sem-estoque", bar: "bg-rose-400" },
    { label: "Estoque baixo", value: lowStock.length, icon: AlertTriangle, anchor: "#estoque-baixo", bar: "bg-amber-400" },
  ];

  if (isLoading) return <p className="text-muted-foreground">Carregando dados...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Dashboard</h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const CardTag = k.anchor ? "a" : "div";
          return (
            <CardTag
              key={k.label}
              {...(k.anchor ? { href: k.anchor } : {})}
              className="surface-card hover-lift flex items-center justify-between rounded-2xl p-5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <p className="mt-2 font-display text-3xl">{k.value}</p>
              </div>
              <div className="flex h-10 shrink-0 items-end">
                <span className={`h-8 w-2 rounded-full ${k.bar}`} />
              </div>
            </CardTag>
          );
        })}
      </div>

      {/* Linha do tempo de vendas (quantidade de peças, sem valores) */}
      <div className="surface-card rounded-2xl p-5">
        <h2 className="mb-4 font-display text-xl">Linha do tempo de vendas</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="fillVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.6 0.125 78)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="oklch(0.6 0.125 78)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value} peça(s)`, "Vendas"]}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="vendas"
                stroke="oklch(0.6 0.125 78)"
                strokeWidth={2.5}
                fill="url(#fillVendas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-xl">Últimos cadastrados</h2>
          <ul className="space-y-2 text-sm">
            {recent.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <Link
                  to="/admin/produtos/$id"
                  params={{ id: p.id }}
                  className="truncate hover:text-primary"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 text-muted-foreground">{formatPrice(p.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div id="vendidos" className="surface-card scroll-mt-24 rounded-2xl p-5">
          <h2 className="mb-3 font-display text-xl">Mais vendidos</h2>
          <ul className="space-y-3 text-sm">
            {soldByProduct.slice(0, 8).map((p, i) => {
              const ratio = soldByProduct[0]?.units_sold ? p.units_sold / soldByProduct[0].units_sold : 0;
              return (
                <li key={p.product_id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <span className="mr-2 text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      {p.product_name}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{p.units_sold} un.</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.max(4, ratio * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {soldByProduct.length === 0 && (
              <li className="text-muted-foreground">Nenhuma venda lançada ainda.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id="sem-estoque" className="surface-card scroll-mt-24 rounded-2xl p-5">
          <h2 className="mb-3 font-display text-xl">Sem estoque</h2>
          <ul className="space-y-2 text-sm">
            {outOfStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <Link
                  to="/admin/produtos/$id"
                  params={{ id: p.id }}
                  className="truncate hover:text-primary"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 text-destructive">0 un.</span>
              </li>
            ))}
            {outOfStock.length === 0 && (
              <li className="text-muted-foreground">Nenhum produto sem estoque.</li>
            )}
          </ul>
        </div>

        <div id="estoque-baixo" className="surface-card scroll-mt-24 rounded-2xl p-5">
          <h2 className="mb-3 font-display text-xl">Estoque baixo</h2>
          <ul className="space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <Link
                  to="/admin/produtos/$id"
                  params={{ id: p.id }}
                  className="truncate hover:text-primary"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 text-warning">{totalStock(p)} un.</span>
              </li>
            ))}
            {lowStock.length === 0 && (
              <li className="text-muted-foreground">Nenhum produto com estoque baixo.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
