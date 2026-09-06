import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { productsQuery, taxonomiesQuery } from "@/lib/catalog";
import { bannersQuery } from "@/lib/banners";
import { homePromotionsQuery } from "@/lib/home-promotions";
import {
  listAllStorageFiles,
  storagePathFromUrl,
  deleteStorageFiles,
  type StorageFile,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/limpeza")({
  component: AdminLimpeza,
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AdminLimpeza() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sem onlyActive=false aqui: produtos/banners/promoções inativos ainda
  // "usam" a imagem deles — só apagamos o que não está em NENHUM lugar.
  const { data: products = [] } = useQuery(productsQuery(false));
  const { data: taxonomies = [] } = useQuery(taxonomiesQuery());
  const { data: banners = [] } = useQuery(bannersQuery(false));
  const { data: promotions = [] } = useQuery(homePromotionsQuery(false));

  const {
    data: files = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["storage-files"],
    queryFn: () => listAllStorageFiles(),
  });

  const usedPaths = useMemo(() => {
    const urls: (string | null | undefined)[] = [
      ...products.flatMap((p) => p.images),
      ...taxonomies.map((t) => t.image_url),
      ...banners.flatMap((b) => [b.image_url, b.mobile_image_url]),
      ...promotions.flatMap((h) => [h.image_url, h.mobile_image_url]),
    ];
    const set = new Set<string>();
    for (const url of urls) {
      if (!url) continue;
      const path = storagePathFromUrl(url);
      if (path) set.add(path);
    }
    return set;
  }, [products, taxonomies, banners, promotions]);

  const unused: StorageFile[] = files.filter((f) => !usedPaths.has(f.path));
  const totalUnusedSize = unused.reduce((s, f) => s + f.size, 0);

  const { mutateAsync: removeFiles, isPending: deleting } = useMutation({
    mutationFn: deleteStorageFiles,
    onSuccess: () => {
      toast.success("Imagens excluídas");
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ["storage-files"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    },
  });

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === unused.length ? new Set() : new Set(unused.map((f) => f.path))));
  }

  const loading = isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Limpeza de imagens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fotos que já foram enviadas (de produtos, banners, categorias, novidades) mas não estão
          mais ligadas a nada no site — sobraram de itens editados ou excluídos. Excluir aqui não
          afeta nada visível no site.
        </p>
      </div>

      <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-5">
        <div>
          <p className="font-display text-2xl">{loading ? "…" : unused.length}</p>
          <p className="text-xs text-muted-foreground">
            imagem(ns) não usada(s) {!loading && `· ${formatBytes(totalUnusedSize)} no total`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Verificando..." : "Verificar de novo"}
          </Button>
          {unused.length > 0 && (
            <Button type="button" variant="outline" onClick={toggleAll}>
              {selected.size === unused.length ? "Desmarcar tudo" : "Selecionar tudo"}
            </Button>
          )}
          {selected.size > 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => removeFiles([...selected])}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir {selected.size} selecionada(s)
            </Button>
          )}
        </div>
      </div>

      {!loading && unused.length === 0 && (
        <p className="surface-card rounded-xl p-5 text-muted-foreground">
          Nenhuma imagem sobrando por enquanto — tudo que está no Storage está sendo usado em
          algum lugar do site.
        </p>
      )}

      {unused.length > 0 && (
        <div className="surface-card overflow-hidden rounded-xl">
          <div className="flex items-start gap-2 border-b border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            Confira antes de excluir — a exclusão é permanente e não tem como desfazer.
          </div>
          <ul className="divide-y divide-border">
            {unused.map((f) => (
              <li key={f.path} className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={selected.has(f.path)}
                  onChange={() => toggle(f.path)}
                  className="h-4 w-4"
                />
                <img
                  src={`https://xmccwxdzvrclhaydojtz.supabase.co/storage/v1/object/public/product-images/${f.path}`}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{f.path}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
