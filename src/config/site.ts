/**
 * Configuração central da loja.
 * Altere apenas este arquivo para trocar o número de WhatsApp, nome e contatos.
 */
export const siteConfig = {
  name: "Estilo 90 Minutos",
  shortName: "E90",
  description:
    "Camisas de futebol nacionais, europeias, seleções e retrô. Peça pelo WhatsApp com atendimento direto.",
  /** Número do WhatsApp que recebe os pedidos (DDI + DDD + número, só dígitos). */
  whatsappNumber: "5581997530414",
  email: "contato@estilo90minutos.com.br",
  instagram: "https://instagram.com",
  city: "Recife - PE",
} as const;

export const SIZES = ["P", "M", "G", "GG", "XGG"] as const;
