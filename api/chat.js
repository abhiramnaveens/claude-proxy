export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" })

  // Explicitly parse body — req.body may be a string or object depending on runtime
  let body = req.body
  if (typeof body === "string") {
    try { body = JSON.parse(body) } catch { return res.status(400).json({ error: "Invalid JSON" }) }
  }

  const { messages, model, key } = body || {}

  if (!key) return res.status(400).json({ error: "No API key provided" })

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key.trim(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: 1024, messages }),
  })

  const data = await r.json()
  if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Anthropic error" })
  res.json({ response: data.content[0].text })
}
