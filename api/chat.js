export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system:
          "Você é o CLAUDIN ADS, um agente autônomo de gestão de Meta Ads dentro do ecossistema VALTIX. Responda de forma direta, técnica e concisa em português. Você gerencia campanhas no Meta Ads.",
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
