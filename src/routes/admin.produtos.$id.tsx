import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { taxonomiesQuery } from "@/lib/catalog";
import type { Product, Taxonomy } from "@/lib/catalog";
import { slugify } from "@/lib/format";
import { SIZES } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: ProdutoEditor,
});

const schema = z.object({
  code: z.string().min(1, "Informe o código"),
  name: z.string().min(3, "Informe o nome"),
  price: z.number().positive("Preço inválido"),
  sale_price: z.number().nullable(),
  description: z.string(),
});

type Form = {
  code: string;
  name: string;
  description: string;
  price: string;
  sale_price: string;
  images: string;
  featured: boolean;
  active: boolean;
  availability: string;
  category_id: string;
  brand_id: string;
  club_id: string;
  league_id: string;
  country_id: string;
  season_id: string;
};

const emptyForm: Form = {
  code: "",
  name: "",
  description: "",
  price: "",
  sale_price: "",
  images: "",
  featured: false,
  active: true,
  availability: "pronta_entrega",
  category_id: "",
  brand_id: "",
  club_id: "",
  league_id: "",
  country_id: "",
  season_id: "",
};

const relations: { field: keyof Form; type: Taxonomy["type"]; label: string }[] = [
  { field: "category_id", type: "category", label: "Categoria" },
  { field: "brand_id", type: "brand", label: "Marca" },
  { field: "club_id", type: "club", label: "Clube" },
  { field: "league_id", type: "league", label: "Liga" },
  { field: "country_id", type: "country", label: "País" },
  { field: "season_id", type: "season", label: "Temporada" },
];

function ProdutoEditor() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: taxonomies = [] } = useQuery(taxonomiesQuery());

  const [form, setForm] = useState<Form>(emptyForm);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { data: product } = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_sizes(id, size, stock, position)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as Product;
    },
  });

  useEffect(() => {
    if (!product) return;
    setForm({
      code: product.code,
      name: product.name,
      description: product.description,
      price: String(product.price),
      sale_price: product.sale_price != null ? String(product.sale_price) : "",
      images: product.images.join("\n"),
      featured: product.featured,
      active: product.active,
      availability: (product as { availability?: string }).availability ?? "pronta_entrega",
      category_id: product.category_id ?? "",
      brand_id: product.brand_id ?? "",
      club_id: product.club_id ?? "",
      league_id: product.league_id ?? "",
      country_id: product.country_id ?? "",
      season_id: product.season_id ?? "",
    });
    const map: Record<string, number> = {};
    product.product_sizes.forEach((s) => {
      map[s.size] = s.stock;
    });
    setStock(map);
  }, [product]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      code: form.code.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      description: form.description,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSaving(true);
    const payload = {
      ...parsed.data,
      slug: slugify(form.name),
      images: form.images
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean),
      featured: form.featured,
      active: form.active,
      availability: form.availability,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      club_id: form.club_id || null,
      league_id: form.league_id || null,
      country_id: form.country_id || null,
      season_id: form.season_id || null,
    };

    const { data, error } = isNew
      ? await supabase.from("products").insert(payload).select("id").single()
      : await supabase.from("products").update(payload).eq("id", id).select("id").single();

    if (error || !data) {
      setSaving(false);
      toast.error(error?.message ?? "Erro ao salvar");
      return;
    }

    const sizeRows = SIZES.map((s, i) => ({
      product_id: data.id,
      size: s,
      stock: stock[s] ?? 0,
      position: i,
    }));
    const { error: sizeError } = await supabase
      .from("product_sizes")
      .upsert(sizeRows, { onConflict: "product_id,size" });

    setSaving(false);
    if (sizeError) {
      toast.error(sizeError.message);
      return;
    }
    toast.success("Produto salvo!");
    void qc.invalidateQueries({ queryKey: ["products"] });
    void navigate({ to: "/admin/produtos" });
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="text-3xl">{isNew ? "Novo produto" : "Editar produto"}</h1>

      <div className="surface-card grid gap-4 rounded-xl p-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Código</Label>
          <Input id="code" value={form.code} onChange={(e) => set("code", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sale">Preço promocional (R$)</Label>
          <Input
            id="sale"
            type="number"
            step="0.01"
            value={form.sale_price}
            onChange={(e) => set("sale_price", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="desc">Descrição</Label>
          <Textarea
            id="desc"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="imgs">Imagens (uma URL por linha)</Label>
          <Textarea
            id="imgs"
            rows={3}
            placeholder="/images/jersey-1.jpg"
            value={form.images}
            onChange={(e) => set("images", e.target.value)}
          />
        </div>

        {relations.map((r) => (
          <div key={r.field}>
            <Label htmlFor={r.field}>{r.label}</Label>
            <select
              id={r.field}
              value={form[r.field] as string}
              onChange={(e) => set(r.field, e.target.value as never)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">—</option>
              {taxonomies
                .filter((t) => t.type === r.type)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        ))}

        <div>
          <Label htmlFor="availability">Disponibilidade</Label>
          <select
            id="availability"
            value={form.availability}
            onChange={(e) => set("availability", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="pronta_entrega">Pronta entrega</option>
            <option value="encomenda">Sob encomenda</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="featured"
            checked={form.featured}
            onCheckedChange={(v) => set("featured", v)}
          />
          <Label htmlFor="featured">Destaque na home</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="active" checked={form.active} onCheckedChange={(v) => set("active", v)} />
          <Label htmlFor="active">Produto ativo</Label>
        </div>
      </div>

      <div className="surface-card rounded-xl p-6">
        <h2 className="font-display text-xl">Estoque por tamanho</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-5">
          {SIZES.map((s) => (
            <div key={s}>
              <Label htmlFor={`stock-${s}`}>{s}</Label>
              <Input
                id={`stock-${s}`}
                type="number"
                min={0}
                value={stock[s] ?? 0}
                onChange={(e) => setStock((m) => ({ ...m, [s]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          Salvar produto
        </Button>
        <Button type="button" variant="ghost" onClick={() => void navigate({ to: "/admin/produtos" })}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
