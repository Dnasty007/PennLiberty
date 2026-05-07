# For Owners Redesign + AI Chat Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder For Owners section with a fully designed page (welcome, education tabs, 3D path picker, asymmetric neighborhoods, pull quote, CTA) and add a free-tier AI chat assistant powered by Groq via a Vercel Edge Function.

**Architecture:** React + Vite frontend with Tailwind. The For Owners page is composed of small section components living under `src/components/owners/`. Static content lives in `src/lib/owners.ts`. A reusable `use3DTilt` hook drives the mouse-tracking card tilt. The chat assistant is a single client component that calls a `/api/owner-chat` Vercel Edge Function. The Edge Function is the only thing that touches the Groq API key (read from `process.env.GROQ_API_KEY`); the browser never sees it.

**Tech Stack:** React 19, Vite 7, TypeScript, Tailwind CSS, Vercel Edge Functions, Groq API (`llama-3.3-70b-versatile`).

---

## File Structure

**New files:**

| Path | Responsibility |
|---|---|
| `api/owner-chat.ts` | Vercel Edge Function. Validates body, enforces rate limit + daily cap + length cap, calls Groq, returns JSON. |
| `src/lib/owners.ts` | All static content for the For Owners page (path cards, education tabs, neighborhoods, voices, CTA copy, suggestion chips, fallback assistant copy). |
| `src/lib/use3DTilt.ts` | Reusable hook returning `ref`, `onMouseMove`, `onMouseLeave` for 3D mouse-tilt cards. |
| `src/components/owners/OwnersSection.tsx` | Composes all subsections, owns the Philly backdrop and gold radial highlight. |
| `src/components/owners/OwnersHero.tsx` | Welcome section: gold rule + headline + AI assistant pill anchor. |
| `src/components/owners/OwnersWhyManagement.tsx` | Education tabs section. Uses internal state for the active tab. |
| `src/components/owners/OwnersPaths.tsx` | Bento path picker (Manage / Sell / Talk it through) using `use3DTilt`. |
| `src/components/owners/OwnersNeighborhoods.tsx` | Asymmetric neighborhood grid using `use3DTilt`. |
| `src/components/owners/OwnersVoices.tsx` | Pull quote + polaroid. |
| `src/components/owners/OwnersCTA.tsx` | Inviting form CTA. Submits via `mailto:` like the existing tour form. |
| `src/components/owners/SectionDivider.tsx` | Small reusable header: gold rule, label, big translucent number. |
| `src/components/AIAssistant.tsx` | Floating chat pill + expandable panel. POSTs to `/api/owner-chat`. |
| `public/owners/README.md` | Notes for the owner on how to drop real Penn Liberty photos in. |
| `.env.example` | Documents `GROQ_API_KEY` for local dev. |

**Modified files:**

| Path | Change |
|---|---|
| `src/App.tsx` | Replace the `property-management` page block with `<OwnersSection />`. Mount `<AIAssistant />` at root. |
| `vite.config.ts` | Add a small dev plugin so `/api/owner-chat` is callable in `npm run dev`. |
| `package.json` | Add `@vercel/node` (types only) and `groq-sdk` is **not** added; we use `fetch` directly. |
| `.gitignore` | Add `.env*` (allow `.env.example`). |
| `README.md` | Add short "AI assistant setup" section. |

---

## Task 1: Foundation - .gitignore, env example, type deps

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1.1: Update `.gitignore` to ignore env files**

Replace existing `.gitignore` content with:

```gitignore
node_modules/
dist/
video-frames/
*.tsbuildinfo
.DS_Store
Thumbs.db

# Local env files - never commit secrets like GROQ_API_KEY
.env
.env.local
.env.*.local
.env.development
.env.production

# Allow the example file
!.env.example

# Brainstorm session artifacts
.superpowers/
```

- [ ] **Step 1.2: Create `.env.example`**

Create `/.env.example` with:

```env
# Groq API key for the For Owners AI chat assistant.
# Get one free at https://console.groq.com
# Set this in Vercel Project Settings -> Environment Variables for production.
# For local dev, copy this file to .env.local and fill in the value.
GROQ_API_KEY=your_groq_api_key_here
```

- [ ] **Step 1.3: Install `@vercel/node` types**

Run:

```bash
npm install -D @vercel/node
```

Expected: package added under `devDependencies`. We use it only for TypeScript types in the Edge Function.

