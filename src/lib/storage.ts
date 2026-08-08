import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_BUCKET = "product-images";

/** ~10 anos, para links que não expiram na prática. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

function extOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "jpg";
}

/**
 * Envia uma imagem para o Storage e devolve uma URL utilizável no site.
 * Usa a URL pública quando o bucket é público; caso contrário gera uma URL
 * assinada de longa duração.
 */
export async function uploadImage(file: File, folder = ""): Promise<string> {
  const prefix = folder ? `${folder.replace(/\/+$/, "")}/` : "";
  const path = `${prefix}${crypto.randomUUID()}.${extOf(file)}`;
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;

  const publicUrl = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
  try {
    const res = await fetch(publicUrl, { method: "HEAD" });
    if (res.ok) return publicUrl;
  } catch {
    /* bucket privado — segue para URL assinada */
  }

  const { data, error: signErr } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !data) throw signErr ?? new Error("Não foi possível gerar o link da imagem.");
  return data.signedUrl;
}

/** Upload de foto de produto. */
export function uploadProductImage(file: File): Promise<string> {
  return uploadImage(file, "produtos");
}

/** Upload de imagem de banner da home. */
export function uploadBannerImage(file: File): Promise<string> {
  return uploadImage(file, "banners");
}
