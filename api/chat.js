const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  // Busca base de conhecimento do Supabase
  let kbContent = "";
  try {
    const kbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge_base?agent_id=eq.claudin-ads&select=content&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const kbData = await kbRes.json();
    if (Array.isArray(kbData) && kbData[0]?.content) kbContent = kbData[0].content;
  } catch {
    // Continua sem base de conhecimento se falhar
  }

  const systemPrompt = [
    "Você é o CLAUDIN ADS, um agente autônomo de gestão de Meta Ads dentro do ecossistema VALTIX. Responda de forma direta, técnica e concisa em português. Você gerencia campanhas no Meta Ads.",
    kbContent ? `Contexto e regras do operador: ${kbContent}` : "",
  ].filter(Boolean).join("\n\n");

  const messages = [
    ...history.map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.content[0].text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
