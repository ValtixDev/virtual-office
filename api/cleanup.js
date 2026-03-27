const SUPABASE_URL = "https://efvkcqnffmqodingqfbk.supabase.co";
const SUPABASE_KEY = "sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/chat_history?created_at=lt.${cutoff}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("[Cleanup] delete error:", err);
      return res.status(500).json({ error: err });
    }

    const deleted = await response.json();
    const count = Array.isArray(deleted) ? deleted.length : 0;
    console.log(`[Cleanup] deleted ${count} messages older than 7 days`);
    return res.status(200).json({ deleted: count, cutoff });
  } catch (err) {
    console.error("[Cleanup] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
