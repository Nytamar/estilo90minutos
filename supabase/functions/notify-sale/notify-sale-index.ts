// Edge Function: notify-sale
//
// Dispara um aviso no WhatsApp (via CallMeBot) toda vez que uma venda é
// lançada no painel financeiro — pro dono da loja e pro sócio, cada um no
// seu próprio número.
//
// Como funciona o CallMeBot: é gratuito, mas cada NÚMERO que vai RECEBER
// mensagens precisa gerar sua própria "apikey" uma única vez:
//   1. Salve o contato +34 694 26 48 06 no WhatsApp (número oficial do bot,
//      confirmado em 26/09/2026 — esse número muda de vez em quando, porque
//      a Meta derruba números usados por bots; se parar de responder, veja
//      o número atual em https://www.callmebot.com/blog/free-api-whatsapp-messages/).
//   2. Mande a mensagem exata: "I allow callmebot to send me messages"
//      para esse contato, pelo WhatsApp do número que vai receber os avisos
//      (o seu número, depois repita no número do sócio).
//   3. O bot responde com uma apikey (um número). Guarde ela.
//
// Depois disso, configure os secrets desta função (no painel do Supabase,
// em Project Settings > Edge Functions > notify-sale, ou via CLI:
// `supabase secrets set NOME=valor`):
//
//   CALLMEBOT_RECIPIENT_1_PHONE   -> seu número, formato internacional, só dígitos (ex: 5554999998888)
//   CALLMEBOT_RECIPIENT_1_APIKEY  -> a apikey que você recebeu do bot
//   CALLMEBOT_RECIPIENT_2_PHONE   -> número do sócio
//   CALLMEBOT_RECIPIENT_2_APIKEY  -> apikey do sócio
//
// Se algum dos dois pares não estiver configurado, essa pessoa simplesmente
// não recebe o aviso (não quebra nada pros outros).

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SaleItemPayload = {
  productName: string;
  quantity: number;
  totalSaleAmount: number;
  totalProfitAmount: number;
};

type NotifyPayload = {
  items: SaleItemPayload[];
  totalAmount: number;
  totalProfit: number;
  customerName?: string | null;
  notes?: string | null;
  soldAt?: string | null;
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildMessage(payload: NotifyPayload): string {
  const lines: string[] = [];
  lines.push("🧾 *Nova venda lançada*");

  if (payload.soldAt) {
    const d = new Date(payload.soldAt);
    lines.push(`🗓️ ${d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`);
  }
  if (payload.customerName) {
    lines.push(`👤 ${payload.customerName}`);
  }

  lines.push("");
  for (const item of payload.items) {
    lines.push(`• ${item.quantity}x ${item.productName} — ${formatBRL(item.totalSaleAmount)}`);
  }

  lines.push("");
  lines.push(`💰 Total: ${formatBRL(payload.totalAmount)}`);
  lines.push(`📈 Lucro: ${formatBRL(payload.totalProfit)}`);

  if (payload.notes) {
    lines.push("");
    lines.push(`📝 ${payload.notes}`);
  }

  return lines.join("\n");
}

async function sendToCallMeBot(phone: string, apikey: string, text: string): Promise<boolean> {
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("apikey", apikey);
  url.searchParams.set("text", text);

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    // O CallMeBot responde 200 com um HTML mesmo em alguns casos de erro
    // (ex: apikey inválida), então além do status a gente confere se o
    // corpo não indica erro explicitamente.
    const body = await res.text();
    const looksLikeError = /error|invalid|not registered/i.test(body);
    return res.ok && !looksLikeError;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let payload: NotifyPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhum item informado" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const message = buildMessage(payload);

  const recipients = [1, 2]
    .map((n) => ({
      phone: Deno.env.get(`CALLMEBOT_RECIPIENT_${n}_PHONE`),
      apikey: Deno.env.get(`CALLMEBOT_RECIPIENT_${n}_APIKEY`),
    }))
    .filter((r): r is { phone: string; apikey: string } => Boolean(r.phone && r.apikey));

  if (recipients.length === 0) {
    // Nenhum destinatário configurado ainda — não é um erro fatal, só não
    // tem pra quem avisar. Devolve 200 pra não travar o lançamento da venda.
    return new Response(
      JSON.stringify({ sent: 0, total: 0, warning: "Nenhum destinatário configurado (ver secrets CALLMEBOT_RECIPIENT_*)." }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const results = await Promise.all(
    recipients.map((r) => sendToCallMeBot(r.phone, r.apikey, message)),
  );
  const sent = results.filter(Boolean).length;

  return new Response(JSON.stringify({ sent, total: recipients.length }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
