// CLAUDIN ADS Cron v2
module.exports = async function handler(req, res) {
  try {
    const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
    const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";
    const META_TOKEN = process.env.META_ACCESS_TOKEN;
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

    // Fetch metrics CA-2
    const ca2Res = await fetch("https://graph.facebook.com/v25.0/act_1592970555057745/ads?fields=name,status,insights{spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions}&date_preset=last_7d&filtering=[{\"field\":\"effective_status\",\"operator\":\"IN\",\"value\":[\"ACTIVE\"]}]&access_token=" + META_TOKEN);
    const ca2Data = await ca2Res.json();

    // Fetch KB
    const kbRes = await fetch(SUPABASE_URL + "/rest/v1/knowledge_base?agent_id=eq.claudin-ads&select=content", { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } });
    const kbData = await kbRes.json();
    const kb = kbData[0]?.content || "";

    // Ask Claude
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: "Você é o CLAUDIN ADS, agente proativo de Meta Ads do ecossistema VALTIX. Analise as métricas e com base no contexto da base de conhecimento, identifique oportunidades, riscos ou sugestões. Se não houver nada relevante, responda APENAS: NADA_RELEVANTE. Base de conhecimento: " + kb,
        messages: [{ role: "user", content: "Métricas atuais dos anúncios ativos CA-2: " + JSON.stringify(ca2Data.data?.slice(0, 10)) }]
      })
    });
    const claudeData = await claudeRes.json();
    const reply = claudeData.content?.[0]?.text || "Sem resposta";

    if (!reply.includes("NADA_RELEVANTE")) {
      // Send Telegram
      await fetch("https://api.telegram.org/bot" + TG_TOKEN + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT, text: "🤖 CLAUDIN ADS:\n\n" + reply })
      });

      res.status(200).json({ analyzed: true, notified: true, message: reply });
    } else {
      res.status(200).json({ analyzed: true, notified: false, message: "Nada relevante" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
