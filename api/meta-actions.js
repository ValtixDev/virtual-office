const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";
const GRAPH_VERSION = "v25.0";

async function logAction(action, result) {
  const message = `AÇÃO EXECUTADA: ${action} → ${result}`;
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
        role: "system",
        message,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("[meta-actions] log error:", err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, params = {} } = req.body ?? {};
  if (!action) return res.status(400).json({ error: "action is required" });

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: "META_ACCESS_TOKEN não configurado" });

  let entityId, body;

  switch (action) {
    case "pause_campaign":
      entityId = params.campaign_id;
      body = new URLSearchParams({ status: "PAUSED", access_token: token });
      break;
    case "activate_campaign":
      entityId = params.campaign_id;
      body = new URLSearchParams({ status: "ACTIVE", access_token: token });
      break;
    case "pause_adset":
      entityId = params.adset_id;
      body = new URLSearchParams({ status: "PAUSED", access_token: token });
      break;
    case "activate_adset":
      entityId = params.adset_id;
      body = new URLSearchParams({ status: "ACTIVE", access_token: token });
      break;
    case "pause_ad":
      entityId = params.ad_id;
      body = new URLSearchParams({ status: "PAUSED", access_token: token });
      break;
    case "activate_ad":
      entityId = params.ad_id;
      body = new URLSearchParams({ status: "ACTIVE", access_token: token });
      break;
    case "set_budget":
      entityId = params.campaign_id;
      const budgetCents = Math.round(parseFloat(params.daily_budget) * 100);
      body = new URLSearchParams({ daily_budget: String(budgetCents), access_token: token });
      break;
    default:
      return res.status(400).json({ error: `Ação desconhecida: ${action}` });
  }

  if (!entityId) return res.status(400).json({ error: "ID do objeto não fornecido nos params" });

  try {
    const graphRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${entityId}`,
      { method: "POST", body }
    );
    const result = await graphRes.json();

    if (result.error) {
      await logAction(action, `ERRO: ${result.error.message}`);
      return res.status(400).json({ success: false, action, result });
    }

    await logAction(action, `OK (id: ${entityId})`);
    return res.status(200).json({ success: true, action, result });
  } catch (err) {
    await logAction(action, `EXCEÇÃO: ${err.message}`);
    return res.status(500).json({ success: false, action, error: err.message });
  }
}