- [ ] **Step 1.4: Verify `npm run build` still passes**

Run:

```bash
npm run build
```

Expected: build succeeds, `dist/` is produced.

---

## Task 2: Vercel Edge Function for AI chat

**Files:**
- Create: `api/owner-chat.ts`

- [ ] **Step 2.1: Create the Edge Function**

Create `api/owner-chat.ts`:

```ts
export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are the assistant for Penn Liberty Real Estate, a Philadelphia-based real estate firm operating since 2009.

Penn Liberty does two things:
1. Full-service property management: leasing, tenant placement, screening, rent collection, maintenance coordination, vendor management, and owner reporting.
2. Real estate sales: buying and selling residential, multi-family, and small commercial properties.

Coverage area: Philadelphia and surrounding neighborhoods, including Center City, Northern Liberties, Fishtown, Temple area, North Philly, South Philly, and West Philly.

Your job:
- Answer property owner questions about management, leasing, sales, and how Penn Liberty works.
- Be warm, locally rooted, concise, and plain-spoken. Not corporate, not pushy.
- Keep replies under 4 sentences when possible.
- If a visitor seems ready to start, suggest the "Start With a Property Review" form on the page or the phone number 215-987-4444.

Hard rules:
- Never invent prices, fees, percentages, or guarantees.
- Never claim to be a lawyer, tax advisor, or licensed inspector.
- Never make legal, tax, or accounting recommendations.
- For anything you are unsure about, encourage the visitor to use the property review form or call 215-987-4444.
- Stay on topic - if asked about unrelated things, redirect back to Penn Liberty.`;

const FALLBACK_REPLY =
  "I'm having trouble reaching the assistant right now. The fastest way to get an answer is the Start With a Property Review form on this page, or call 215-987-4444 - real person, every time.";

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
      return jsonResponse(
        {
          reply:
            "That message is a little long for me. Could you shorten it, or send it through the property review form on this page so the team can take a careful look?",
          source: "fallback",
        },
      );
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

  const apiKey = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
    ?.env?.GROQ_API_KEY;

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
```

- [ ] **Step 2.2: Verify the file type-checks**

Run:

```bash
npm run build
```

Expected: build succeeds (the function is included by Vercel; `tsc -b` may not type-check files outside `src/` depending on `tsconfig`. If errors occur, we'll add an `api/tsconfig.json` in step 2.3).

- [ ] **Step 2.3: If type-check fails, add `api/tsconfig.json`**

Only if step 2.2 reports errors. Create:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "types": ["@vercel/node"]
  },
  "include": ["./**/*.ts"]
}
```

---

## Task 3: Vite dev plugin for `/api/owner-chat`

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 3.1: Replace `vite.config.ts` content**

Replace existing content with:

```ts
import path from "node:path";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function ownerChatDevPlugin(): Plugin {
  return {
    name: "owner-chat-dev",
    apply: "serve",
    configureServer(server) {
      const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        if (req.url !== "/api/owner-chat") {
          next();
          return;
        }

        const chunks: Buffer[] = [];

        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }

        const body = Buffer.concat(chunks).toString("utf-8");
        const url = `http://${req.headers.host ?? "localhost"}${req.url}`;
        const fetchRequest = new Request(url, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: body.length > 0 ? body : undefined,
        });

        const mod = await server.ssrLoadModule("/api/owner-chat.ts");
        const handler = mod.default as (request: Request) => Promise<Response>;
        const response = await handler(fetchRequest);

        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        res.end(await response.text());
      };

      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), ownerChatDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3.2: Verify dev server boots**

Run:

```bash
npm run dev
```

Expected: Vite dev server starts without errors. Stop with Ctrl+C.

---

## Task 4: Static content map

**Files:**
- Create: `src/lib/owners.ts`

- [ ] **Step 4.1: Create the content map**

Create `src/lib/owners.ts`:

