import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_BUCKET = "product-images";

/** ~10 anos, para links que não expiram na prática. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

/** Acima disso, a imagem é redimensionada/comprimida antes do upload. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_IF_UNDER_BYTES = 400 * 1024; // já é leve, não vale reprocessar

function extOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "jpg";
}

/**
 * Redimensiona e comprime a imagem no navegador antes do upload.
 * Fotos de celular costumam vir com 3000px+ de largura e vários MB —
 * isso é o principal motivo do site demorar a carregar na primeira
 * visita. Reduzindo aqui, toda foto nova sobe mais leve.
 * Se algo der errado (formato não suportado, etc.), sobe o arquivo
 * original sem quebrar o upload.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  if (file.size < SKIP_IF_UNDER_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file; // só usa se realmente ficou menor

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Recorta as bordas transparentes de uma imagem PNG, deixando só a área
 * onde tem conteúdo de fato — com uma margem pequena. Isso resolve escudos
 * que vêm com bastante "espaço vazio" ao redor: mesmo cabendo na mesma
 * caixinha, ficavam visualmente menores que escudos já recortados rente.
 * Se a imagem não tiver transparência (JPEG, fundo sólido, etc.), devolve
 * o arquivo original sem alterar.
 */
async function trimTransparentPadding(file: File): Promise<File> {
  if (file.type !== "image/png" && file.type !== "image/webp") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const ALPHA_THRESHOLD = 10;
    let minX = width,
      minY = height,
      maxX = -1,
      maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) return file; // imagem 100% transparente — nada pra recortar

    const margin = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
    minX = Math.max(0, minX - margin);
    minY = Math.max(0, minY - margin);
    maxX = Math.min(width - 1, maxX + margin);
    maxY = Math.min(height - 1, maxY + margin);

    const trimmedW = maxX - minX + 1;
    const trimmedH = maxY - minY + 1;
    if (trimmedW >= width && trimmedH >= height) return file; // já estava rente

    const out = document.createElement("canvas");
    out.width = trimmedW;
    out.height = trimmedH;
    const outCtx = out.getContext("2d");
    if (!outCtx) return file;
    outCtx.drawImage(canvas, minX, minY, trimmedW, trimmedH, 0, 0, trimmedW, trimmedH);

    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, file.type));
    if (!blob) return file;
    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
}

/**
 * Envia uma imagem para o Storage e devolve uma URL utilizável no site.
 * Usa a URL pública quando o bucket é público; caso contrário gera uma URL
 * assinada de longa duração.
 */
export async function uploadImage(file: File, folder = ""): Promise<string> {
  const optimized = await compressImage(file);
  const prefix = folder ? `${folder.replace(/\/+$/, "")}/` : "";
  const path = `${prefix}${crypto.randomUUID()}.${extOf(optimized)}`;
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, optimized, { cacheControl: "31536000", upsert: false, contentType: optimized.type });
  if (error) throw error;

  const publicUrl = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
  return publicUrl;
}

/** Upload de logo/escudo (liga, clube, país) — recorta o espaço vazio ao redor primeiro. */
export async function uploadTaxonomyLogo(file: File): Promise<string> {
  const trimmed = await trimTransparentPadding(file);
  return uploadImage(trimmed, "taxonomias");
}

/** Upload de foto de produto. */
export function uploadProductImage(file: File): Promise<string> {
  return uploadImage(file, "produtos");
}

/** Upload de imagem de banner da home. */
export function uploadBannerImage(file: File): Promise<string> {
  return uploadImage(file, "banners");
}

/** Upload de imagem de novidade da home. */
export function uploadHomePromotionImage(file: File): Promise<string> {
  return uploadImage(file, "novidades");
}
