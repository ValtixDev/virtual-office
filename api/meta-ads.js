const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";
const GRAPH_VERSION = "v25.0";

function extractMetric(insights, field) {
  return insights?.data?.[0]?.[field] ?? null;
}

function extractActions(insights, actionType) {
  const actions = insights?.data?.[0]?.actions ?? [];
  const found = actions.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) : 0;
}

function extractCostPerAction(insights, actionType) {
  const items = insights?.data?.[0]?.cost_per_action_type ?? [];
  const found = items.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) : null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const account = req.query.account || "ca2";
  const token = process.env.META_ACCESS_TOKEN;
  const accountId =
    account === "ca1"
      ? process.env.META_AD_ACCOUNT_CA1
      : process.env.META_AD_ACCOUNT_CA2;

  if (!token || !accountId) {
    return res.status(500).json({ error: "META_ACCESS_TOKEN ou META_AD_ACCOUNT_" + account.toUpperCase() + " não configurado" });
  }

  const fields = [
    "name",
    "status",
    "insights{spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type}",
  ].join(",");

  const params = new URLSearchParams({
    fields,
    date_preset: "last_7d",
    access_token: token,
    limit: "50",
  });

  let adsData;
  try {
    const graphRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/ads?${params}`
    );
    const graphJson = await graphRes.json();
    if (graphJson.error) {
      return res.status(400).json({ error: graphJson.error.message });
    }
    adsData = graphJson.data ?? [];
  } catch (err) {
    return res.status(500).json({ error: `Meta API fetch error: ${err.message}` });
  }

  const formatted = adsData.map((ad) => {
    const ins = ad.insights;
    const spend = parseFloat(extractMetric(ins, "spend") ?? 0);
    const leads = extractActions(ins, "lead");
    const conversions = extractActions(ins, "offsite_conversion.fb_pixel_lead") || leads;
    const cpl = leads > 0 ? (spend / leads).toFixed(2) : null;

    return {
      ad_id: ad.id,
      ad_name: ad.name,
      status: ad.status,
      spend: spend.toFixed(2),
      impressions: extractMetric(ins, "impressions"),
      reach: extractMetric(ins, "reach"),
      clicks: extractMetric(ins, "clicks"),
      ctr: extractMetric(ins, "ctr") ? parseFloat(extractMetric(ins, "ctr")).toFixed(2) + "%" : null,
      cpc: extractMetric(ins, "cpc") ? "R$" + parseFloat(extractMetric(ins, "cpc")).toFixed(2) : null,
      cpm: extractMetric(ins, "cpm") ? "R$" + parseFloat(extractMetric(ins, "cpm")).toFixed(2) : null,
      frequency: extractMetric(ins, "frequency") ? parseFloat(extractMetric(ins, "frequency")).toFixed(2) + "x" : null,
      leads: leads || null,
      conversions: conversions || null,
      cpl: cpl ? "R$" + cpl : null,
      daily_budget: ad.status === "PAUSED" ? "PAUSADO" : null,
    };
  });

  // Upsert no Supabase
  try {
    const now = new Date().toISOString();
    const rows = formatted.map((ad) => ({
      agent_id: "claudin-ads",
      ad_id: ad.ad_id,
      ad_name: ad.ad_name,
      status: ad.status,
      spend: ad.spend,
      impressions: ad.impressions,
      reach: ad.reach,
      clicks: ad.clicks,
      ctr: ad.ctr,
      cpc: ad.cpc,
      cpm: ad.cpm,
      frequency: ad.frequency,
      leads: ad.leads,
      conversions: ad.conversions,
      cpl: ad.cpl,
      daily_budget: ad.daily_budget,
      fetched_at: now,
    }));

    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/ad_metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    });

    if (!upsertRes.ok) {
      const err = await upsertRes.json();
      console.error("[meta-ads] Supabase upsert error:", err);
    }
  } catch (err) {
    console.error("[meta-ads] Supabase error:", err.message);
  }

  return res.status(200).json({ ads: formatted, account, fetched_at: new Date().toISOString() });
}
