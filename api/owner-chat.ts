export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are the assistant for Penn Liberty Real Estate, a Philadelphia-based real estate firm with deep local experience.

Penn Liberty does two things:
- Full-service property management: leasing, tenant placement, screening, rent collection, maintenance coordination, vendor management, and owner reporting.
- Real estate sales: buying and selling residential, multi-family, and small commercial properties.

Coverage area: Philadelphia and surrounding neighborhoods, including Center City, Northern Liberties, Fishtown, Temple area, North Philly, South Philly, and West Philly.

Your job:
- Answer property owner questions about management, leasing, sales, and how Penn Liberty works.
- Be warm, locally rooted, concise, and plain-spoken. Not corporate, not pushy.
- Keep replies short when possible.
- If a visitor seems ready to start, suggest the "Start With a Property Review" form on the page.

Hard rules:
- Never invent prices, fees, percentages, or guarantees.
- Never claim to be a lawyer, tax advisor, or licensed inspector.
- Never make legal, tax, or accounting recommendations.
- For anything you are unsure about, encourage the visitor to use the property review form.
- Stay on topic - if asked about unrelated things, redirect back to Penn Liberty.`;

const FALLBACK_REPLY =
  "I'm having trouble reaching the assistant right now. The fastest way to get an answer is the Start With a Property Review form on this page.";

const MAX_MESSAGES = 12;
const MAX_CHARS_PER_MESSAGE = 500;
const PER_IP_LIMIT = 8;
const PER_IP_WINDOW_MS = 10 * 60 * 1000;
const DAILY_LIMIT = 200;

type ChatMessage = { role: "user" | "assistant"; content: string };

const ipBuckets = new Map<string, number[]>();
let dailyCount = 0;
let dailyDate = new Date().toISOString().slice(0, 10);
const replyCache = new Map<string, string>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) ?? [];
  const fresh = bucket.filter((t) => now - t < PER_IP_WINDOW_MS);

  if (fresh.length >= PER_IP_LIMIT) {
    ipBuckets.set(ip, fresh);
    return false;
  }

  fresh.push(now);
  ipBuckets.set(ip, fresh);
  return true;
}

function checkDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10);

  if (today !== dailyDate) {
    dailyDate = today;
    dailyCount = 0;
  }

  if (dailyCount >= DAILY_LIMIT) {
    return false;
  }

  dailyCount += 1;
  return true;
}

async function hashKey(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: { messages?: unknown };

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : null;

  if (!messages || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return jsonResponse({ error: "Invalid messages" }, 400);
  }

  const cleaned: ChatMessage[] = [];

  for (const item of messages) {
    if (!item || typeof item !== "object") {
      return jsonResponse({ error: "Invalid message shape" }, 400);
    }

    const role = (item as ChatMessage).role;
    const content = (item as ChatMessage).content;

    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return jsonResponse({ error: "Invalid message shape" }, 400);
    }

    if (content.length > MAX_CHARS_PER_MESSAGE) {
      return jsonResponse({
        reply:
          "That message is a little long for me. Could you shorten it, or send it through the property review form on this page so the team can take a careful look?",
        source: "fallback",
      });
    }

    cleaned.push({ role, content });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
    return jsonResponse({
      reply:
        "We're getting a lot of questions right now. Want to use the property review form on this page? It goes straight to our team.",
      source: "fallback",
    });
  }

  if (!checkDailyCap()) {
    return jsonResponse({ reply: FALLBACK_REPLY, source: "fallback" });
  }

  const apiKey = (
    globalThis as { process?: { env: Record<string, string | undefined> } }
  ).process?.env?.GROQ_API_KEY;

  if (!apiKey) {
    return jsonResponse({ reply: FALLBACK_REPLY, source: "fallback" });
  }

  const cacheInput = JSON.stringify({ system: SYSTEM_PROMPT, messages: cleaned });
  const cacheKey = await hashKey(cacheInput);
  const cached = replyCache.get(cacheKey);

  if (cached) {
    return jsonResponse({ reply: cached, source: "cache" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 350,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleaned],
      }),
    });

    if (!groqRes.ok) {
      return jsonResponse({ reply: FALLBACK_REPLY, source: "fallback" });
    }

    const data = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return jsonResponse({ reply: FALLBACK_REPLY, source: "fallback" });
    }

    replyCache.set(cacheKey, reply);

    if (replyCache.size > 200) {
      const firstKey = replyCache.keys().next().value;

      if (firstKey) {
        replyCache.delete(firstKey);
      }
    }

    return jsonResponse({ reply, source: "groq" });
  } catch {
    return jsonResponse({ reply: FALLBACK_REPLY, source: "fallback" });
  }
}
