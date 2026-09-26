import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { taxonomiesQuery } from "@/lib/catalog";
import type { Taxonomy } from "@/lib/catalog";
import { uploadTaxonomyLogo } from "@/lib/storage";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/taxonomias")({
  component: AdminTaxonomias,
});

const groups: { type: Taxonomy["type"]; label: string }[] = [
  { type: "category", label: "Categorias" },
  { type: "brand", label: "Marcas" },
  { type: "club", label: "Clubes" },
  { type: "league", label: "Ligas" },
  { type: "country", label: "Países" },
  { type: "season", label: "Temporadas" },
];

// Nesses grupos vale a pena ter logo/escudo pra usar nas vitrines
// "Navegue pelas ligas" / "por times" / "por seleções" do site.
const TYPES_WITH_LOGO: Taxonomy["type"][] = ["club", "league", "country"];

function AdminTaxonomias() {
  const qc = useQueryClient();
  const { data: taxonomies = [] } = useQuery(taxonomiesQuery());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["taxonomies"] });

  const add = useMutation({
    mutationFn: async ({ type, name }: { type: Taxonomy["type"]; name: string }) => {
      const { error } = await supabase
        .from("taxonomies")
        .insert({ type, name, slug: slugify(name) });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adicionado");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("taxonomies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setRegion = useMutation({
    mutationFn: async ({ id, region }: { id: string; region: Taxonomy["region"] }) => {
      const { error } = await supabase.from("taxonomies").update({ region }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const setLogo = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const url = await uploadTaxonomyLogo(file);
      const { error } = await supabase.from("taxonomies").update({ image_url: url }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Logo atualizada");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setUploadingId(null),
  });

  async function handleLogoChange(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingId(id);
    await setLogo.mutateAsync({ id, file });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Categorias, marcas e mais</h1>
      <p className="text-sm text-muted-foreground">
        Em <strong>Clubes</strong> e <strong>Ligas</strong>, você pode subir um logo/escudo — ele
        aparece nas vitrines "Navegue pelas ligas" e "Navegue por times" da home. Em{" "}
        <strong>Clubes</strong>, marque também se é um time nacional ou europeu, pra ele cair na
        lista certa.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g.type} className="surface-card rounded-xl p-5">
            <h2 className="font-display text-xl">{g.label}</h2>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder={`Novo item em ${g.label.toLowerCase()}`}
                value={drafts[g.type] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [g.type]: e.target.value }))}
              />
              <Button
                size="icon"
                aria-label="Adicionar"
                onClick={() => {
                  const name = (drafts[g.type] ?? "").trim();
                  if (!name) return;
                  add.mutate({ type: g.type, name });
                  setDrafts((d) => ({ ...d, [g.type]: "" }));
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {taxonomies
                .filter((t) => t.type === g.type)
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {TYPES_WITH_LOGO.includes(g.type) && (
                        <>
                          <button
                            type="button"
                            onClick={() => fileInputs.current[t.id]?.click()}
                            className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary"
                            aria-label={`Trocar logo de ${t.name}`}
                          >
                            {uploadingId === t.id ? (
                              <span className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground" />
                            ) : t.image_url ? (
                              <img src={t.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <input
                            ref={(el) => {
                              fileInputs.current[t.id] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLogoChange(t.id, e)}
                          />
                        </>
                      )}
                      <span className="truncate">{t.name}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {g.type === "club" && (
                        <select
                          value={t.region ?? ""}
                          onChange={(e) =>
                            setRegion.mutate({
                              id: t.id,
                              region: (e.target.value || null) as Taxonomy["region"],
                            })
                          }
                          className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                        >
                          <option value="">Sem região</option>
                          <option value="nacional">Nacional</option>
                          <option value="europeu">Europeu</option>
                        </select>
                      )}
                      <button
                        onClick={() => remove.mutate(t.id)}
                        aria-label={`Remover ${t.name}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
