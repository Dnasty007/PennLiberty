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
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6ed18b] shadow-[0_0_10px_rgba(110,209,139,0.7)]"
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
