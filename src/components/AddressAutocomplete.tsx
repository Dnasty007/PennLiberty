import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type Suggestion = {
  id: string;
  formatted: string;
  line1: string;
  line2: string;
};

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

/* ─── Config ─────────────────────────────────────────────────────────────────── */
const GEOAPIFY_URL  = "https://api.geoapify.com/v1/geocode/autocomplete";
const DEBOUNCE_MS   = 350;

/* Philadelphia center — biases results toward Philly metro */
const PROXIMITY_BIAS = "proximity:-75.1652,39.9526";

/* ─── Component ──────────────────────────────────────────────────────────────── */
export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef                  = useRef<HTMLDivElement>(null);
  const apiKey                        = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();

  /* ── Fetch suggestions (debounced) ──────────────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = value.trim();
    if (q.length < 3 || !apiKey) { setSuggestions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          text:    q,
          apiKey,
          filter:  "countrycode:us",
          bias:    PROXIMITY_BIAS,
          limit:   "5",
          lang:    "en",
          format:  "geojson",
        });
        const res  = await fetch(`${GEOAPIFY_URL}?${params}`);
        if (!res.ok) throw new Error("fetch failed");

        const data = await res.json() as {
          features: Array<{
            properties: {
              place_id?: string;
              formatted?: string;
              address_line1?: string;
              address_line2?: string;
            };
          }>;
        };

        const results: Suggestion[] = (data.features ?? []).map((f, i) => ({
          id:        f.properties.place_id ?? `${i}`,
          formatted: f.properties.formatted ?? "",
          line1:     f.properties.address_line1 ?? f.properties.formatted ?? "",
          line2:     f.properties.address_line2 ?? "",
        }));

        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, apiKey]);

  /* ── Close on outside click ─────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (formatted: string) => {
    onChange(formatted);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {/* Loading pulse */}
      {loading && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-pulse text-[11px] text-[#d6b06a]/55">
          searching…
        </div>
      )}

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-[200] mt-1.5 w-full overflow-hidden rounded-2xl border border-[#d6b06a]/22 bg-[rgba(8,16,30,0.97)] shadow-[0_20px_56px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl"
        >
          {suggestions.map((s) => (
            <li key={s.id} role="option">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(s.formatted); }}
                className="flex w-full items-start gap-2.5 border-t border-white/[0.055] px-4 py-3 text-left transition-colors duration-150 hover:bg-[rgba(214,176,106,0.11)] first:border-t-0"
              >
                <MapPin className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#d6b06a]/70" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white/88 leading-snug">{s.line1}</p>
                  {s.line2 && (
                    <p className="truncate text-[11.5px] text-white/45 leading-snug mt-0.5">{s.line2}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