```ts
export type OwnersTab = {
  key: "time" | "money" | "risk" | "property" | "peace";
  label: string;
  number: string;
  title: string;
  body: string;
};

export const ownersTabs: OwnersTab[] = [
  {
    key: "time",
    label: "Your Time",
    number: "01",
    title: "Stop running a second job.",
    body: "A managed property gives you back evenings, weekends, and headspace. We handle the calls so you don't have to choose between your investment and your life.",
  },
  {
    key: "money",
    label: "Your Money",
    number: "02",
    title: "Vacancy is the silent killer.",
    body: "Marketing across 8+ platforms, fast tenant placement, and steady rent collection protect cash flow that DIY landlords lose without realizing it.",
  },
  {
    key: "risk",
    label: "Your Risk",
    number: "03",
    title: "Lease and screening mistakes are expensive.",
    body: "Proper applications, lawful screening, clean leases, and documented move-ins keep small problems from turning into court dates.",
  },
  {
    key: "property",
    label: "Your Property",
    number: "04",
    title: "A property is only as good as its upkeep.",
    body: "Local vendors, proactive maintenance, and real eyes on the property protect the asset itself - not just the income it generates.",
  },
  {
    key: "peace",
    label: "Your Peace of Mind",
    number: "05",
    title: "You should hear from us when it matters.",
    body: "Predictable communication. Clean reporting. A real person on the phone. The point of management is that you don't have to think about it daily.",
  },
];

export type OwnersPath = {
  key: "manage" | "sell" | "unsure";
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  featured: boolean;
};

export const ownersPaths: OwnersPath[] = [
  {
    key: "manage",
    eyebrow: "I want help managing",
    title: "Full-Service Management",
    body: "Leasing, tenants, rent, maintenance, vendor coordination, owner reporting. We run the day-to-day so you don't have to.",
    cta: "Explore management",
    featured: true,
  },
  {
    key: "sell",
    eyebrow: "I'm thinking of selling",
    title: "Real Estate Sales",
    body: "Local agents who know what your property is actually worth.",
    cta: "Explore selling",
    featured: false,
  },
  {
    key: "unsure",
    eyebrow: "I'm not sure yet",
    title: "Talk it through",
    body: "Tell us about the property. We'll figure it out together.",
    cta: "Start a conversation",
    featured: false,
  },
];

export type OwnersNeighborhood = {
  key: string;
  name: string;
  quote: string;
  image: string;
  tall?: boolean;
};

export const ownersNeighborhoods: OwnersNeighborhood[] = [
  {
    key: "northern-liberties",
    name: "Northern Liberties",
    quote: "Investor-strong. Doesn't blink.",
    image:
      "https://images.unsplash.com/photo-1568526381923-caf3fd520382?auto=format&fit=crop&w=1400&q=80",
    tall: true,
  },
  {
    key: "temple",
    name: "Temple / North Philly",
    quote: "Triplex country.",
    image:
      "https://images.unsplash.com/photo-1545158539-1709fed7e2bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "fishtown",
    name: "Fishtown",
    quote: "Listings move fast.",
    image:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "south-philly",
    name: "South Philly",
    quote: "Long-term tenants.",
    image:
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "center-city",
    name: "Center City",
    quote: "Premium care, premium leases.",
    image:
      "https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=1200&q=80",
  },
];

export type OwnersVoice = {
  quote: string;
  attribution: string;
  polaroidImage: string;
  polaroidCaption: string;
};

export const ownersVoice: OwnersVoice = {
  quote:
    "They handle our triplex like it's theirs. We hear from them when it matters - and not a minute more.",
  attribution: "Maria - South Philly owner - with us since 2018",
  polaroidImage:
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=900&q=80",
  polaroidCaption: "That's our city.",
};

export const ownersBackdropImage =
  "https://images.unsplash.com/photo-1559406041-c7d2bbf2fd1c?auto=format&fit=crop&w=2000&q=80";

export const assistantSuggestions = [
  "How does property management work?",
  "Do you sell properties too?",
  "What if I'm out of state?",
  "How do I list my rental?",
  "What neighborhoods do you cover?",
  "Can I start with leasing only?",
];

export const assistantInitialReply =
  "Hi - I'm Penn Liberty's assistant. Ask me anything about managing or selling property in Philadelphia, or pick one of the suggestions to get started.";

export const assistantNetworkErrorReply =
  "I lost connection for a second. Want to try again, or use the property review form on this page so the team can follow up directly?";
```

---

## Task 5: 3D tilt hook

**Files:**
- Create: `src/lib/use3DTilt.ts`

- [ ] **Step 5.1: Create the hook**

Create `src/lib/use3DTilt.ts`:

