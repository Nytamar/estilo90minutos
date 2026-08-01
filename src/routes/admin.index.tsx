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

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: products = [], isLoading } = useQuery(productsQuery(false));

  const outOfStock = products.filter((p) => totalStock(p) === 0);
  const lowStock = products.filter((p) => {
    const t = totalStock(p);
    return t > 0 && t <= 3;
  });
  const sold = products.reduce((s, p) => s + p.sold_count, 0);
  const topSellers = [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 6);
  const recent = [...products]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  const cards = [
    { label: "Produtos cadastrados", value: products.length, icon: Shirt },
    { label: "Produtos vendidos", value: sold, icon: TrendingUp },
    { label: "Sem estoque", value: outOfStock.length, icon: PackageX },
    { label: "Estoque baixo", value: lowStock.length, icon: AlertTriangle },
  ];

  if (isLoading) return <p className="text-muted-foreground">Carregando dados...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="surface-card rounded-xl p-5">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-display text-3xl">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="surface-card rounded-xl p-5">
        <h2 className="mb-4 font-display text-xl">Mais vendidos</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSellers.map((p) => ({ name: p.code, vendas: p.sold_count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.33 0.045 259)" />
              <XAxis dataKey="name" stroke="oklch(0.72 0.022 255)" fontSize={12} />
              <YAxis stroke="oklch(0.72 0.022 255)" fontSize={12} />
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

        <div className="surface-card rounded-xl p-5">
          <h2 className="mb-3 font-display text-xl">Atenção no estoque</h2>
          <ul className="space-y-2 text-sm">
            {[...lowStock, ...outOfStock].slice(0, 8).map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="truncate">{p.name}</span>
                <span
                  className={
                    totalStock(p) === 0 ? "shrink-0 text-destructive" : "shrink-0 text-warning"
                  }
                >
                  {totalStock(p)} un.
                </span>
              </li>
            ))}
            {lowStock.length + outOfStock.length === 0 && (
              <li className="text-muted-foreground">Tudo certo com o estoque.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
