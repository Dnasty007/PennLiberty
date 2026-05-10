import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import {
  assistantInitialReply,
  assistantNetworkErrorReply,
  assistantSuggestions,
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
  lightMode?: boolean;
};

export function AIAssistant({ lightMode = false }: AIAssistantProps) {
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
      setMessages((prev) =>
        [...prev, { role: "assistant" as const, content: reply }].slice(-MAX_HISTORY),
      );
    } catch {
      setMessages((prev) =>
        [...prev, { role: "assistant" as const, content: assistantNetworkErrorReply }].slice(
          -MAX_HISTORY,
        ),
      );
    } finally {
      setPending(false);
    }
  };

  const launcher = lightMode
    ? "border-black/14 bg-white/62 text-black/75 backdrop-blur transition hover:border-[#c49a42]/55 hover:text-black"
    : "border-white/16 bg-[rgba(8,17,31,0.4)] text-white/80 backdrop-blur transition hover:border-[#d6b06a]/50 hover:text-white";

  const dialogShell = lightMode
    ? "border-black/12 bg-[rgba(255,252,246,0.88)] shadow-[0_30px_80px_rgba(12,18,28,0.14)] backdrop-blur-[22px]"
    : "border-white/12 bg-[rgba(10,18,30,0.78)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-[22px]";

  const dialogHeaderFooterRule = lightMode ? "border-black/[0.08]" : "border-white/8";
  const titleInk = lightMode ? "text-black" : "text-white";
  const closeBtn = lightMode
    ? "text-black/60 hover:bg-black/[0.06] hover:text-black"
    : "text-white/70 hover:bg-white/10 hover:text-white";

  const userBubbleLight = "bg-[#d6b06a] text-[#08111f]";
  const assistantBubbleDark = "border border-white/10 bg-white/[0.04] text-white/90";
  const assistantBubbleLight =
    "border border-black/[0.1] bg-white/70 text-black/[0.88] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.12)]";

  const pendingBubble = lightMode ? assistantBubbleLight : assistantBubbleDark;
  const dotColor = lightMode ? "bg-black/38" : "bg-white/55";

  const suggestBtn = lightMode
    ? "rounded-full border border-black/12 bg-white/55 px-3 py-1.5 text-left text-xs text-black/78 hover:border-[#c49a42]/55 hover:bg-white/82 hover:text-black"
    : "rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-left text-xs text-white/80 hover:border-[#d6b06a]/45 hover:bg-white/[0.07] hover:text-white";

  const composeRow = dialogHeaderFooterRule;
  const inputShell = lightMode
    ? "border-black/14 bg-white/82 text-black placeholder:text-black/42 focus-visible:ring-[#d6b06a]/40"
    : "border-white/12 bg-white/[0.05] text-white placeholder:text-white/45 focus-visible:ring-[#d6b06a]/60";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${launcher}`}
        aria-expanded={open}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6ed18b] shadow-[0_0_10px_rgba(110,209,139,0.7)]"
        />
        Ask Penn Liberty
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Penn Liberty Assistant"
          className={`fixed bottom-6 right-6 z-50 flex h-[480px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[26px] border ${dialogShell}`}
        >
          <header className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${dialogHeaderFooterRule}`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${titleInk}`}>
              <MessageSquare className="h-4 w-4 text-[#d6b06a]" />
              Penn Liberty Assistant
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className={`rounded-full p-1.5 ${closeBtn}`}
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
                    ? `ml-auto max-w-[85%] rounded-2xl px-3 py-2 ${userBubbleLight}`
                    : `mr-auto max-w-[85%] rounded-2xl px-3 py-2 ${
                        lightMode ? assistantBubbleLight : assistantBubbleDark
                      }`
                }
              >
                {message.content}
              </div>
            ))}

            {pending ? (
              <div className={`mr-auto max-w-[85%] rounded-2xl px-3 py-2 ${pendingBubble} ${lightMode ? "text-black/52" : "text-white/60"}`}>
                <span className="inline-flex gap-1">
                  <span className={`h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0ms] ${dotColor}`} />
                  <span className={`h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:120ms] ${dotColor}`} />
                  <span className={`h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:240ms] ${dotColor}`} />
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
                    className={suggestBtn}
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
            className={`flex items-center gap-2 border-t px-3 py-3 ${composeRow}`}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              placeholder="Ask anything about your property"
              className={`h-10 flex-1 rounded-full border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 ${inputShell}`}
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
