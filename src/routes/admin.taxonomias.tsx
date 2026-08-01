import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { taxonomiesQuery } from "@/lib/catalog";
import type { Taxonomy } from "@/lib/catalog";
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

function AdminTaxonomias() {
  const qc = useQueryClient();
  const { data: taxonomies = [] } = useQuery(taxonomiesQuery());
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const add = useMutation({
    mutationFn: async ({ type, name }: { type: Taxonomy["type"]; name: string }) => {
      const { error } = await supabase
        .from("taxonomies")
        .insert({ type, name, slug: slugify(name) });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adicionado");
      void qc.invalidateQueries({ queryKey: ["taxonomies"] });
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
      void qc.invalidateQueries({ queryKey: ["taxonomies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Categorias, marcas e mais</h1>
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
            <ul className="mt-4 space-y-1 text-sm">
              {taxonomies
                .filter((t) => t.type === g.type)
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span>{t.name}</span>
                    <button
                      onClick={() => remove.mutate(t.id)}
                      aria-label={`Remover ${t.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