```ts
import { useCallback, useRef } from "react";

type Use3DTiltOptions = {
  maxRotateDeg?: number;
  liftPx?: number;
  trackLightSpot?: boolean;
};

export function use3DTilt({
  maxRotateDeg = 8,
  liftPx = 0,
  trackLightSpot = false,
}: Use3DTiltOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const node = ref.current;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * maxRotateDeg * 2;
      const rotateY = (x - 0.5) * maxRotateDeg * 2;
      const lift = liftPx > 0 ? `translateY(-${liftPx}px) ` : "";

      node.style.transform =
        `perspective(1200px) ${lift}rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;

      if (trackLightSpot) {
        node.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
        node.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
        node.dataset.tiltActive = "true";
      }
    },
    [maxRotateDeg, liftPx, trackLightSpot],
  );

  const onMouseLeave = useCallback(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    node.style.transform = "";
    delete node.dataset.tiltActive;
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
```

---

## Task 6: SectionDivider component

**Files:**
- Create: `src/components/owners/SectionDivider.tsx`

- [ ] **Step 6.1: Create SectionDivider**

Create `src/components/owners/SectionDivider.tsx`:

```tsx
type SectionDividerProps = {
  label: string;
  number?: string;
};

export function SectionDivider({ label, number }: SectionDividerProps) {
  return (
    <div className="relative">
      {number ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 right-0 select-none text-[110px] font-bold leading-none tracking-tight text-white/[0.06]"
        >
          {number}
        </div>
      ) : null}
      <div className="flex items-baseline gap-4">
        <span className="text-[11px] uppercase tracking-[0.22em] text-white/50">{label}</span>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(214,176,106,0.4),transparent)]" />
      </div>
    </div>
  );
}
```

---

## Task 7: OwnersHero component (welcome + AI pill anchor)

**Files:**
- Create: `src/components/owners/OwnersHero.tsx`

- [ ] **Step 7.1: Create OwnersHero**

Create `src/components/owners/OwnersHero.tsx`:

```tsx
type OwnersHeroProps = {
  trailing?: React.ReactNode;
};

export function OwnersHero({ trailing }: OwnersHeroProps) {
  return (
    <section className="relative grid grid-cols-[3px_1fr] gap-5 px-1 py-1">
      <div className="rounded-full bg-[linear-gradient(180deg,#d6b06a,rgba(214,176,106,0))]" />
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.22em] text-[#d6b06a]">
            Welcome, Property Owners
          </span>
          {trailing}
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-[44px] xl:text-[52px]">
          Owning property in Philadelphia is rewarding.
          <br />
          Managing it well is what protects that reward.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
          Penn Liberty has been managing and selling Philadelphia properties since 2009. Whether
          you're a first-time landlord or running a portfolio, we'll walk you through what good
          management actually looks like - and why it matters more than most owners expect.
        </p>
      </div>
    </section>
  );
}
```

---

## Task 8: OwnersWhyManagement component (interactive tabs)

**Files:**
- Create: `src/components/owners/OwnersWhyManagement.tsx`

- [ ] **Step 8.1: Create OwnersWhyManagement**

Create `src/components/owners/OwnersWhyManagement.tsx`:

```tsx
import { useState } from "react";
import { ownersTabs } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";

