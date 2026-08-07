import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, LogOut, Shirt, Tags, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useAdminSession } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo" },
      { name: "description", content: "Gestão de produtos, estoque e catálogo da loja." },
      { property: "og:title", content: "Painel administrativo" },
      { property: "og:description", content: "Área restrita de gestão." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Shirt, exact: false },
  { to: "/admin/taxonomias", label: "Categorias & marcas", icon: Tags, exact: false },
  { to: "/admin/cupons", label: "Cupons", icon: Ticket, exact: false },
] as const;

function AdminLayout() {
  const { session, isAdmin, loading } = useAdminSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading) {
    return <div className="px-6 py-20 text-muted-foreground">Verificando acesso...</div>;
  }

  if (!session) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl">Acesso restrito</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sua conta ({session.user.email}) ainda não tem permissão de administrador. Se você é o
          dono da loja e este é o primeiro acesso, clique abaixo para se tornar administrador.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            onClick={async () => {
              const { data, error } = await supabase.rpc("claim_admin");
              if (error || !data) {
                toast.error("Já existe um administrador nesta loja.");
                return;
              }
              toast.success("Acesso de administrador liberado!");
              window.location.reload();
            }}
          >
            Tornar-me administrador
          </Button>
          <Button variant="outline" onClick={() => void supabase.auth.signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
      <aside className="lg:w-56">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              activeProps={{ className: "bg-accent text-primary" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
          <button
            onClick={() => void supabase.auth.signOut()}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
