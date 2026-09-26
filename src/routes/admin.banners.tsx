import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadBannerImage } from "@/lib/storage";
import { bannersQuery, type Banner } from "@/lib/banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/banners")({
  component: BannersAdmin,
});

type Form = {
  id: string | null;
  title: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  new_tab: boolean;
  position: string;
  active: boolean;
};

const emptyForm: Form = {
  id: null,
  title: "",
  image_url: "",
  mobile_image_url: "",
  link_url: "",
  new_tab: false,
  position: "0",
  active: true,
};

function BannersAdmin() {
  const qc = useQueryClient();
  const { data: banners = [], isLoading } = useQuery(bannersQuery(false));
  const [form, setForm] = useState<Form>(emptyForm);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.image_url.trim()) throw new Error("Envie ou informe a imagem do banner.");
      const payload = {
        title: form.title.trim(),
        image_url: form.image_url.trim(),
        mobile_image_url: form.mobile_image_url.trim() || null,
        link_url: form.link_url.trim() || null,
        new_tab: form.new_tab,
        position: Number(form.position) || 0,
        active: form.active,
      };
      const { error } = form.id
        ? await supabase.from("banners").update(payload).eq("id", form.id)
        : await supabase.from("banners").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner salvo!");
      setForm(emptyForm);
      void qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner excluído.");
      void qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleUpload(files: FileList | null, target: "desktop" | "mobile") {
    const file = files?.[0];
    if (!file) return;
    setUploading(target);
    try {
      const url = await uploadBannerImage(file);
      set(target === "desktop" ? "image_url" : "mobile_image_url", url);
      toast.success("Imagem enviada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar a imagem");
    } finally {
      setUploading(null);
    }
  }

  function edit(b: Banner) {
    setForm({
      id: b.id,
      title: b.title,
      image_url: b.image_url,
      mobile_image_url: b.mobile_image_url ?? "",
      link_url: b.link_url ?? "",
      new_tab: b.new_tab,
      position: String(b.position),
      active: b.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Banners da home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Banners clicáveis no topo da página inicial. Com mais de um banner, eles passam sozinhos e
          aparecem setas discretas. Tamanho recomendado: 1920×520 px (desktop) e 800×800 px (mobile).
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="surface-card grid gap-4 rounded-xl p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="title">Título (uso interno / texto alternativo)</Label>
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <ImageField
          id="image_url"
          label="Imagem (desktop)"
          value={form.image_url}
          uploading={uploading === "desktop"}
          onUpload={(files) => void handleUpload(files, "desktop")}
          onChange={(v) => set("image_url", v)}
        />
        <ImageField
          id="mobile_image_url"
          label="Imagem (celular) — opcional"
          value={form.mobile_image_url}
          uploading={uploading === "mobile"}
          onUpload={(files) => void handleUpload(files, "mobile")}
          onChange={(v) => set("mobile_image_url", v)}
        />

        <div>
          <Label htmlFor="link_url">Link ao clicar</Label>
          <Input
            id="link_url"
            placeholder="/catalogo?categoria=retro ou https://..."
            value={form.link_url}
            onChange={(e) => set("link_url", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="position">Ordem</Label>
          <Input
            id="position"
            type="number"
            value={form.position}
            onChange={(e) => set("position", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch id="new_tab" checked={form.new_tab} onCheckedChange={(v) => set("new_tab", v)} />
          <Label htmlFor="new_tab">Abrir em nova aba</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="active" checked={form.active} onCheckedChange={(v) => set("active", v)} />
          <Label htmlFor="active">Banner ativo</Label>
        </div>

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            {form.id ? "Salvar alterações" : "Adicionar banner"}
          </Button>
          {form.id && (
            <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>
              Cancelar edição
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && banners.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum banner cadastrado — a home continua com o visual atual.
          </p>
        )}
        {banners.map((b) => (
          <div key={b.id} className="surface-card flex items-center gap-4 rounded-xl p-3">
            <img
              src={b.image_url}
              alt={b.title || "Banner"}
              className="h-16 w-32 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{b.title || "(sem título)"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {b.link_url || "sem link"} · ordem {b.position} · {b.active ? "ativo" : "inativo"}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => edit(b)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir"
              onClick={() => remove.mutate(b.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageField({
  id,
  label,
  value,
  uploading,
  onUpload,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Enviando..." : "Enviar imagem"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </div>
      <Input
        id={id}
        className="mt-2"
        placeholder="Cole o link ou envie a imagem"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <div className="relative mt-2 w-fit">
          <img src={value} alt="Prévia" className="h-20 rounded-md border object-cover" />
          <button
            type="button"
            aria-label="Remover imagem"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full border bg-background p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
