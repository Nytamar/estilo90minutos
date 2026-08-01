import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Acesso administrativo — ${siteConfig.name}` },
      { name: "description", content: "Área restrita para gestão do catálogo da loja." },
      { property: "og:title", content: `Acesso administrativo — ${siteConfig.name}` },
      { property: "og:description", content: "Login do painel da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp({
            ...parsed.data,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "login" ? "Bem-vindo!" : "Conta criada!");
    void navigate({ to: "/admin" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="text-4xl">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesso restrito à administração da loja.
      </p>
      <form onSubmit={onSubmit} className="surface-card mt-8 space-y-4 rounded-2xl p-6">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {mode === "login" ? "Entrar" : "Cadastrar"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-primary"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Não tenho conta" : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}
