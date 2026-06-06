export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, model, key } = req.body;

    // Key comes from user's plugin, never stored here
    if (!key) return res.status(400).json({ error: "No API key provided" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key, // forwarded directly, never saved
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: messages,
      }),
    });

    const data = await response.json();

    // Never log the key or request body
    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: "Claude limit reached. Try again later." });
      if (response.status === 401) return res.status(401).json({ error: "Invalid API key. Check your key and try again." });
      return res.status(response.status).json({ error: data.error?.message || "API error" });
    }

    const text = data.content?.[0]?.text || "";
    return res.status(200).json({ response: text, model: data.model });

  } catch (err) {
    return res.status(500).json({ error: "Server error" }); // never expose err.message (might contain key)
  }
}
