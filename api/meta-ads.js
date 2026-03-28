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

async function graphGet(path, params, token) {
  const p = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}?${p}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data ?? [];
}

function formatAd(ad) {
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
  };
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

  const activeFilter = JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]);

  let campaigns;
  try {
    const rawCampaigns = await graphGet(`${accountId}/campaigns`, {
      fields: "name,status,objective",
      filtering: activeFilter,
      limit: "50",
    }, token);

    campaigns = await Promise.all(rawCampaigns.map(async (campaign) => {
      const rawAdsets = await graphGet(`${campaign.id}/adsets`, {
        fields: "name,status",
        filtering: activeFilter,
        limit: "50",
      }, token);

      const adsets = await Promise.all(rawAdsets.map(async (adset) => {
        const rawAds = await graphGet(`${adset.id}/ads`, {
          fields: "name,status,insights{spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type}",
          date_preset: "last_7d",
          filtering: activeFilter,
          limit: "50",
        }, token);

        return {
          id: adset.id,
          name: adset.name,
          ads: rawAds.map(formatAd),
        };
      }));

      return {
        id: campaign.id,
        name: campaign.name,
        adsets: adsets.filter((s) => s.ads.length > 0),
      };
    }));

    campaigns = campaigns.filter((c) => c.adsets.length > 0);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Upsert all ads no Supabase
  try {
    const now = new Date().toISOString();
    const rows = [];
    for (const campaign of campaigns) {
      for (const adset of campaign.adsets) {
        for (const ad of adset.ads) {
          rows.push({
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
            fetched_at: now,
          });
        }
      }
    }
    if (rows.length > 0) {
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
    }
  } catch (err) {
    console.error("[meta-ads] Supabase error:", err.message);
  }

  return res.status(200).json({ campaigns, account, fetched_at: new Date().toISOString() });
}
