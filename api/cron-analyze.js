const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://virtual-office-seven-psi.vercel.app";

async function fetchMetrics(account) {
  try {
    const res = await fetch(`${BASE_URL}/api/meta-ads?account=${account}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[cron-analyze] fetchMetrics ${account} error:`, err.message);
    return null;
  }
}

async function getKb() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge_base?agent_id=eq.claudin-ads&select=content&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    return Array.isArray(data) && data[0]?.content ? data[0].content : "";
  } catch {
    return "";
  }
}

async function saveToHistory(message) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/chat_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        agent_id: "claudin-ads",
        role: "assistant",
        message,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("[cron-analyze] saveToHistory error:", err.message);
  }
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[cron-analyze] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurado");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[cron-analyze] Telegram error:", data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[cron-analyze] Telegram fetch error:", err.message);
    return false;
  }
}

function formatMetricsText(account, data) {
  if (!data || data.error) return `Conta ${account.toUpperCase()}: erro ao buscar métricas.`;
  const campaigns = data.campaigns ?? [];
  if (!campaigns.length) return `Conta ${account.toUpperCase()}: nenhuma campanha ativa.`;

  const lines = [`Conta ${account.toUpperCase()}:`];
  for (const campaign of campaigns) {
    lines.push(`  Campanha: ${campaign.name}`);
    for (const adset of campaign.adsets ?? []) {
      lines.push(`    Conjunto: ${adset.name}`);
      for (const ad of adset.ads ?? []) {
        lines.push(`      Anúncio: ${ad.ad_name}`);
        lines.push(`        Gasto: ${ad.spend} | Impressões: ${ad.impressions} | Cliques: ${ad.clicks} | CTR: ${ad.ctr} | CPC: ${ad.cpc} | CPM: ${ad.cpm}`);
        lines.push(`        Leads: ${ad.leads ?? 0} | CPL: ${ad.cpl ?? "—"} | Frequência: ${ad.frequency ?? "—"}`);
      }
    }
  }
  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const [ca2Data, ca1Data, kbContent] = await Promise.all([
    fetchMetrics("ca2"),
    fetchMetrics("ca1"),
    getKb(),
  ]);

  const metricsText = [
    formatMetricsText("ca2", ca2Data),
    formatMetricsText("ca1", ca1Data),
  ].join("\n\n");

  const userContent = [
    "Métricas atuais (últimos 7 dias):\n",
    metricsText,
    kbContent ? `\nBase de conhecimento / regras do operador:\n${kbContent}` : "",
  ].filter(Boolean).join("\n");

  const systemPrompt =
    "Você é o CLAUDIN ADS, agente proativo de Meta Ads do ecossistema VALTIX. Analise as métricas abaixo das duas contas de anúncio e com base no contexto da base de conhecimento, identifique: oportunidades, riscos, anomalias ou sugestões. Se não houver nada relevante, responda apenas: NADA_RELEVANTE. Se houver, explique de forma direta e técnica em português.";

  let analysis;
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!claudeRes.ok) throw new Error(`Claude error: ${claudeRes.status}`);
    const claudeData = await claudeRes.json();
    analysis = claudeData.content[0].text.trim();
  } catch (err) {
    console.error("[cron-analyze] Claude error:", err.message);
    return res.status(500).json({ analyzed: false, error: err.message });
  }

  if (analysis === "NADA_RELEVANTE") {
    console.log("[cron-analyze] Nada relevante encontrado.");
    return res.status(200).json({ analyzed: true, notified: false, message: "NADA_RELEVANTE" });
  }

  await saveToHistory(analysis);

  const telegramText = `🤖 CLAUDIN ADS:\n\n${analysis}`;
  const notified = await sendTelegram(telegramText);

  console.log(`[cron-analyze] Análise enviada. Telegram: ${notified}`);
  return res.status(200).json({ analyzed: true, notified, message: analysis });
}
