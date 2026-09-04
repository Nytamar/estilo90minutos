import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Pencil,
  Trash2,
  X,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  homeTickerMessagesQuery,
  type HomeTickerMessage,
} from "@/lib/home-ticker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/avisos")({
  component: AvisosAdmin,
});

type Form = {
  id: string | null;
  text: string;
  link_url: string;
  new_tab: boolean;
  position: string;
  active: boolean;
};

const emptyForm: Form = {
  id: null,
  text: "",
  link_url: "",
  new_tab: false,
  position: "0",
  active: true,
};

function AvisosAdmin() {
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
  } = useQuery(
    homeTickerMessagesQuery(false),
  );

  const [form, setForm] =
    useState<Form>(emptyForm);

  const set = <K extends keyof Form>(
    key: K,
    value: Form[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.text.trim()) {
        throw new Error(
          "Digite o texto do aviso.",
        );
      }

      const payload = {
        text: form.text.trim(),

        link_url:
          form.link_url.trim() || null,

        new_tab: form.new_tab,

        position:
          Number(form.position) || 0,

        active: form.active,
      };

      const { error } = form.id
        ? await supabase
            .from("home_ticker_messages")
            .update(payload)
            .eq("id", form.id)
        : await supabase
            .from("home_ticker_messages")
            .insert(payload);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success(
        form.id
          ? "Aviso atualizado!"
          : "Aviso adicionado!",
      );

      setForm(emptyForm);

      void queryClient.invalidateQueries({
        queryKey: [
          "home-ticker-messages",
        ],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("home_ticker_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Aviso excluído.");

      void queryClient.invalidateQueries({
        queryKey: [
          "home-ticker-messages",
        ],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function edit(
    message: HomeTickerMessage,
  ) {
    setForm({
      id: message.id,
      text: message.text,
      link_url:
        message.link_url ?? "",
      new_tab: message.new_tab,
      position: String(
        message.position,
      ),
      active: message.active,
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
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl">
              Barra de avisos
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie as frases e avisos
              exibidos na barra animada da
              página inicial.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="
          surface-card
          grid
          gap-5
          rounded-2xl
          p-5
        "
      >

        {/* Texto */}
        <div>
          <Label htmlFor="ticker-text">
            Frase ou aviso
          </Label>

          <Input
            id="ticker-text"
            className="mt-2"
            placeholder="Ex.: FRETE GRÁTIS EM TODAS AS COMPRAS"
            value={form.text}
            onChange={(event) =>
              set(
                "text",
                event.target.value,
              )
            }
          />
        </div>

        {/* Link */}
        <div>
          <Label htmlFor="ticker-link">
            Link opcional
          </Label>

          <Input
            id="ticker-link"
            className="mt-2"
            placeholder="/catalogo ou https://..."
            value={form.link_url}
            onChange={(event) =>
              set(
                "link_url",
                event.target.value,
              )
            }
          />
        </div>

        {/* Opções */}
        <div className="grid gap-5 sm:grid-cols-3">

          <div>
            <Label htmlFor="ticker-position">
              Ordem
            </Label>

            <Input
              id="ticker-position"
              type="number"
              className="mt-2"
              value={form.position}
              onChange={(event) =>
                set(
                  "position",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="flex items-center gap-3 sm:pt-7">
            <Switch
              id="ticker-new-tab"
              checked={form.new_tab}
              onCheckedChange={(value) =>
                set(
                  "new_tab",
                  value,
                )
              }
            />

            <Label htmlFor="ticker-new-tab">
              Abrir link em nova aba
            </Label>
          </div>

          <div className="flex items-center gap-3 sm:pt-7">
            <Switch
              id="ticker-active"
              checked={form.active}
              onCheckedChange={(value) =>
                set(
                  "active",
                  value,
                )
              }
            />

            <Label htmlFor="ticker-active">
              Aviso ativo
            </Label>
          </div>

        </div>

        {/* Botões */}
        <div className="flex gap-3">

          <Button
            type="submit"
            disabled={save.isPending}
          >
            {form.id
              ? "Salvar alterações"
              : "Adicionar aviso"}
          </Button>

          {form.id && (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm(emptyForm)
              }
            >
              Cancelar
            </Button>
          )}

        </div>
      </form>

      {/* Lista */}
      <div className="space-y-3">

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Carregando avisos...
          </p>
        )}

        {!isLoading &&
          messages.length === 0 && (
            <div className="surface-card rounded-xl p-6 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum aviso cadastrado.
              </p>
            </div>
          )}

        {messages.map((message) => (
          <div
            key={message.id}
            className="
              surface-card
              flex
              items-center
              gap-4
              rounded-xl
              p-4
            "
          >

            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 flex-1">

              <p className="font-semibold">
                {message.text}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                ordem {message.position}
                {" · "}
                {message.active
                  ? "ativo"
                  : "inativo"}

                {message.link_url &&
                  ` · ${message.link_url}`}
              </p>

            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar aviso"
              onClick={() =>
                edit(message)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir aviso"
              onClick={() =>
                remove.mutate(
                  message.id,
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
