import { siteConfig } from "@/config/site";
import { formatPrice } from "./format";

export type WhatsAppOrder = {
  name: string;
  code: string;
  price: number;
  size: string;
  quantity: number;
  url: string;
};

/** Monta o link do WhatsApp já com todos os dados do pedido preenchidos. */
export function buildWhatsAppOrderLink(order: WhatsAppOrder): string {
  const lines = [
    `Olá! Quero pedir pela ${siteConfig.name}:`,
    "",
    `*Produto:* ${order.name}`,
    `*Código:* ${order.code}`,
    `*Tamanho:* ${order.size}`,
    `*Quantidade:* ${order.quantity}`,
    `*Preço unitário:* ${formatPrice(order.price)}`,
    `*Total:* ${formatPrice(order.price * order.quantity)}`,
    `*Link:* ${order.url}`,
  ];
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildWhatsAppContactLink(message: string): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
