const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";
const GRAPH_VERSION = "v25.0";

async function claudeCall(systemPrompt, messages, maxTokens = 1024) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude error: ${res.status}`);
  const data = await res.json();
  return data.content[0].text;
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

async function appendToKb(summary) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge_base?agent_id=eq.claudin-ads&select=content&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    const current = Array.isArray(data) && data[0]?.content ? data[0].content : "";

    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Maceio", dateStyle: "short", timeStyle: "short" });
    const newContent = current
      ? `${current}\n[${timestamp}] ${summary}`
      : `[${timestamp}] ${summary}`;

    await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge_base?agent_id=eq.claudin-ads`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ content: newContent, updated_at: new Date().toISOString() }),
      }
    );
  } catch (err) {
    console.error("[KB] append error:", err.message);
  }
}

async function getMetaContext() {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_CA2;
  if (!token || !accountId) return "";

  try {
    const activeFilter = JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]);

    const campRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/campaigns?fields=id,name&filtering=${encodeURIComponent(activeFilter)}&limit=20&access_token=${token}`
    );
    const campJson = await campRes.json();
    if (campJson.error || !campJson.data?.length) return "";

    const lines = ["Campanhas e conjuntos ativos na conta CA-2:"];
    for (const campaign of campJson.data) {
      lines.push(`  Campanha: "${campaign.name}" (ID: ${campaign.id})`);
      try {
        const adsetRes = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${campaign.id}/adsets?fields=id,name&filtering=${encodeURIComponent(activeFilter)}&limit=20&access_token=${token}`
        );
        const adsetJson = await adsetRes.json();
        for (const adset of adsetJson.data ?? []) {
          lines.push(`    Conjunto: "${adset.name}" (ID: ${adset.id})`);
        }
      } catch {}
    }
    return lines.join("\n");
  } catch (err) {
    console.error("[MetaContext] error:", err.message);
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const [kbContent, metaContext] = await Promise.all([getKb(), getMetaContext()]);

  const systemPrompt = [
    "Você é o CLAUDIN ADS, um agente autônomo de gestão de Meta Ads dentro do ecossistema VALTIX. Responda de forma direta, técnica e concisa em português. Você gerencia campanhas no Meta Ads. Quando o operador definir regras, estratégias ou decisões, você deve reconhecer que isso será salvo automaticamente na base de conhecimento.",
    "Você tem capacidade de executar ações no Meta Ads. Quando o operador pedir para pausar, ativar ou mudar budget, ou quando suas regras da base de conhecimento determinarem uma ação, responda com um bloco JSON especial no formato: <<<ACTION:{\"action\":\"pause_campaign\",\"params\":{\"campaign_id\":\"123\"}}>>> seguido da sua explicação. O frontend vai detectar esse bloco e executar a ação. Ações disponíveis: pause_campaign, activate_campaign, pause_adset, activate_adset, pause_ad, activate_ad, set_budget (requer campaign_id e daily_budget em reais).",
    metaContext || "",
    kbContent ? `Contexto e regras do operador:\n${kbContent}` : "",
  ].filter(Boolean).join("\n\n");

  const messages = [
    ...history.map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: message },
  ];

  let reply;
  try {
    reply = await claudeCall(systemPrompt, messages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Classificador de memória
  let savedToKb = false;
  try {
    const classifierPrompt =
      'Você é um classificador de conversas. Analise a conversa abaixo e decida se contém informação estratégica, regras operacionais, decisões ou estratégias que devem ser salvas permanentemente. Responda APENAS em JSON: {"save": true/false, "summary": "resumo curto do que salvar"}. Se for apenas uma consulta, status check, bate-papo ou pergunta informativa, retorne save: false.';

    const classifierMsg = `Mensagem do operador: ${message}\n\nResposta do agente: ${reply}`;
    const classifierReply = await claudeCall(classifierPrompt, [{ role: "user", content: classifierMsg }], 256);

    const jsonMatch = classifierReply.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.save === true && parsed.summary) {
        await appendToKb(parsed.summary);
        savedToKb = true;
      }
    }
  } catch (err) {
    console.error("[Classifier] error:", err.message);
  }

  return res.status(200).json({ reply, saved_to_kb: savedToKb });
}
