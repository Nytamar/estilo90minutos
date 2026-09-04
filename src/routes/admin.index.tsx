import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, PackageX, Shirt, TrendingUp } from "lucide-react";
import { productsQuery, totalStock } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { financialByProductQuery } from "@/lib/finance";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: products = [], isLoading } = useQuery(productsQuery(false));
  // Reaproveita os totais já calculados no financeiro (só a quantidade
  // vendida por produto — sem mostrar valores financeiros aqui no
  // dashboard geral, que fica fora do PIN do financeiro).
  const { data: byProduct = [] } = useQuery(financialByProductQuery());

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

  const cards = [
    { label: "Produtos cadastrados", value: products.length, icon: Shirt },
    { label: "Produtos vendidos", value: sold, icon: TrendingUp, anchor: "#vendidos" },
    { label: "Sem estoque", value: outOfStock.length, icon: PackageX, anchor: "#sem-estoque" },
    { label: "Estoque baixo", value: lowStock.length, icon: AlertTriangle, anchor: "#estoque-baixo" },
  ];

  if (isLoading) return <p className="text-muted-foreground">Carregando dados...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) =>
          c.anchor ? (
            <a key={c.label} href={c.anchor} className="surface-card hover-lift block rounded-xl p-5">
              <c.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-3xl">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </a>
          ) : (
            <div key={c.label} className="surface-card rounded-xl p-5">
              <c.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-3xl">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          ),
        )}
      </div>

      <div className="surface-card rounded-xl p-5">
        <h2 className="mb-4 font-display text-xl">Mais vendidos</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={soldByProduct.slice(0, 8).map((p) => ({ name: p.product_name, vendas: p.units_sold }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.33 0.045 259)" />
              <XAxis dataKey="name" stroke="oklch(0.72 0.022 255)" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="oklch(0.72 0.022 255)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.22 0.047 259)",
                  border: "1px solid oklch(0.33 0.045 259)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="vendas" fill="oklch(0.79 0.132 85)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-xl p-5">
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

        <div id="vendidos" className="surface-card scroll-mt-24 rounded-xl p-5">
          <h2 className="mb-3 font-display text-xl">Produtos vendidos</h2>
          <ul className="space-y-2 text-sm">
            {soldByProduct.map((p) => (
              <li key={p.product_id} className="flex justify-between gap-2">
                <span className="truncate">{p.product_name}</span>
                <span className="shrink-0 text-muted-foreground">{p.units_sold} un.</span>
              </li>
            ))}
            {soldByProduct.length === 0 && (
              <li className="text-muted-foreground">Nenhuma venda lançada ainda.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div id="sem-estoque" className="surface-card scroll-mt-24 rounded-xl p-5">
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

        <div id="estoque-baixo" className="surface-card scroll-mt-24 rounded-xl p-5">
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
