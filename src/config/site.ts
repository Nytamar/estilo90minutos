/**
 * Configuração central da loja.
 * Altere apenas este arquivo para trocar o número de WhatsApp, nome e contatos.
 */
export const siteConfig = {
  name: "Estilo 90 Minutos",
  shortName: "E90",
  description:
    "Camisas de futebol nacionais, europeias, seleções e retrô. Peça pelo WhatsApp com atendimento direto.",
  /**
   * Logo do site. O arquivo fica em `public/logo.png` — para trocar a logo,
   * basta substituir esse arquivo no GitHub (mesmo nome) ou apontar aqui para
   * outro arquivo colocado dentro da pasta `public/` (ex.: "/logo-nova.png").
   */
  logo: "/logo.png",
  /** Número do WhatsApp que recebe os pedidos (DDI + DDD + número, só dígitos). */
  whatsappNumber: "5581997530414",
  email: "estillo90minutos@gmail.com",
  instagram: "https://www.instagram.com/estilo90minutoss/",
  instagramHandle: "@estilo90minutoss",
  city: "Ipojuca - Nossa Senhora do Ó",

} as const;

export const SIZES = ["P", "M", "G", "GG", "EXG"] as const;
