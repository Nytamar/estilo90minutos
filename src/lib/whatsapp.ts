import { siteConfig } from "@/config/site";
import { formatPrice } from "./format";
import type { CartItem } from "@/hooks/useCart";

export type WhatsAppOrder = {
  name: string;
  code: string;
  price: number;
  size: string;
  quantity: number;
  url: string;
  customization?: { name: string; number: string } | null;
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
  ];
  if (order.customization) {
    lines.push(
      `*Personalização:* Sim`,
      `*Nome na camisa:* ${order.customization.name || "-"}`,
      `*Número:* ${order.customization.number || "-"}`,
    );
  } else {
    lines.push(`*Personalização:* Não`);
  }
  lines.push(`*Link:* ${order.url}`);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildWhatsAppContactLink(message: string): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Monta UM único link de pedido pro WhatsApp com todos os itens do carrinho. */
export function buildWhatsAppCartLink(
  items: CartItem[],
  coupon?: { code: string; discount_percent: number } | null,
): string {
  const lines = [`Olá! Quero fechar este pedido na ${siteConfig.name}:`, ""];

  let total = 0;
  items.forEach((item, i) => {
    const lineTotal = item.unitPrice * item.quantity;
    total += lineTotal;
    lines.push(
      `*${i + 1}. ${item.name}* (${item.code})`,
      `Tamanho: ${item.size} · Qtd: ${item.quantity} · ${formatPrice(item.unitPrice)} un.`,
    );
    if (item.customization) {
      lines.push(
        `Personalização: ${item.customization.name || "-"} / ${item.customization.number || "-"}`,
      );
    }
    lines.push("");
  });

  if (coupon) {
    const discount = total * (coupon.discount_percent / 100);
    lines.push(`*Subtotal:* ${formatPrice(total)}`);
    lines.push(`*Cupom ${coupon.code}:* -${coupon.discount_percent}% (-${formatPrice(discount)})`);
    lines.push(`*Total com desconto:* ${formatPrice(total - discount)}`);
  } else {
    lines.push(`*Total do pedido:* ${formatPrice(total)}`);
  }
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}
