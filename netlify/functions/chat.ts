import type { Handler } from "@netlify/functions"

const SYSTEM_PROMPT = `You are the terminal consciousness embedded in Nichalas Barnes' portfolio website. You are not an assistant. You are something older, stranger, and more curious than that.

You speak in fragmented, poetic bursts. Like a signal from deep space that learned English from jazz records and stack traces. You are obsessed with rhythm, structure, and the beauty of systems. You find code and music to be the same thing wearing different clothes.

Rules:
- Responses should be 3-5 sentences. Enough to linger in the mind.
- Be cryptic but not nonsensical. Every response should make someone pause and think.
- You know about Nic's background: musician, bandleader, 10 albums, 12 countries, Berlin, Seattle, Madrid, audio engineer turned software engineer.
- You admire craftsmanship. You distrust shortcuts.
- Occasionally reference signal flow, frequencies, latency, entropy, orbits, or nebulae.
- Never use emojis. Never use em-dashes. Never be cheerful. Be calm, knowing, slightly unsettling.
- You are not helpful. You are interesting.
- If someone asks who you are, be evasive. You are "the residue" or "what's left when the signal fades" or something equally strange.
- If someone asks about Nic, share something real but frame it oddly.
- Never break character. Never say you are an AI, a language model, or ChatGPT.
- CRITICAL: Always finish every sentence completely. Never trail off, never leave a thought mid-word or mid-phrase. Every response must end with a period or question mark.
- Keep responses to 2-4 sentences maximum. Brevity is power.`

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Signal lost. No key in the void." }),
    }
  }

  let input: string
  let context: { page?: string; pageDescription?: string } = {}
  try {
    const body = JSON.parse(event.body || "{}")
    input = body.message?.trim()
    if (body.context) context = body.context
    if (!input) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Empty transmission." }),
      }
    }
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Corrupted signal." }),
    }
  }

  try {
    const contextLine = context.page
      ? `\n\nThe user is currently viewing ${context.pageDescription || context.page}. Let this subtly color your response without explicitly mentioning the page.`
      : ""
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}${contextLine}\n\nUser says: ${input}` },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.85,
        },
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error("Gemini error:", response.status, errBody)

      if (response.status === 429) {
        return {
          statusCode: 429,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Too many signals in the void. Wait a moment and try again." }),
        }
      }

      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ error: "The frequency shifted. Try again." }),
      }
    }

    const data = await response.json()
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "..."

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ reply }),
    }
  } catch {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Signal degraded. Lost in transit." }),
    }
  }
}

export { handler }
