const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";

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
    // Busca content atual
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const kbContent = await getKb();

  const systemPrompt = [
    "Você é o CLAUDIN ADS, um agente autônomo de gestão de Meta Ads dentro do ecossistema VALTIX. Responda de forma direta, técnica e concisa em português. Você gerencia campanhas no Meta Ads. Quando o operador definir regras, estratégias ou decisões, você deve reconhecer que isso será salvo automaticamente na base de conhecimento.",
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

  // Classificador de memória — roda em paralelo sem bloquear a resposta
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
