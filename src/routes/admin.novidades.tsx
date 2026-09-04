import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Pencil, Trash2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  homePromotionsQuery,
  type HomePromotion,
} from "@/lib/home-promotions";
import { uploadHomePromotionImage } from "@/lib/storage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/novidades")({
  component: NovidadesAdmin,
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

function NovidadesAdmin() {
  const qc = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery(
    homePromotionsQuery(false),
  );

  const [form, setForm] = useState<Form>(emptyForm);

  const [uploading, setUploading] = useState<
    "desktop" | "mobile" | null
  >(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.image_url.trim()) {
        throw new Error("Envie ou informe a imagem da novidade.");
      }

      const payload = {
        title: form.title.trim(),
        image_url: form.image_url.trim(),
        mobile_image_url:
          form.mobile_image_url.trim() || null,
        link_url: form.link_url.trim() || null,
        new_tab: form.new_tab,
        position: Number(form.position) || 0,
        active: form.active,
      };

      const { error } = form.id
        ? await supabase
            .from("home_promotions")
            .update(payload)
            .eq("id", form.id)
        : await supabase
            .from("home_promotions")
            .insert(payload);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success(
        form.id
          ? "Novidade atualizada!"
          : "Novidade adicionada!",
      );

      setForm(emptyForm);

      void qc.invalidateQueries({
        queryKey: ["home-promotions"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("home_promotions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Novidade excluída.");

      void qc.invalidateQueries({
        queryKey: ["home-promotions"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  async function handleUpload(
    files: FileList | null,
    target: "desktop" | "mobile",
  ) {
    const file = files?.[0];

    if (!file) return;

    setUploading(target);

    try {
      const url = await uploadHomePromotionImage(file);

      set(
        target === "desktop"
          ? "image_url"
          : "mobile_image_url",
        url,
      );

      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao enviar a imagem.",
      );
    } finally {
      setUploading(null);
    }
  }

  function edit(promotion: HomePromotion) {
    setForm({
      id: promotion.id,
      title: promotion.title,
      image_url: promotion.image_url,
      mobile_image_url:
        promotion.mobile_image_url ?? "",
      link_url: promotion.link_url ?? "",
      new_tab: promotion.new_tab,
      position: String(promotion.position),
      active: promotion.active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl">
          Novidades da home
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre as artes promocionais exibidas
          na faixa de novidades da página inicial.
          Você pode adicionar quantas quiser.
        </p>
      </div>

      {/* Formulário */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="surface-card grid gap-4 rounded-xl p-6 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="title">
            Título
          </Label>

          <Input
            id="title"
            placeholder="Ex.: Promoção Adidas"
            value={form.title}
            onChange={(event) =>
              set("title", event.target.value)
            }
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Usado apenas internamente e como texto
            alternativo da imagem.
          </p>
        </div>

        {/* Imagem desktop */}
        <ImageField
          id="image_url"
          label="Imagem da novidade"
          value={form.image_url}
          uploading={uploading === "desktop"}
          onUpload={(files) =>
            void handleUpload(files, "desktop")
          }
          onChange={(value) =>
            set("image_url", value)
          }
        />

        {/* Imagem mobile */}
        <ImageField
          id="mobile_image_url"
          label="Imagem mobile — opcional"
          value={form.mobile_image_url}
          uploading={uploading === "mobile"}
          onUpload={(files) =>
            void handleUpload(files, "mobile")
          }
          onChange={(value) =>
            set("mobile_image_url", value)
          }
        />

        {/* Link */}
        <div>
          <Label htmlFor="link_url">
            Link ao clicar
          </Label>

          <Input
            id="link_url"
            placeholder="/catalogo ou https://..."
            value={form.link_url}
            onChange={(event) =>
              set("link_url", event.target.value)
            }
          />
        </div>

        {/* Ordem */}
        <div>
          <Label htmlFor="position">
            Ordem
          </Label>

          <Input
            id="position"
            type="number"
            min="0"
            value={form.position}
            onChange={(event) =>
              set("position", event.target.value)
            }
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Menor número aparece primeiro.
          </p>
        </div>

        {/* Nova aba */}
        <div className="flex items-center gap-3">
          <Switch
            id="new_tab"
            checked={form.new_tab}
            onCheckedChange={(value) =>
              set("new_tab", value)
            }
          />

          <Label htmlFor="new_tab">
            Abrir link em nova aba
          </Label>
        </div>

        {/* Ativo */}
        <div className="flex items-center gap-3">
          <Switch
            id="active"
            checked={form.active}
            onCheckedChange={(value) =>
              set("active", value)
            }
          />

          <Label htmlFor="active">
            Novidade ativa
          </Label>
        </div>

        {/* Botões */}
        <div className="flex gap-3 sm:col-span-2">
          <Button
            type="submit"
            disabled={save.isPending}
          >
            {form.id
              ? "Salvar alterações"
              : "Adicionar novidade"}
          </Button>

          {form.id && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForm(emptyForm)}
            >
              Cancelar edição
            </Button>
          )}
        </div>
      </form>

      {/* Lista */}
      <div className="space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Carregando novidades...
          </p>
        )}

        {!isLoading &&
          promotions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma novidade cadastrada.
            </p>
          )}

        {promotions.map((promotion) => (
          <div
            key={promotion.id}
            className="surface-card flex items-center gap-4 rounded-xl p-3"
          >
            <img
              src={promotion.image_url}
              alt={
                promotion.title ||
                "Novidade"
              }
              className="
                h-16
                w-32
                shrink-0
                rounded-md
                object-cover
              "
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {promotion.title ||
                  "(sem título)"}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {promotion.link_url ||
                  "sem link"}
                {" · "}
                ordem {promotion.position}
                {" · "}
                {promotion.active
                  ? "ativo"
                  : "inativo"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar"
              onClick={() =>
                edit(promotion)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir"
              onClick={() =>
                remove.mutate(
                  promotion.id,
                )
              }
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
  onUpload: (
    files: FileList | null,
  ) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
        </Label>

        <label
          className="
            inline-flex
            cursor-pointer
            items-center
            gap-2
            rounded-md
            border
            px-3
            py-1.5
            text-sm
            hover:bg-accent
          "
        >
          <ImagePlus className="h-4 w-4" />

          {uploading
            ? "Enviando..."
            : "Enviar imagem"}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) =>
              onUpload(
                event.target.files,
              )
            }
          />
        </label>
      </div>

      <Input
        id={id}
        className="mt-2"
        placeholder="Cole o link ou envie a imagem"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

      {value && (
        <div className="relative mt-2 w-fit">
          <img
            src={value}
            alt="Prévia"
            className="
              h-20
              max-w-[220px]
              rounded-md
              border
              object-cover
            "
          />

          <button
            type="button"
            aria-label="Remover imagem"
            onClick={() => onChange("")}
            className="
              absolute
              -right-2
              -top-2
              rounded-full
              border
              bg-background
              p-1
              text-muted-foreground
              hover:text-destructive
            "
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
