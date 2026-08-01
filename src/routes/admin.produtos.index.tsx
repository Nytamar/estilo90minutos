import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, totalStock } from "@/lib/catalog";
import { formatPrice, slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/produtos/")({
  component: AdminProdutos,
});

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0]?.split(",").map((h) => h.trim()) ?? [];
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: CsvRow = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function AdminProdutos() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery(productsQuery(false));
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const rows = parseCsv(await file.text());
      for (const row of rows) {
        const name = row["name"];
        const code = row["code"];
        if (!name || !code) continue;
        const { data, error } = await supabase
          .from("products")
          .upsert(
            {
              code,
              name,
              slug: slugify(name),
              description: row["description"] ?? "",
              price: Number(row["price"] ?? 0),
              sale_price: row["sale_price"] ? Number(row["sale_price"]) : null,
              images: row["image"] ? [row["image"]] : [],
            },
            { onConflict: "code" },
          )
          .select("id")
          .single();
        if (error) throw error;
        const sizes = ["P", "M", "G", "GG"]
          .filter((s) => row[`stock_${s}`] !== undefined && row[`stock_${s}`] !== "")
          .map((s, i) => ({
            product_id: data.id,
            size: s,
            stock: Number(row[`stock_${s}`] ?? 0),
            position: i,
          }));
        if (sizes.length > 0) {
          const { error: sizeError } = await supabase
            .from("product_sizes")
            .upsert(sizes, { onConflict: "product_id,size" });
          if (sizeError) throw sizeError;
        }
      }
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} linha(s) importada(s)`);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(`Falha na importação: ${e.message}`),
  });

  function exportCsv() {
    const header = ["code", "name", "price", "sale_price", "stock", "sold_count", "active"];
    const lines = products.map((p) =>
      [
        p.code,
        `"${p.name.replace(/"/g, '""')}"`,
        p.price,
        p.sale_price ?? "",
        totalStock(p),
        p.sold_count,
        p.active ? "sim" : "não",
      ].join(","),
    );
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const list = products.filter((p) =>
    `${p.name} ${p.code}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl">Produtos</h1>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importCsv.mutate(file);
            e.target.value = "";
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Importar CSV
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Exportar
        </Button>
        <Button asChild>
          <Link to="/admin/produtos/$id" params={{ id: "novo" }}>
            <Plus className="mr-2 h-4 w-4" /> Novo produto
          </Link>
        </Button>
      </div>

      <Input
        placeholder="Filtrar por nome ou código..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="surface-card overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Carregando...
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{p.code}</td>
                <td className="px-4 py-3">
                  <Link
                    to="/admin/produtos/$id"
                    params={{ id: p.id }}
                    className="hover:text-primary"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatPrice(p.sale_price ?? p.price)}</td>
                <td className="px-4 py-3">{totalStock(p)}</td>
                <td className="px-4 py-3">
                  {p.active ? (
                    <span className="text-success">Ativo</span>
                  ) : (
                    <span className="text-muted-foreground">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir"
                    onClick={() => {
                      if (confirm(`Excluir "${p.name}"?`)) remove.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        CSV aceito: colunas <code>code,name,price,sale_price,description,image,stock_P,stock_M,stock_G,stock_GG</code>
      </p>
    </div>
  );
}
