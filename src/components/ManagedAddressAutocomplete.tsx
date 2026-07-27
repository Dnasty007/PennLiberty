import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Building2, MapPin } from "lucide-react";
import {
  type ManagedProperty,
  searchManagedProperties,
  MANAGED_MIN_CHARS,
} from "@/lib/managedPortfolio";

type ManagedAddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  /** Fired when user picks a managed property (for unit dropdowns). */
  onSelectManaged?: (property: ManagedProperty) => void;
  /** Owner email — boosts their properties in the list. */
  ownerEmail?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  /** Prefer light-mode dropdown chrome (enroll form on cream cards). */
  lightMode?: boolean;
};

export function ManagedAddressAutocomplete({
  value,
  onChange,
  onSelectManaged,
  ownerEmail,
  placeholder,
  className,
  id,
  lightMode = false,
}: ManagedAddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () =>
      searchManagedProperties(value, {
        ownerEmail,
        limit: 6,
        ownerOnly: false,
      }),
    [value, ownerEmail],
  );

  useEffect(() => {
    setHighlight(0);
    setOpen(suggestions.length > 0 && value.trim().length >= MANAGED_MIN_CHARS);
  }, [suggestions, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (p: ManagedProperty) => {
    onChange(p.formatted);
    onSelectManaged?.(p);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && suggestions[highlight]) {
      e.preventDefault();
      select(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const dropClass = lightMode
    ? "absolute z-[200] mt-1.5 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
    : "absolute z-[200] mt-1.5 w-full overflow-hidden rounded-2xl border border-[#d6b06a]/22 bg-[rgba(8,16,30,0.97)] shadow-[0_20px_56px_rgba(0,0,0,0.55)] backdrop-blur-xl";

  const itemHover = lightMode
    ? "hover:bg-[#d6b06a]/12"
    : "hover:bg-[rgba(214,176,106,0.11)]";
  const itemActive = lightMode ? "bg-[#d6b06a]/16" : "bg-[rgba(214,176,106,0.14)]";
  const titleCls = lightMode ? "text-black/88" : "text-white/88";
  const subCls = lightMode ? "text-black/45" : "text-white/45";
  const badgeCls = lightMode
    ? "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#926d28]"
    : "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6b06a]/85";

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && suggestions.length > 0 && (
        <ul role="listbox" className={dropClass}>
          <li className={`border-b px-4 py-2 ${lightMode ? "border-black/6" : "border-white/[0.06]"}`}>
            <span className={badgeCls}>Penn Liberty managed</span>
          </li>
          {suggestions.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(p);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-start gap-2.5 border-t px-4 py-3 text-left transition-colors duration-150 first:border-t-0 ${
                  lightMode ? "border-black/5" : "border-white/[0.055]"
                } ${itemHover} ${i === highlight ? itemActive : ""}`}
              >
                <Building2
                  className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${lightMode ? "text-[#d6b06a]" : "text-[#d6b06a]/70"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-medium leading-snug ${titleCls}`}>
                    {p.street}
                  </p>
                  <p className={`mt-0.5 truncate text-[11.5px] leading-snug ${subCls}`}>
                    {p.city}, {p.state} {p.zip}
                    {p.unitCount > 1
                      ? ` · ${p.unitCount} units`
                      : p.units.length > 0
                        ? ` · unit ${p.units[0]}`
                        : ""}
                  </p>
                </div>
                <MapPin className="mt-1 h-3 w-3 shrink-0 opacity-40" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