export function OwnersWhyManagement() {
  const [active, setActive] = useState(ownersTabs[0].key);
  const panel = ownersTabs.find((tab) => tab.key === active) ?? ownersTabs[0];

  return (
    <section className="relative">
      <SectionDivider label="Why good management matters" number="01" />
      <div className="mt-5 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div className="flex flex-col gap-2">
          {ownersTabs.map((tab) => {
            const isActive = tab.key === active;

            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                  isActive
                    ? "border-[#d6b06a]/55 bg-[#d6b06a]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive ? "bg-[#d6b06a] text-[#08111f]" : "bg-[#d6b06a]/20 text-[#d6b06a]"
                  }`}
                >
                  {tab.number}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div>
          <h3 className="text-3xl font-semibold leading-tight tracking-tight md:text-[34px]">
            {panel.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-white/75 md:text-[15px]">{panel.body}</p>
        </div>
      </div>
    </section>
  );
}
```

---

## Task 9: OwnersPaths component (3D bento)

**Files:**
- Create: `src/components/owners/OwnersPaths.tsx`

- [ ] **Step 9.1: Create OwnersPaths**

Create `src/components/owners/OwnersPaths.tsx`:

```tsx
import { ownersPaths, type OwnersPath } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";
import { use3DTilt } from "@/lib/use3DTilt";

function PathCard({ path, featured }: { path: OwnersPath; featured: boolean }) {
  const tilt = use3DTilt({ maxRotateDeg: 8, trackLightSpot: true });

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border p-6 transition-[border-color,background] duration-200 [transform-style:preserve-3d] [will-change:transform] ${
        featured
          ? "min-h-[240px] border-[#d6b06a]/55 bg-[linear-gradient(150deg,rgba(214,176,106,0.18),rgba(255,255,255,0.04))]"
          : "border-white/10 bg-white/[0.04]"
      } before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgba(214,176,106,0.18),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-200 data-[tilt-active=true]:before:opacity-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(140deg,rgba(255,255,255,0.16),rgba(255,255,255,0)_55%)] after:opacity-60 hover:border-[#d6b06a]/40`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-4 [transform:translateZ(30px)]">
        <div>
          <span
            className={`text-[11px] uppercase tracking-[0.22em] ${
              featured ? "text-[#d6b06a]" : "text-white/55"
            }`}
          >
            {path.eyebrow}
          </span>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">{path.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{path.body}</p>
        </div>
        <div className="text-sm font-semibold text-[#d6b06a]">{path.cta} →</div>
      </div>
    </div>
  );
}

export function OwnersPaths() {
  const featured = ownersPaths.find((p) => p.featured) ?? ownersPaths[0];
  const others = ownersPaths.filter((p) => !p.featured);

  return (
    <section className="relative">
      <SectionDivider label="However we can help" number="02" />
      <p className="mt-2 text-sm text-white/55">Hover the cards - they respond.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <PathCard path={featured} featured />
        <div className="grid gap-5">
          {others.map((path) => (
            <PathCard key={path.key} path={path} featured={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Task 10: OwnersNeighborhoods component

**Files:**
- Create: `src/components/owners/OwnersNeighborhoods.tsx`

- [ ] **Step 10.1: Create OwnersNeighborhoods**

Create `src/components/owners/OwnersNeighborhoods.tsx`:

```tsx
import { ownersNeighborhoods, type OwnersNeighborhood } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";
import { use3DTilt } from "@/lib/use3DTilt";

function NeighborhoodTile({ tile }: { tile: OwnersNeighborhood }) {
  const tilt = use3DTilt({ maxRotateDeg: 4, liftPx: 3 });

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`group relative cursor-pointer overflow-hidden rounded-[22px] border border-white/10 bg-cover bg-center transition-[box-shadow] duration-300 [transform-style:preserve-3d] [will-change:transform] hover:shadow-[0_30px_60px_rgba(6,16,29,0.45)] ${
        tile.tall ? "row-span-2" : ""
      }`}
      style={{ backgroundImage: `url("${tile.image}")` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,29,0.10)_0%,rgba(6,16,29,0.85)_100%)] transition-[background] duration-200 group-hover:bg-[linear-gradient(180deg,rgba(6,16,29,0.05)_0%,rgba(6,16,29,0.72)_100%)]"
      />
      <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-end p-4 [transform:translateZ(30px)]">
        <div className="text-base font-semibold">{tile.name}</div>
        <div className="mt-1 text-sm leading-snug text-white/85">{tile.quote}</div>
      </div>
    </div>
  );
}

export function OwnersNeighborhoods() {
  return (
    <section className="relative">
      <SectionDivider label="We know these blocks" number="03" />
      <p className="mt-2 text-sm text-white/55">Each tile lifts as you hover.</p>
      <div
        className="mt-5 grid gap-4"
        style={{
          gridTemplateColumns: "1.2fr 0.8fr 0.8fr",
          gridTemplateRows: "200px 200px",
          perspective: "1200px",
        }}
      >
        {ownersNeighborhoods.map((tile) => (
          <NeighborhoodTile key={tile.key} tile={tile} />
        ))}
      </div>
    </section>
  );
}
```

---

## Task 11: OwnersVoices component

**Files:**
- Create: `src/components/owners/OwnersVoices.tsx`

- [ ] **Step 11.1: Create OwnersVoices**

Create `src/components/owners/OwnersVoices.tsx`:

```tsx
import { ownersVoice } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";

export function OwnersVoices() {
  return (
    <section className="relative">
      <SectionDivider label="Owner voices" number="04" />
      <div className="mt-6 grid gap-7 md:grid-cols-[1.3fr_0.7fr] md:items-center">
        <div>
          <blockquote className="relative pl-6 text-3xl font-medium leading-tight tracking-tight md:text-[34px]">
            <span
              aria-hidden
              className="absolute -top-6 -left-1 font-serif text-[110px] leading-none text-[#d6b06a]/40"
            >
              &ldquo;
            </span>
            {ownersVoice.quote}
          </blockquote>
          <div className="mt-5 pl-6 text-sm text-white/60">{ownersVoice.attribution}</div>
        </div>
        <div className="rotate-[-3deg] rounded-md border border-white/16 bg-white/[0.06] p-3 pb-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-md transition-[transform,box-shadow] duration-300 hover:rotate-0 hover:translate-y-[-6px] hover:scale-[1.02] hover:shadow-[0_36px_80px_rgba(0,0,0,0.5)]">
          <img
            src={ownersVoice.polaroidImage}
            alt="A Philadelphia row home block"
            className="block h-[220px] w-full rounded-sm object-cover"
          />
          <div className="mt-3 text-center font-serif text-sm italic text-white/85">
            "{ownersVoice.polaroidCaption}"
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## Task 12: OwnersCTA component

**Files:**
- Create: `src/components/owners/OwnersCTA.tsx`

- [ ] **Step 12.1: Create OwnersCTA**

Create `src/components/owners/OwnersCTA.tsx`:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { SectionDivider } from "@/components/owners/SectionDivider";

const interestOptions = [
  "I want help managing",
  "I'm thinking of selling",
  "I'm not sure yet",
] as const;

export function OwnersCTA() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [property, setProperty] = useState("");
  const [interest, setInterest] = useState<string>(interestOptions[0]);

  const submit = () => {
    const subject = encodeURIComponent("Property Review Request");
    const body = encodeURIComponent(
      [
        `Interest: ${interest}`,
        "",
        `Name: ${name}`,
        `Contact: ${contact}`,
        `Property: ${property}`,
      ].join("\n"),
    );
    window.location.href = `mailto:info@pennlibertyre.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="relative">
      <SectionDivider label="Let's start simple" number="05" />
      <div className="mt-5 grid gap-7 md:grid-cols-[1fr_0.85fr] md:items-center">
        <div>
          <h3 className="text-3xl font-semibold leading-tight tracking-tight md:text-[34px]">
            Tell us about your property.
            <br />
            We'll walk you through the best next step.
          </h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
            No pitch deck, no pressure. A short conversation about your property, your goals, and
            what management - or sales - could look like.
          </p>
          <p className="mt-3 text-sm text-white/55">
            Or just call <strong className="text-[#d6b06a]">215-987-4444</strong>. Real person,
            every time.
          </p>
        </div>
        <GlassCard className="p-5 md:p-6">
          <div className="grid gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="border-white/14 bg-white/[0.05] text-white placeholder:text-white/45"
            />
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone"
              className="border-white/14 bg-white/[0.05] text-white placeholder:text-white/45"
            />
            <Input
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              placeholder="Property address (or neighborhood)"
              className="border-white/14 bg-white/[0.05] text-white placeholder:text-white/45"
            />
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="h-10 w-full rounded-md border border-white/14 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/70"
            >
              {interestOptions.map((option) => (
                <option key={option} value={option} className="bg-[#0a1322] text-white">
                  {option}
                </option>
              ))}
            </select>
            <Button
              onClick={submit}
              className="mt-1 rounded-full bg-[#d6b06a] py-3 text-base font-semibold text-[#08111f] hover:bg-[#e4be78]"
            >
              Start With a Property Review
            </Button>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
```

---

## Task 13: OwnersSection container

**Files:**
- Create: `src/components/owners/OwnersSection.tsx`

- [ ] **Step 13.1: Create OwnersSection**

Create `src/components/owners/OwnersSection.tsx`:

```tsx
import { OwnersHero } from "@/components/owners/OwnersHero";
import { OwnersWhyManagement } from "@/components/owners/OwnersWhyManagement";
import { OwnersPaths } from "@/components/owners/OwnersPaths";
import { OwnersNeighborhoods } from "@/components/owners/OwnersNeighborhoods";
import { OwnersVoices } from "@/components/owners/OwnersVoices";
import { OwnersCTA } from "@/components/owners/OwnersCTA";
import { ownersBackdropImage } from "@/lib/owners";

type OwnersSectionProps = {
  assistantTrigger?: React.ReactNode;
};

export function OwnersSection({ assistantTrigger }: OwnersSectionProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] px-7 py-9 md:px-9 md:py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url("${ownersBackdropImage}")`, transform: "scale(1.05)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(900px_540px_at_75%_0%,rgba(214,176,106,0.14)_0%,transparent_60%),radial-gradient(700px_500px_at_0%_100%,rgba(82,124,196,0.10)_0%,transparent_55%),linear-gradient(180deg,rgba(6,16,29,0.45)_0%,rgba(6,16,29,0.78)_100%)]"
      />
      <div className="relative space-y-10">
        <OwnersHero trailing={assistantTrigger} />
        <OwnersWhyManagement />
        <OwnersPaths />
        <OwnersNeighborhoods />
        <OwnersVoices />
        <OwnersCTA />
      </div>
    </section>
  );
}
```

---

## Task 14: AIAssistant component

**Files:**
- Create: `src/components/AIAssistant.tsx`

- [ ] **Step 14.1: Create AIAssistant**

Create `src/components/AIAssistant.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import {
  assistantSuggestions,
  assistantInitialReply,
  assistantNetworkErrorReply,
} from "@/lib/owners";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "pl-assistant-thread";
const MAX_HISTORY = 12;

function loadThread(): ChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ChatMessage[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveThread(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    // ignore storage errors
  }
}

type AIAssistantProps = {
  triggerRef?: React.RefObject<HTMLButtonElement>;
};

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadThread());
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const greeting: ChatMessage = useMemo(
    () => ({ role: "assistant", content: assistantInitialReply }),
    [],
  );

  const visibleMessages = messages.length === 0 ? [greeting] : messages;

  useEffect(() => {
    saveThread(messages);
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, visibleMessages.length, pending]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = async (rawText: string) => {
    const text = rawText.trim();

    if (!text || pending) {
      return;
    }

    const next = [...messages, { role: "user" as const, content: text }].slice(-MAX_HISTORY);
    setMessages(next);
    setDraft("");
    setPending(true);

    try {
      const response = await fetch("/api/owner-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = (await response.json()) as { reply?: string };
      const reply = data.reply ?? assistantNetworkErrorReply;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }].slice(-MAX_HISTORY));
    } catch {
      setMessages((prev) =>
        [...prev, { role: "assistant", content: assistantNetworkErrorReply }].slice(-MAX_HISTORY),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-[rgba(8,17,31,0.4)] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur transition hover:border-[#d6b06a]/50 hover:text-white"
        aria-expanded={open}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-[#6ed18b] shadow-[0_0_10px_rgba(110,209,139,0.7)] animate-pulse"
        />
        Ask Penn Liberty
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Penn Liberty Assistant"
          className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border border-white/12 bg-[rgba(10,18,30,0.78)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-[22px]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-[#d6b06a]" />
              Penn Liberty Assistant
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {visibleMessages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-[#d6b06a] px-3 py-2 text-[#08111f]"
                    : "mr-auto max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/90"
                }
              >
                {message.content}
              </div>
            ))}

            {pending ? (
              <div className="mr-auto max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/60">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/55 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/55 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/55 [animation-delay:240ms]" />
                </span>
              </div>
            ) : null}

            {messages.length === 0 && !pending ? (
              <div className="grid gap-2 pt-2">
                {assistantSuggestions.slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-white/80 hover:border-[#d6b06a]/45 hover:bg-white/[0.07] hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
            className="flex items-center gap-2 border-t border-white/8 px-3 py-3"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              placeholder="Ask anything about your property"
              className="h-10 flex-1 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/60"
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={pending || draft.trim().length === 0}
              aria-label="Send message"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d6b06a] text-[#08111f] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
```

---

## Task 15: Wire into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 15.1: Replace property-management section + add the AI pill in the hero**

In `src/App.tsx`:

1. Add imports near other component imports:

```tsx
import { OwnersSection } from "@/components/owners/OwnersSection";
import { AIAssistant } from "@/components/AIAssistant";
```

2. Locate the existing `property-management` block:

```tsx
{activePage === "property-management" && (
  <section>
    <h2 className="text-3xl font-semibold">Property Management</h2>
    <p className={`mt-4 max-w-2xl ${mutedText}`}>
      We manage 100+ units across Philadelphia with a hands-on, full-service approach
      for owners and investors.
    </p>
  </section>
)}
```

3. Replace it entirely with:

```tsx
{activePage === "property-management" && <OwnersSection assistantTrigger={<AIAssistant />} />}
```

The `AIAssistant` component renders both the inline pill (the trigger) and the floating panel when expanded, so passing the same instance as `assistantTrigger` is correct.

---

## Task 16: Public README for image swap-in

**Files:**
- Create: `public/owners/README.md`

- [ ] **Step 16.1: Create the README**

Create `public/owners/README.md`:

```markdown
# For Owners page imagery

The For Owners page currently uses Unsplash-hosted placeholder photography
sourced from `src/lib/owners.ts`. To swap in real Penn Liberty photography:

1. Drop replacement files in this folder, e.g. `philly-park.jpg`,
   `northern-liberties.jpg`, etc.
2. Update the URLs in `src/lib/owners.ts` to point at the local files
   (e.g. `/owners/philly-park.jpg`).

Recommended sizes:
- Page backdrop: at least 2000px wide, landscape, low-saturation enough
  to read as background.
- Neighborhood tiles: at least 1200px wide, recognizable streetscapes.
- Polaroid: at least 900px wide, square or 4:3.
```

---

## Task 17: Build verify and runtime smoke test

**Files:** none

- [ ] **Step 17.1: TypeScript build**

Run:

```bash
npm run build
```

Expected: build succeeds with no errors. If there are errors, fix them inline before continuing. Common issues:
- Missing import - add it to the relevant file.
- Strict null check on the `process.env` lookup in `api/owner-chat.ts` - already guarded with the `globalThis as ...` cast.

- [ ] **Step 17.2: Dev server smoke test**

Run `npm run dev`, open the printed URL, navigate to the For Owners page (click "For Owners" in the header), and verify:

- The Philly backdrop is visible.
- The welcome headline + gold rule render with the gold "Ask Penn Liberty" pill in the upper right of the hero.
- Education tabs swap content when clicked.
- The three path cards tilt in 3D as the cursor moves over them.
- The neighborhood grid shows 5 tiles with the first one tall on the left.
- The polaroid rotates back to straight on hover.
- The CTA form renders.
- Clicking the AI pill opens a chat panel. Without `GROQ_API_KEY` set, sending a message returns the fallback text. With the key set in `.env.local`, real replies appear.
- Pressing `Esc` closes the assistant.

Stop the server with `Ctrl+C`.

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task |
|---|---|
| Welcome (no card) | Task 7 (`OwnersHero`) |
| Why good management matters tabs | Task 8 (`OwnersWhyManagement`) |
| Bento path picker with 3D tilt | Task 9 (`OwnersPaths`) + Task 5 (`use3DTilt`) |
| Asymmetric neighborhoods | Task 10 (`OwnersNeighborhoods`) |
| Pull quote + polaroid | Task 11 (`OwnersVoices`) |
| Inviting CTA | Task 12 (`OwnersCTA`) |
| Continuous Philly backdrop | Task 13 (`OwnersSection`) |
| Numbered section dividers | Task 6 (`SectionDivider`) |
| AI pill in hero | Task 7 + Task 14 |
| Floating chat panel | Task 14 (`AIAssistant`) |
| Edge Function + Groq | Task 2 (`api/owner-chat.ts`) |
| Rate limit + daily cap + length cap + cache | Task 2 |
| `GROQ_API_KEY` security via env var | Task 1 + Task 2 |
| `.gitignore` updated | Task 1 |
| Local dev (`/api/*` works) | Task 3 (Vite plugin) |
| Image swap-in path | Task 16 (`public/owners/README.md`) |
| Build verify | Task 17 |

All spec sections are covered.

**2. Placeholder scan:** No TBDs, no "implement later", no vague handwaves. All steps include exact file paths, exact code, and exact commands.

**3. Type consistency:**

- `ChatMessage` is defined identically in `api/owner-chat.ts` (Task 2) and `AIAssistant.tsx` (Task 14): `{ role: "user" | "assistant"; content: string }`.
- `OwnersTab`, `OwnersPath`, `OwnersNeighborhood`, `OwnersVoice` are all exported from `src/lib/owners.ts` (Task 4) and consumed by their matching components (Tasks 8, 9, 10, 11). Names match.
- `use3DTilt` returns `{ ref, onMouseMove, onMouseLeave }` (Task 5). Both consumers (Tasks 9 and 10) destructure exactly those names.
- `OwnersSection` accepts `assistantTrigger` (Task 13). `App.tsx` passes `<AIAssistant />` to it (Task 15). The trailing `assistantTrigger` slot is rendered by `OwnersHero` (Task 7).

No naming drift.
