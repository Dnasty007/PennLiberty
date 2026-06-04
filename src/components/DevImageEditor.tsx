/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PENN LIBERTY — VISUAL DEV EDITOR  (DEV-ONLY, stripped from production)
 * ═══════════════════════════════════════════════════════════════════════════
 *  Toggle "Edit Mode" → click ANY element on the page to select it, then edit:
 *    • Text content            • Typography (size/weight/color/align/spacing)
 *    • Fill & border           • Padding / margin (per-side)
 *    • Width / height          • Opacity / shadow
 *    • Image fit + swap        • Background image fit + swap
 *  Everything persists to localStorage and survives reloads.
 *  "Export All" copies a full manifest so changes can be locked into source.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Storage ─────────────────────────────────────────────────────────────── */
const EDITS_KEY = "pl-dev-edits-v2";

type Edit = {
  path: string;
  tag: string;
  className: string;
  locator: string;            // visible text snippet — helps locate source
  text?: string;              // content override (pure-text elements only)
  originalText?: string;
  styles: Record<string, string>;  // CSS prop (kebab) → value
  swapSrc?: string;           // saved public path (images / backgrounds)
};
type Edits = Record<string, Edit>;

const load  = <T,>(k: string, fb: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "null") ?? fb; } catch { return fb; } };
const store = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

/* ─── DOM utilities ───────────────────────────────────────────────────────── */
const PANEL_IDS = "#pl-ed-main, #pl-ed-inspector, #pl-ed-hover, #pl-ed-file";

function kebab(s: string) { return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()); }

function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+(\.\d+)?/g);
  if (!m) return "#000000";
  const [r, g, b] = m.map(Number);
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

/** Parse any color (hex / rgb / rgba) into {r,g,b,a}. */
function colorToRgba(input: string): { r: number; g: number; b: number; a: number } {
  if (!input) return { r: 0, g: 0, b: 0, a: 1 };
  if (input.startsWith("#")) {
    const h = input.slice(1);
    return { r: parseInt(h.slice(0, 2), 16) || 0, g: parseInt(h.slice(2, 4), 16) || 0, b: parseInt(h.slice(4, 6), 16) || 0, a: 1 };
  }
  const m = input.match(/[\d.]+/g);
  if (!m) return { r: 0, g: 0, b: 0, a: 1 };
  return { r: +m[0] || 0, g: +m[1] || 0, b: +m[2] || 0, a: m[3] !== undefined ? +m[3] : 1 };
}
const rgbaStr = (r: number, g: number, b: number, a: number) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
const rgbHex  = (r: number, g: number, b: number) => "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");

function isPureText(el: HTMLElement): boolean {
  if (!el.childNodes.length) return false;
  for (const n of Array.from(el.childNodes)) if (n.nodeType !== Node.TEXT_NODE) return false;
  return (el.textContent ?? "").trim().length > 0;
}

function getBgUrl(el: HTMLElement): string | null {
  const bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
  if (!bg || bg === "none") return null;
  return bg.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ?? null;
}

function findBgAncestor(el: HTMLElement): HTMLElement | null {
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.body) { if (getBgUrl(cur)) return cur; cur = cur.parentElement; }
  return null;
}

/** In Image Mode: find the topmost image (or background-image) under the cursor,
 *  looking THROUGH text / gradients / overlays stacked on top of it. */
function resolveImageAt(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y) as HTMLElement[];
  for (const el of stack) {
    if (el.closest(PANEL_IDS)) continue;          // ignore the editor's own panels
    if (el.tagName === "IMG") return el;          // a real <img>
    if (el.style.backgroundImage && el.style.backgroundImage !== "none") return el; // inline bg
    if (getBgUrl(el)) return el;                  // computed bg-image
  }
  // Fallback: nearest <img> ancestor/descendant of the literal target
  const t = stack[0];
  if (!t) return null;
  return (t.closest("img") as HTMLElement) ?? (t.querySelector("img") as HTMLElement) ?? findBgAncestor(t);
}

/** Background pan metrics: current width %, overflow per axis (px), current position %. */
function bgPanBase(el: HTMLElement, nat: { w: number; h: number } | undefined) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  // width as a % of container — use inline % if set, else compute the cover %
  let sizePct: number;
  const inline = el.style.backgroundSize;
  if (inline && inline.endsWith("%")) {
    sizePct = parseFloat(inline) || 100;
  } else if (nat && r.width && r.height) {
    const coverScale = Math.max(r.width / nat.w, r.height / nat.h);
    sizePct = ((nat.w * coverScale) / r.width) * 100;
  } else {
    sizePct = 100;
  }
  const aspect = nat && nat.w ? nat.h / nat.w : 0.66;
  const imgW = (r.width * sizePct) / 100;
  const imgH = imgW * aspect;
  const overflowX = Math.max(imgW - r.width, 1);
  const overflowY = Math.max(imgH - r.height, 1);
  const pos = (el.style.backgroundPosition || cs.backgroundPosition || "50% 50%").split(/\s+/);
  const px = parseFloat(pos[0]); const py = parseFloat(pos[1]);
  return { sizePct, overflowX, overflowY, px: Number.isFinite(px) ? px : 50, py: Number.isFinite(py) ? py : 50 };
}

/** Read current CSS `translate` offset (px) from override map or computed style. */
function parseTranslate(el: HTMLElement, override?: string): { x: number; y: number } {
  const v = override ?? el.style.translate ?? getComputedStyle(el).translate;
  if (!v || v === "none") return { x: 0, y: 0 };
  const p = v.split(/\s+/).map((s) => parseFloat(s) || 0);
  return { x: p[0] ?? 0, y: p[1] ?? 0 };
}

/** Stable DOM path (nth-of-type chain from body) — consistent across reloads. */
function getPath(el: HTMLElement): string {
  const parts: string[] = [];
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.body && cur.parentElement && parts.length < 16) {
    const tag = cur.tagName.toLowerCase();
    const sibs = Array.from(cur.parentElement.children).filter((c) => c.tagName === cur!.tagName);
    parts.unshift(`${tag}:nth-of-type(${sibs.indexOf(cur) + 1})`);
    cur = cur.parentElement;
  }
  return parts.join(">");
}

function elFromPath(path: string): HTMLElement | null {
  let cur: HTMLElement = document.body;
  for (const part of path.split(">")) {
    const m = part.match(/^([\w-]+):nth-of-type\((\d+)\)$/);
    if (!m) return null;
    const [, tag, nStr] = m;
    const kids = Array.from(cur.children).filter((c) => c.tagName.toLowerCase() === tag) as HTMLElement[];
    const found = kids[parseInt(nStr, 10) - 1];
    if (!found) return null;
    cur = found;
  }
  return cur;
}

/* ─── Apply an edit to a live element ─────────────────────────────────────── */
function applyEdit(el: HTMLElement, edit: Edit) {
  if (edit.text != null && isPureText(el) && el.innerText.trim() !== edit.text.trim()) {
    el.innerText = edit.text;
  }
  for (const [prop, val] of Object.entries(edit.styles)) el.style.setProperty(prop, val);
  if (edit.swapSrc) {
    if (el.tagName === "IMG") { const img = el as HTMLImageElement; if (!img.src.endsWith(edit.swapSrc)) img.src = edit.swapSrc; }
    else el.style.backgroundImage = `url("${edit.swapSrc}")`;
  }
}

function reapplyAll(edits: Edits, exceptPath: string | null) {
  for (const [path, edit] of Object.entries(edits)) {
    if (path === exceptPath) continue;
    const el = elFromPath(path);
    if (el && el.tagName.toLowerCase() === edit.tag) applyEdit(el, edit);
  }
}

/* ─── Draggable hook ──────────────────────────────────────────────────────── */
function useDraggable(init: { x: number; y: number }) {
  const [pos, setPos] = useState(init);
  const drag = useRef(false); const off = useRef({ x: 0, y: 0 }); const pr = useRef(init); pr.current = pos;
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = true; off.current = { x: e.clientX - pr.current.x, y: e.clientY - pr.current.y }; e.preventDefault();
  }, []);
  useEffect(() => {
    const mv = (e: MouseEvent) => { if (drag.current) setPos({ x: e.clientX - off.current.x, y: e.clientY - off.current.y }); };
    const up = () => { drag.current = false; };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, []);
  return { pos, onMouseDown };
}

/* ─── UI atoms ────────────────────────────────────────────────────────────── */
const PANEL = "select-none rounded-2xl border border-white/[0.11] bg-[rgba(4,8,18,0.97)] shadow-[0_28px_70px_rgba(0,0,0,0.8)] backdrop-blur-xl";
const GRIP  = "flex items-center gap-2 px-4 py-2.5 cursor-grab active:cursor-grabbing border-b border-white/[0.07]";
const FIELD = "rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-white/85 outline-none focus:border-[#d6b06a]/45";

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.05] last:border-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/[0.02]">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">{title}</span>
        <span className="text-[#d6b06a]/60 text-[10px]">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-3 pt-1 space-y-2.5">{children}</div>}
    </div>
  );
}

function NumRow({ label, value, onChange, min, max, step = 1, unit = "px" }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/50">{label}</span>
      <div className="flex items-center gap-1">
        <input type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step}
          onChange={(e) => onChange(Number(e.target.value))} className={`${FIELD} w-16 text-center`} />
        <span className="w-4 text-[9px] text-white/25">{unit}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, unit = "" }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/50">{label}</span>
        <span className="text-[10px] text-[#d6b06a]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full cursor-pointer accent-[#d6b06a]" />
    </div>
  );
}

function ColorRow({ label, value, onChange, onClear }: { label: string; value: string; onChange: (v: string) => void; onClear?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/50">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-8 cursor-pointer rounded border border-white/10 bg-transparent" />
        <span className="text-[9px] text-white/40 w-14">{value}</span>
        {onClear && <button onClick={onClear} className="text-[9px] text-white/25 hover:text-red-400">clear</button>}
      </div>
    </div>
  );
}

function BtnGroup({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] text-white/50">{label}</span>
      <div className="flex gap-1">
        {options.map((o) => (
          <button key={o.v} onClick={() => onChange(o.v)}
            className={`flex-1 rounded-md border py-1 text-[10px] transition ${value === o.v ? "border-[#d6b06a]/50 bg-[#d6b06a]/15 text-[#d6b06a]" : "border-white/10 text-white/45 hover:text-white/70"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/50">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${FIELD} w-28`}>
        {options.map((o) => <option key={o} value={o} className="bg-[#0a1322]">{o}</option>)}
      </select>
    </div>
  );
}

function BoxRow({ label, get, set }: { label: string; get: (side: string) => number; set: (side: string, v: number) => void }) {
  const sides = ["top", "right", "bottom", "left"];
  return (
    <div>
      <span className="mb-1 block text-[10px] text-white/50">{label}</span>
      <div className="grid grid-cols-4 gap-1">
        {sides.map((s) => (
          <input key={s} type="number" value={get(s)} onChange={(e) => set(s, Number(e.target.value))}
            title={s} className={`${FIELD} w-full text-center`} placeholder={s[0].toUpperCase()} />
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-4 gap-1 text-center text-[7px] text-white/25">
        <span>T</span><span>R</span><span>B</span><span>L</span>
      </div>
    </div>
  );
}

/* ─── Selected element model ──────────────────────────────────────────────── */
type Selected = {
  el: HTMLElement;
  path: string;
  tag: string;
  className: string;
  isPure: boolean;
  isImg: boolean;
  hasBg: boolean;
  originalText: string;
  text: string;
  styles: Record<string, string>;   // override map (changed props only)
  swapName: string | null;
  savedPath: string | null;
};

export type DevImageryCycleProps = {
  onNextBackdrop: () => void;
  onNextPageHero: () => void;
  canCycleBackdrop: boolean;
  canCyclePageHero: boolean;
  backdropPreview: string;
  pageHeroPreview: string;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════════════ */
export function DevImageEditor({ imagery }: { imagery?: DevImageryCycleProps }) {
  if (!import.meta.env.DEV) return null;

  /* eslint-disable react-hooks/rules-of-hooks */
  const [editMode, setEditMode]   = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [pinMode, setPinMode]     = useState(false);
  const [collageMode, setCollageMode] = useState(false);
  const [pinData, setPinData] = useState<{ positions: Array<{ top: string; left: string }>; src: string } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);
  const [rentalPinData, setRentalPinData] = useState<{ positions: Array<{ top: string; left: string }>; heroSrc: string } | null>(null);
  const [rentalPinCopied, setRentalPinCopied] = useState(false);
  type CollageOverlay = { id: string; src: string; top: number; left: number; width: number; height: number; zIndex: number; opacity: number; blendMode: string };
  const [collageOverlays, setCollageOverlays] = useState<CollageOverlay[]>([]);
  const [collageHeroSrc, setCollageHeroSrc] = useState<string>("");
  const [collageCopied, setCollageCopied] = useState(false);
  const [selectedCollageId, setSelectedCollageId] = useState<string | null>(null);
  const [selected, setSelected]   = useState<Selected | null>(null);
  const [saving, setSaving]       = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied]       = useState<"" | "one" | "all">("");
  const [history, setHistory]     = useState<Edits>(() => load(EDITS_KEY, {}));

  const editsRef     = useRef<Edits>(load(EDITS_KEY, {}));
  const swapDataRef  = useRef<Map<string, string>>(new Map());
  const selectedRef  = useRef<Selected | null>(null);
  const editModeRef  = useRef(false);
  const imageModeRef = useRef(false);
  const selRingRef   = useRef<HTMLDivElement | null>(null);
  const hoverRingRef = useRef<HTMLDivElement | null>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const dragRef      = useRef<{ active: boolean; el: HTMLElement | null; mode: "translate" | "bg"; sx: number; sy: number; bx: number; by: number; ox: number; oy: number; moved: boolean }>({ active: false, el: null, mode: "translate", sx: 0, sy: 0, bx: 0, by: 0, ox: 1, oy: 1, moved: false });
  const bgNatRef     = useRef<Map<string, { w: number; h: number }>>(new Map());
  const suppressClickRef = useRef(false);

  const main = useDraggable({ x: Math.max(8, window.innerWidth - 232), y: 80 });
  const insp = useDraggable({ x: Math.max(8, window.innerWidth - 530), y: 80 });

  editModeRef.current  = editMode;
  imageModeRef.current = imageMode;

  /* broadcast pin mode to OwnersCoverageBand */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pl-pin-mode", { detail: pinMode }));
  }, [pinMode]);

  /* broadcast collage mode */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pl-collage-mode", { detail: collageMode }));
  }, [collageMode]);

  /* receive collage overlays from RentalsSection */
  useEffect(() => {
    const onOverlays = (e: Event) => {
      const data = (e as CustomEvent).detail as { overlays: CollageOverlay[]; heroSrc: string };
      setCollageOverlays(data.overlays);
      setCollageHeroSrc(data.heroSrc);
    };
    window.addEventListener("pl-collage-overlays", onOverlays);
    return () => window.removeEventListener("pl-collage-overlays", onOverlays);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onSelect = (e: Event) => setSelectedCollageId((e as CustomEvent<string>).detail);
    window.addEventListener("pl-collage-select", onSelect);
    return () => window.removeEventListener("pl-collage-select", onSelect);
  }, []);

  /* receive live pin positions from OwnersCoverageBand */
  useEffect(() => {
    const onPos = (e: Event) => setPinData((e as CustomEvent).detail);
    window.addEventListener("pl-pin-positions", onPos);
    return () => window.removeEventListener("pl-pin-positions", onPos);
  }, []);

  /* receive live pin positions from RentalsSection */
  useEffect(() => {
    const onPos = (e: Event) => {
      const data = (e as CustomEvent).detail as { positions: Array<{ top: string; left: string }>; heroSrc: string };
      setRentalPinData(data);
    };
    window.addEventListener("pl-rental-pin-positions", onPos);
    return () => window.removeEventListener("pl-rental-pin-positions", onPos);
  }, []);

  /* overlays */
  useEffect(() => {
    const mk = (color: string, fill: string) => {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;pointer-events:none;z-index:9988;outline:2px solid ${color};outline-offset:1px;background:${fill};border-radius:3px;transition:all .06s;display:none;`;
      document.body.appendChild(d); return d;
    };
    selRingRef.current   = mk("#d6b06a", "rgba(214,176,106,0.06)");
    hoverRingRef.current = (() => { const d = mk("#5ec8ff", "rgba(94,200,255,0.05)"); d.id = "pl-ed-hover"; return d; })();
    return () => { selRingRef.current?.remove(); hoverRingRef.current?.remove(); };
  }, []);

  const ring = useCallback((el: HTMLElement | null, which: "sel" | "hover") => {
    const ref = which === "sel" ? selRingRef.current : hoverRingRef.current;
    if (!ref) return;
    if (!el) { ref.style.display = "none"; return; }
    const r = el.getBoundingClientRect();
    Object.assign(ref.style, { display: "block", top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
  }, []);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  /* re-apply everything after each render */
  useEffect(() => {
    if (dragRef.current.active) return; // never fight an in-progress drag
    const activePath = selectedRef.current?.path ?? null;
    reapplyAll(editsRef.current, activePath);
    swapDataRef.current.forEach((dataUrl, path) => {
      if (path === activePath) return;
      const el = elFromPath(path); if (!el) return;
      if (el.tagName === "IMG") { const img = el as HTMLImageElement; if (img.src !== dataUrl) img.src = dataUrl; }
      else el.style.backgroundImage = `url("${dataUrl}")`;
    });
  });

  /* keep selection ring synced */
  useEffect(() => {
    if (!selected) { ring(null, "sel"); return; }
    const sync = () => ring(selected.el, "sel");
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => { window.removeEventListener("scroll", sync); window.removeEventListener("resize", sync); };
  }, [selected, ring]);

  /* build a Selected from an element */
  const selectEl = useCallback((el: HTMLElement) => {
    const path = getPath(el);
    if (!el.getAttribute("data-original-text") && isPureText(el)) el.setAttribute("data-original-text", el.innerText);
    const existing = editsRef.current[path];
    const isImg = el.tagName === "IMG";
    const hasBg = !isImg && !!getBgUrl(el);
    const orig = el.getAttribute("data-original-text") ?? (isPureText(el) ? el.innerText.trim() : "");
    const next: Selected = {
      el, path, tag: el.tagName.toLowerCase(), className: el.className?.toString?.() ?? "",
      isPure: isPureText(el), isImg, hasBg,
      originalText: existing?.originalText ?? orig,
      text: existing?.text ?? (isPureText(el) ? el.innerText.trim() : ""),
      styles: existing ? { ...existing.styles } : {},
      swapName: null, savedPath: existing?.swapSrc ?? null,
    };
    selectedRef.current = next; // sync immediately so re-apply uses the right active path
    setSelected(next);
    // preload natural dimensions of a background image so drag-to-pan has real math
    if (hasBg && !bgNatRef.current.has(path)) {
      const u = getBgUrl(el);
      if (u) { const im = new Image(); im.onload = () => bgNatRef.current.set(path, { w: im.naturalWidth, h: im.naturalHeight }); im.src = u; }
    }
  }, []);

  /* on mount: re-apply saved edits repeatedly to catch late-rendering content */
  useEffect(() => {
    const times = [80, 300, 800, 1800];
    const timers = times.map((ms) => window.setTimeout(() => reapplyAll(editsRef.current, selectedRef.current?.path ?? null), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  /* click + hover + drag-to-move interceptors */
  useEffect(() => {
    /** which element a click/drag targets given the active mode + cursor position */
    const pick = (e: MouseEvent): HTMLElement | null => {
      const t = e.target as HTMLElement;
      if (t.closest(PANEL_IDS)) return null;
      if (imageModeRef.current) return resolveImageAt(e.clientX, e.clientY);
      if (editModeRef.current)  return t;
      return null;
    };

    const onDown = (e: MouseEvent) => {
      // a fresh press clears any stale click-suppression from a prior drag
      suppressClickRef.current = false;
      if (!editModeRef.current && !imageModeRef.current) return;
      const el = pick(e);
      if (!el) {
        // active mode but nothing valid under cursor — still swallow so the
        // site doesn't navigate/act while you're editing
        const t = e.target as HTMLElement;
        if (!t.closest(PANEL_IDS)) { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      e.preventDefault(); e.stopPropagation();
      // Select immediately AND arm a drag in the same gesture
      selectEl(el);
      el.style.setProperty("transition", "none", "important"); // snap to cursor, no easing

      const isBg = el.tagName !== "IMG" && !!getBgUrl(el);
      if (isBg) {
        // Dragging a background PANS the image (like a crop tool), not the div
        const m = bgPanBase(el, bgNatRef.current.get(getPath(el)));
        el.style.backgroundSize = `${m.sizePct}%`;   // normalize to % so panning is reliable
        el.style.backgroundRepeat = "no-repeat";
        dragRef.current = { active: true, el, mode: "bg", sx: e.clientX, sy: e.clientY, bx: m.px, by: m.py, ox: m.overflowX, oy: m.overflowY, moved: false };
      } else {
        const base = parseTranslate(el, undefined);
        dragRef.current = { active: true, el, mode: "translate", sx: e.clientX, sy: e.clientY, bx: base.x, by: base.y, ox: 1, oy: 1, moved: false };
      }
      ring(el, "sel");
    };

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d.active && d.el) {
        if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true;
        if (d.moved) {
          if (d.mode === "bg") {
            // grab-and-slide: drag down reveals the top, etc.
            const nx = Math.max(0, Math.min(100, d.bx - ((e.clientX - d.sx) / d.ox) * 100));
            const ny = Math.max(0, Math.min(100, d.by - ((e.clientY - d.sy) / d.oy) * 100));
            d.el.style.backgroundPosition = `${Math.round(nx)}% ${Math.round(ny)}%`;
          } else {
            const dx = Math.round(d.bx + (e.clientX - d.sx));
            const dy = Math.round(d.by + (e.clientY - d.sy));
            d.el.style.translate = `${dx}px ${dy}px`;
          }
          ring(d.el, "sel");
        }
        e.preventDefault();
        return;
      }
      const active = editModeRef.current || imageModeRef.current;
      if (!active) { ring(null, "hover"); return; }
      const t = e.target as HTMLElement;
      if (t.closest(PANEL_IDS)) { ring(null, "hover"); return; }
      ring(imageModeRef.current ? resolveImageAt(e.clientX, e.clientY) : t, "hover");
    };

    const onUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      if (d.el) d.el.style.removeProperty("transition"); // restore normal transitions
      if (d.moved && d.el) {
        suppressClickRef.current = true;
        const movedEl = d.el;
        const patch: Record<string, string> = {};
        if (d.mode === "bg") {
          const nx = Math.round(Math.max(0, Math.min(100, d.bx - ((e.clientX - d.sx) / d.ox) * 100)));
          const ny = Math.round(Math.max(0, Math.min(100, d.by - ((e.clientY - d.sy) / d.oy) * 100)));
          movedEl.style.backgroundPosition = `${nx}% ${ny}%`;
          patch["background-position"] = `${nx}% ${ny}%`;
          patch["background-size"] = movedEl.style.backgroundSize;
          patch["background-repeat"] = "no-repeat";
        } else {
          const dx = Math.round(d.bx + (e.clientX - d.sx));
          const dy = Math.round(d.by + (e.clientY - d.sy));
          movedEl.style.translate = `${dx}px ${dy}px`;
          patch["translate"] = `${dx}px ${dy}px`;
        }
        // record into inspector state so Save persists it
        setSelected((prev) => {
          const base = prev && prev.el === movedEl ? prev : selectedRef.current;
          if (!base || base.el !== movedEl) return prev;
          const updated = { ...base, styles: { ...base.styles, ...patch } };
          selectedRef.current = updated;
          return updated;
        });
      }
      d.el = null;
    };

    const onClick = (e: MouseEvent) => {
      if (suppressClickRef.current) { suppressClickRef.current = false; e.preventDefault(); e.stopPropagation(); return; }
      // selection already handled in onDown; swallow the click in active modes
      const t = e.target as HTMLElement;
      if (t.closest(PANEL_IDS)) return;
      if (editModeRef.current || imageModeRef.current) { e.preventDefault(); e.stopPropagation(); }
    };

    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", onUp, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [selectEl, ring]);

  /* Image Mode: force all images + background-image divs clickable (overrides pointer-events:none) */
  useEffect(() => {
    if (!imageMode) return;
    const style = document.createElement("style");
    style.textContent = "img, [style*='background-image'], .rentals-hero-bg, .owners-card-backdrop, .site-backdrop{pointer-events:auto!important;}";
    document.head.appendChild(style);
    return () => style.remove();
  }, [imageMode]);

  /* Edit Mode: force ALL elements clickable so pointer-events:none items
     (map pins, coverage bubbles, decorative overlays) are grabbable + draggable. */
  useEffect(() => {
    if (!editMode) return;
    const style = document.createElement("style");
    style.textContent = "body *:not(#pl-ed-main):not(#pl-ed-main *):not(#pl-ed-inspector):not(#pl-ed-inspector *){pointer-events:auto!important;}";
    document.head.appendChild(style);
    return () => style.remove();
  }, [editMode]);

  /* crosshair cursor when either mode is on */
  useEffect(() => {
    if (editMode || imageMode) { document.body.style.cursor = "crosshair"; }
    else { document.body.style.cursor = ""; ring(null, "hover"); }
    return () => { document.body.style.cursor = ""; };
  }, [editMode, imageMode, ring]);

  /* ── style setter ── */
  const setStyle = (prop: string, value: string) => {
    setSelected((prev) => {
      if (!prev) return prev;
      prev.el.style.setProperty(prop, value);
      ring(prev.el, "sel");
      return { ...prev, styles: { ...prev.styles, [prop]: value } };
    });
  };
  const clearStyle = (prop: string) => {
    setSelected((prev) => {
      if (!prev) return prev;
      prev.el.style.removeProperty(prop);
      const next = { ...prev.styles }; delete next[prop];
      ring(prev.el, "sel");
      return { ...prev, styles: next };
    });
  };

  /* read current value: override → computed */
  const cs = selected ? getComputedStyle(selected.el) : null;
  const val = (prop: string, fallback: string) => selected?.styles[prop] ?? fallback;
  const numVal = (prop: string, fallback: number) => {
    const v = selected?.styles[prop]; if (v != null) return parseFloat(v);
    if (cs) { const c = parseFloat(cs.getPropertyValue(prop)); return Number.isFinite(c) ? c : fallback; }
    return fallback;
  };

  /* text setter */
  const setText = (t: string) => setSelected((prev) => { if (!prev) return prev; prev.el.innerText = t; ring(prev.el, "sel"); return { ...prev, text: t }; });

  /* parent / child nav */
  const goParent = () => { if (selected?.el.parentElement && selected.el.parentElement !== document.body) selectEl(selected.el.parentElement); };
  const goChild  = () => { const c = selected?.el.firstElementChild as HTMLElement | null; if (c) selectEl(c); };

  /* swap image */
  const onSwap = () => fileRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selected) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const dataUrl = ev.target?.result as string; if (!dataUrl) return;
      swapDataRef.current.set(selected.path, dataUrl);
      if (selected.isImg) (selected.el as HTMLImageElement).src = dataUrl;
      else selected.el.style.backgroundImage = `url("${dataUrl}")`;
      setSelected((p) => p ? { ...p, swapName: file.name, savedPath: null } : p);
    };
    r.readAsDataURL(file); e.target.value = "";
  };

  /* save */
  const onSave = async () => {
    if (!selected) return;
    const edit: Edit = {
      path: selected.path, tag: selected.tag, className: selected.className,
      locator: (selected.originalText || selected.el.innerText || "").slice(0, 60).trim(),
      styles: { ...selected.styles },
    };
    if (selected.isPure && selected.text !== selected.originalText) { edit.text = selected.text; edit.originalText = selected.originalText; }

    const dataUrl = selected.swapName ? swapDataRef.current.get(selected.path) : null;
    if (dataUrl && selected.swapName) {
      setSaving(true);
      try {
        const res = await fetch("/api/dev/save-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: selected.swapName, dataUrl }) });
        const data = await res.json() as { ok: boolean; path?: string };
        if (data.ok && data.path) { edit.swapSrc = data.path; setSelected((p) => p ? { ...p, savedPath: data.path! } : p); }
      } finally { setSaving(false); }
    } else if (selected.savedPath) {
      edit.swapSrc = selected.savedPath;
    }

    editsRef.current[selected.path] = edit;
    store(EDITS_KEY, editsRef.current);
    setHistory({ ...editsRef.current });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1100);
  };

  /* revert UNSAVED tweaks → back to last saved state (or original if never saved) */
  const onRevert = () => {
    if (!selected) return;
    const el = selected.el;
    el.removeAttribute("style");
    swapDataRef.current.delete(selected.path);

    const saved = editsRef.current[selected.path];
    if (saved) {
      // restore element + reseed the inspector from the saved edit
      applyEdit(el, saved);
      setSelected((p) => p ? {
        ...p,
        styles: { ...saved.styles },
        text: saved.text ?? p.originalText,
        swapName: null,
        savedPath: saved.swapSrc ?? null,
      } : p);
    } else {
      // never saved — go fully clean
      if (selected.isPure && el.getAttribute("data-original-text")) el.innerText = el.getAttribute("data-original-text")!;
      setSelected((p) => p ? { ...p, styles: {}, text: p.originalText, swapName: null, savedPath: null } : p);
    }
    ring(el, "sel");
  };

  /* reset selected → all the way to original source (clears saved too) */
  const onReset = () => {
    if (!selected) return;
    delete editsRef.current[selected.path];
    swapDataRef.current.delete(selected.path);
    store(EDITS_KEY, editsRef.current); setHistory({ ...editsRef.current });
    selected.el.removeAttribute("style");
    if (selected.isPure && selected.el.getAttribute("data-original-text")) selected.el.innerText = selected.el.getAttribute("data-original-text")!;
    setSelected(null); ring(null, "sel");
  };

  const onClose = () => { setSelected(null); ring(null, "sel"); };

  /* manifest builders */
  const editToText = (edit: Edit, i: number) => {
    const lines = [`[${i + 1}] <${edit.tag}>${edit.className ? ` .${edit.className.split(" ").slice(0, 2).join(".")}` : ""}`];
    if (edit.locator) lines.push(`    locate: "${edit.locator}"`);
    if (edit.text != null) lines.push(`    TEXT: "${edit.originalText}" → "${edit.text}"`);
    if (edit.swapSrc) lines.push(`    IMAGE → ${edit.swapSrc}`);
    const st = Object.entries(edit.styles);
    if (st.length) lines.push(`    STYLES: ${st.map(([k, v]) => `${k}:${v}`).join("; ")}`);
    return lines.join("\n");
  };

  const copyOne = () => {
    if (!selected) return;
    const edit: Edit = { path: selected.path, tag: selected.tag, className: selected.className, locator: (selected.originalText || "").slice(0, 60), styles: selected.styles };
    if (selected.isPure && selected.text !== selected.originalText) { edit.text = selected.text; edit.originalText = selected.originalText; }
    if (selected.savedPath) edit.swapSrc = selected.savedPath;
    navigator.clipboard.writeText(editToText(edit, 0)).then(() => { setCopied("one"); setTimeout(() => setCopied(""), 1800); });
  };

  const exportAll = () => {
    const all = Object.values(editsRef.current);
    const body = all.length ? all.map(editToText).join("\n\n") : "(no saved changes)";
    const text = `═══ PENN LIBERTY — EDIT MANIFEST (${all.length} change${all.length === 1 ? "" : "s"}) ═══\n\n${body}\n\n═══ Apply these to the source files. ═══`;
    navigator.clipboard.writeText(text).then(() => { setCopied("all"); setTimeout(() => setCopied(""), 1800); });
  };

  const clearAll = () => {
    // Reset every edited element back to its original look, surgically — only
    // removing the props WE added, so app-set inline styles (pin top/left) survive.
    Object.entries(editsRef.current).forEach(([path, edit]) => {
      const el = elFromPath(path);
      if (!el) return;
      Object.keys(edit.styles).forEach((p) => el.style.removeProperty(p));
      el.style.removeProperty("translate");
      el.style.removeProperty("transition");
      if (edit.text != null) {
        const o = el.getAttribute("data-original-text");
        if (o != null) el.innerText = o;
      }
      if (edit.swapSrc) {
        if (el.tagName === "IMG") { const o = el.getAttribute("data-original-src"); if (o) (el as HTMLImageElement).src = o; }
        else { const o = el.getAttribute("data-original-bg"); el.style.backgroundImage = o ?? ""; }
      }
    });
    editsRef.current = {};
    swapDataRef.current.clear();
    store(EDITS_KEY, {});
    setHistory({});
    setSelected(null);
    selectedRef.current = null;
    if (selRingRef.current) selRingRef.current.style.display = "none";
  };

  const count = Object.keys(history).length;

  /* breadcrumb */
  const crumb = selected ? (() => {
    const arr: string[] = []; let c: HTMLElement | null = selected.el;
    while (c && c !== document.body && arr.length < 4) { arr.unshift(c.tagName.toLowerCase()); c = c.parentElement; }
    return arr.join(" › ");
  })() : "";

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <input id="pl-ed-file" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {/* ── MAIN PANEL ──────────────────────────────────────────────────── */}
      <div id="pl-ed-main" className={`fixed z-[9999] w-56 ${PANEL}`} style={{ left: main.pos.x, top: main.pos.y, fontFamily: "monospace" }}>
        <div className={GRIP} onMouseDown={main.onMouseDown}>
          <span className="text-[#d6b06a]/50">⠿</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#d6b06a]">Visual Editor</span>
        </div>

        {/* Mode toggles */}
        <div className="px-4 py-3 space-y-2">
          {/* Edit Mode */}
          <button onClick={() => { setEditMode((m) => { const n = !m; if (n) { setImageMode(false); setPinMode(false); setCollageMode(false); } return n; }); }}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 transition ${editMode ? "border-[#d6b06a]/50 bg-[#d6b06a]/15" : "border-white/10 bg-white/[0.03]"}`}>
            <span className={`text-[11px] font-bold ${editMode ? "text-[#d6b06a]" : "text-white/55"}`}>Edit Mode</span>
            <span className={`relative h-4 w-7 rounded-full transition ${editMode ? "bg-[#d6b06a]" : "bg-white/15"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${editMode ? "left-3.5" : "left-0.5"}`} />
            </span>
          </button>

          {/* Image Mode */}
          <button onClick={() => { setImageMode((m) => { const n = !m; if (n) { setEditMode(false); setPinMode(false); setCollageMode(false); } return n; }); }}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 transition ${imageMode ? "border-[#5ec8ff]/50 bg-[#5ec8ff]/12" : "border-white/10 bg-white/[0.03]"}`}>
            <span className={`text-[11px] font-bold ${imageMode ? "text-[#5ec8ff]" : "text-white/55"}`}>🖼 Image Mode</span>
            <span className={`relative h-4 w-7 rounded-full transition ${imageMode ? "bg-[#5ec8ff]" : "bg-white/15"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${imageMode ? "left-3.5" : "left-0.5"}`} />
            </span>
          </button>

          {/* Pin Mode */}
          <button onClick={() => { setPinMode((m) => { const n = !m; if (n) { setEditMode(false); setImageMode(false); setCollageMode(false); } return n; }); }}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 transition ${pinMode ? "border-[#d6b06a]/50 bg-[#d6b06a]/12" : "border-white/10 bg-white/[0.03]"}`}>
            <span className={`text-[11px] font-bold ${pinMode ? "text-[#d6b06a]" : "text-white/55"}`}>📍 Pin Mode</span>
            <span className={`relative h-4 w-7 rounded-full transition ${pinMode ? "bg-[#d6b06a]" : "bg-white/15"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${pinMode ? "left-3.5" : "left-0.5"}`} />
            </span>
          </button>

          {/* Collage Mode */}
          <button onClick={() => { setCollageMode((m) => { const n = !m; if (n) { setEditMode(false); setImageMode(false); setPinMode(false); } return n; }); }}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 transition ${collageMode ? "border-[#5ec8ff]/50 bg-[#5ec8ff]/12" : "border-white/10 bg-white/[0.03]"}`}>
            <span className={`text-[11px] font-bold ${collageMode ? "text-[#5ec8ff]" : "text-white/55"}`}>🖼️ Collage Mode</span>
            <span className={`relative h-4 w-7 rounded-full transition ${collageMode ? "bg-[#5ec8ff]" : "bg-white/15"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${collageMode ? "left-3.5" : "left-0.5"}`} />
            </span>
          </button>

          <p className="mt-1 text-[8px] text-white/30 leading-relaxed">
            {collageMode ? "Add photos, drag to position, resize, layer." : pinMode ? "Drag pins on Owners map or Rentals hero to reposition." : imageMode ? "Click any image (even backdrops) to edit." : editMode ? "Click any element to edit it." : "Pick a mode, then click."}
          </p>

          {/* Collage controls */}
          {collageMode && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("pl-collage-add"))}
                className="w-full rounded-lg border border-[#5ec8ff]/40 bg-[#5ec8ff]/15 py-2 text-[10px] font-bold text-[#5ec8ff] transition hover:bg-[#5ec8ff]/25"
              >
                + Add Photo
              </button>

              {collageOverlays.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">Layers for {collageHeroSrc.split("/").pop()}</p>
                  {[...collageOverlays].sort((a, b) => b.zIndex - a.zIndex).map((o) => (
                    <div
                      key={o.id}
                      className={`rounded-lg border px-2 py-1.5 cursor-pointer transition ${selectedCollageId === o.id ? "border-[#5ec8ff]/50 bg-[#5ec8ff]/10" : "border-white/10 bg-white/[0.03]"}`}
                      onClick={() => setSelectedCollageId(selectedCollageId === o.id ? null : o.id)}
                    >
                      <div className="flex items-center gap-1.5">
                        <img src={o.src} alt="" className="h-6 w-6 rounded object-cover" />
                        <span className="flex-1 text-[8px] text-white/40 truncate">Layer {o.zIndex + 1}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("pl-collage-layer", { detail: { id: o.id, direction: "up" } })); }}
                          className="text-[10px] text-white/40 hover:text-[#5ec8ff]"
                          title="Bring forward"
                        >↑</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("pl-collage-layer", { detail: { id: o.id, direction: "down" } })); }}
                          className="text-[10px] text-white/40 hover:text-[#5ec8ff]"
                          title="Send back"
                        >↓</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("pl-collage-delete", { detail: o.id })); }}
                          className="text-[10px] text-white/40 hover:text-red-400"
                          title="Delete"
                        >✕</button>
                      </div>

                      {/* Expanded controls when selected */}
                      {selectedCollageId === o.id && (
                        <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                          {/* Opacity slider */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] text-white/50">Opacity</span>
                              <span className="text-[9px] text-[#5ec8ff]">{Math.round(o.opacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={o.opacity}
                              onInput={(e) => window.dispatchEvent(new CustomEvent("pl-collage-opacity", { detail: { id: o.id, opacity: parseFloat((e.target as HTMLInputElement).value) } }))}
                              onChange={(e) => window.dispatchEvent(new CustomEvent("pl-collage-opacity", { detail: { id: o.id, opacity: parseFloat(e.target.value) } }))}
                              className="w-full cursor-pointer accent-[#5ec8ff]"
                            />
                          </div>

                          {/* Blend mode dropdown */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-white/50">Blend</span>
                            <select
                              value={o.blendMode}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("pl-collage-blend", { detail: { id: o.id, blendMode: e.target.value } })); }}
                              className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] text-white/85 outline-none"
                            >
                              <option value="normal" className="bg-[#0a1322]">Normal</option>
                              <option value="multiply" className="bg-[#0a1322]">Multiply</option>
                              <option value="screen" className="bg-[#0a1322]">Screen</option>
                              <option value="overlay" className="bg-[#0a1322]">Overlay</option>
                              <option value="darken" className="bg-[#0a1322]">Darken</option>
                              <option value="lighten" className="bg-[#0a1322]">Lighten</option>
                              <option value="color-dodge" className="bg-[#0a1322]">Color Dodge</option>
                              <option value="color-burn" className="bg-[#0a1322]">Color Burn</option>
                              <option value="soft-light" className="bg-[#0a1322]">Soft Light</option>
                              <option value="hard-light" className="bg-[#0a1322]">Hard Light</option>
                              <option value="difference" className="bg-[#0a1322]">Difference</option>
                              <option value="exclusion" className="bg-[#0a1322]">Exclusion</option>
                              <option value="hue" className="bg-[#0a1322]">Hue</option>
                              <option value="saturation" className="bg-[#0a1322]">Saturation</option>
                              <option value="color" className="bg-[#0a1322]">Color</option>
                              <option value="luminosity" className="bg-[#0a1322]">Luminosity</option>
                            </select>
                          </div>

                          {/* Size info */}
                          <div className="text-[8px] text-white/30">
                            Size: {Math.round(o.width)}% × {Math.round(o.height)}%
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const code =
                        `"${collageHeroSrc}": ` +
                        JSON.stringify(
                          collageOverlays.map(({ id: _i, ...rest }) => ({
                            ...rest,
                            src: rest.src.startsWith("/")
                              ? rest.src
                              : "/* save image under public/rentals-hero/overlays/ and use /rentals-hero/overlays/your-file.jpg */",
                          })),
                          null,
                          2,
                        );
                      navigator.clipboard.writeText(code).then(() => { setCollageCopied(true); setTimeout(() => setCollageCopied(false), 1800); });
                    }}
                    className={`w-full rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${collageCopied ? "bg-green-500/20 text-green-400" : "bg-[#5ec8ff]/15 text-[#5ec8ff] hover:bg-[#5ec8ff]/25"}`}
                  >
                    {collageCopied ? "✓ Copied!" : "⬇ Copy Collage Layout"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Owners pin positions export */}
          {pinMode && (
            <div className="mt-1 space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">Owners chips</p>
              {pinData ? (
                <>
                  <p className="text-[8px] text-[#d6b06a]/70 truncate font-mono">{pinData.src.split("/").pop()}</p>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 space-y-0.5">
                    {pinData.positions.map((p, i) => (
                      <p key={i} className="text-[8px] text-white/40 font-mono truncate">{i + 1}: {p.top} / {p.left}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const lines = pinData.positions.map((p) => `    { top: "${p.top}", left: "${p.left}" },`).join("\n");
                      const code = `  "${pinData.src}": [\n${lines}\n  ],`;
                      navigator.clipboard.writeText(code).then(() => { setPinCopied(true); setTimeout(() => setPinCopied(false), 1800); });
                    }}
                    className={`w-full rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${pinCopied ? "bg-green-500/20 text-green-400" : "bg-[#d6b06a]/15 text-[#d6b06a] hover:bg-[#d6b06a]/25"}`}
                  >
                    {pinCopied ? "✓ Copied!" : "⬇ Copy owners pins"}
                  </button>
                </>
              ) : (
                <p className="text-[8px] text-white/30 leading-relaxed">Go to <span className="text-[#d6b06a]">For Owners</span> page to drag chips.</p>
              )}
            </div>
          )}

          {/* Rental pin positions export */}
          {pinMode && (
            <div className="mt-2 space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">Rentals pins</p>
              {rentalPinData && rentalPinData.positions.length > 0 ? (
                <>
                  <p className="text-[8px] text-[#d6b06a]/70 truncate font-mono">{rentalPinData.heroSrc.split("/").pop()}</p>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 space-y-0.5">
                    {rentalPinData.positions.map((p, i) => (
                      <p key={i} className="text-[8px] text-white/40 font-mono truncate">{i + 1}: {p.top} / {p.left}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const lines = rentalPinData.positions.map((p) => `    { top: "${p.top}", left: "${p.left}" },`).join("\n");
                      const code = `  "${rentalPinData.heroSrc}": [\n${lines}\n  ],`;
                      navigator.clipboard.writeText(code).then(() => { setRentalPinCopied(true); setTimeout(() => setRentalPinCopied(false), 1800); });
                    }}
                    className={`w-full rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${rentalPinCopied ? "bg-green-500/20 text-green-400" : "bg-[#d6b06a]/15 text-[#d6b06a] hover:bg-[#d6b06a]/25"}`}
                  >
                    {rentalPinCopied ? "✓ Copied!" : "⬇ Copy pins for this image"}
                  </button>
                </>
              ) : (
                <p className="text-[8px] text-white/30 leading-relaxed">Go to <span className="text-[#d6b06a]">Rentals</span> page to drag unit pins.</p>
              )}
            </div>
          )}
        </div>

        {imagery && (
          <>
            <div className="h-px bg-white/[0.06]" />
            <div className="px-4 py-3 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Image review</p>
              <button
                type="button"
                disabled={!imagery.canCycleBackdrop}
                onClick={imagery.onNextBackdrop}
                className="w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-left transition hover:border-[#5ec8ff]/40 hover:bg-[#5ec8ff]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-[10px] font-bold text-[#5ec8ff]">▶ Next backdrop</span>
                <span className="mt-0.5 block truncate text-[8px] text-white/35">
                  {imagery.canCycleBackdrop ? imagery.backdropPreview : "Neutral mode — switch Light/Dark"}
                </span>
              </button>
              <button
                type="button"
                disabled={!imagery.canCyclePageHero}
                onClick={imagery.onNextPageHero}
                className="w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-left transition hover:border-[#d6b06a]/40 hover:bg-[#d6b06a]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-[10px] font-bold text-[#d6b06a]">▶ Next page image</span>
                <span className="mt-0.5 block truncate text-[8px] text-white/35">
                  {imagery.canCyclePageHero
                    ? imagery.pageHeroPreview
                    : "Open Rentals, Listings, or For Owners"}
                </span>
              </button>
              <p className="text-[8px] text-white/28 leading-relaxed">No refresh — cycles the photo pool for this page.</p>
            </div>
          </>
        )}

        <div className="h-px bg-white/[0.06]" />

        {/* Export */}
        <div className="px-3 py-3 space-y-1.5">
          <button onClick={exportAll}
            className={`w-full rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition ${copied === "all" ? "bg-green-500/20 text-green-400" : "bg-[#d6b06a] text-[#08111f] hover:bg-[#e4be78]"}`}>
            {copied === "all" ? "✓ Copied Manifest" : `⬇ Export All (${count})`}
          </button>
          {count > 0 && (
            <button onClick={clearAll} className="w-full text-[9px] text-white/25 hover:text-red-400 transition text-center py-0.5">
              Clear all saves
            </button>
          )}
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* History */}
        <div className="px-3 py-2 max-h-40 overflow-y-auto space-y-1">
          {count === 0
            ? <p className="text-[9px] text-white/18 px-1 py-1">No saved changes yet.</p>
            : Object.values(history).map((e, i) => (
              <button key={e.path} onClick={() => { const el = elFromPath(e.path); if (el) { if (!editMode) setEditMode(true); selectEl(el); el.scrollIntoView({ behavior: "smooth", block: "center" }); } }}
                className="block w-full rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-left transition hover:border-[#d6b06a]/30">
                <p className="text-[8px] text-white/40 truncate">{i + 1}. &lt;{e.tag}&gt; {e.text ? "✏️" : ""}{e.swapSrc ? "🖼" : ""}{Object.keys(e.styles).length ? "🎨" : ""}</p>
                <p className="text-[8px] text-white/30 truncate mt-0.5">{e.locator || e.path.split(">").pop()}</p>
              </button>
            ))
          }
        </div>
      </div>

      {/* ── INSPECTOR PANEL ─────────────────────────────────────────────── */}
      {selected && (
        <div id="pl-ed-inspector" className={`fixed z-[9999] w-72 ${PANEL} max-h-[85vh] overflow-hidden flex flex-col`} style={{ left: insp.pos.x, top: insp.pos.y, fontFamily: "monospace" }}>
          <div className={GRIP} onMouseDown={insp.onMouseDown}>
            <span className="text-[#d6b06a]/50">⠿</span>
            <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-[#d6b06a]">Inspector</span>
            <button onClick={onClose} className="text-white/25 hover:text-white text-sm leading-none">✕</button>
          </div>

          {/* breadcrumb + nav */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
            <button onClick={goParent} title="Select parent" className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50 hover:text-[#d6b06a]">↑</button>
            <button onClick={goChild} title="Select child" className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50 hover:text-[#d6b06a]">↓</button>
            <span className="flex-1 truncate text-[9px] text-white/40">{crumb}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* POSITION (drag to move) */}
            <Section title="Position — drag to move" defaultOpen>
              <p className="text-[8px] text-white/30 leading-relaxed">
                {selected.hasBg
                  ? "Drag the image on the page to pan it (zoom in first to reveal more). Or nudge X / Y below."
                  : "Grab the highlighted element on the page and drag it, or nudge with X / Y."}
              </p>
              {(() => {
                const tr = parseTranslate(selected.el, selected.styles.translate);
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <NumRow label="X" value={tr.x} onChange={(v) => setStyle("translate", `${v}px ${tr.y}px`)} step={1} />
                    <NumRow label="Y" value={tr.y} onChange={(v) => setStyle("translate", `${tr.x}px ${v}px`)} step={1} />
                  </div>
                );
              })()}
              {(selected.styles.translate) && (
                <button onClick={() => clearStyle("translate")} className="w-full text-[9px] text-white/30 hover:text-[#d6b06a] transition text-center">
                  reset position
                </button>
              )}
            </Section>

            {/* CONTENT */}
            {selected.isPure && (
              <Section title="Content" defaultOpen>
                <textarea value={selected.text} onChange={(e) => setText(e.target.value)} rows={3}
                  className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] leading-relaxed text-white/85 outline-none focus:border-[#d6b06a]/40" />
              </Section>
            )}

            {/* TYPOGRAPHY */}
            <Section title="Typography" defaultOpen>
              <NumRow label="Font size" value={numVal("font-size", 16)} onChange={(v) => setStyle("font-size", `${v}px`)} min={6} max={140} />
              <SelRow label="Weight" value={val("font-weight", cs?.fontWeight ?? "400")} options={["300", "400", "500", "600", "700", "800", "900"]} onChange={(v) => setStyle("font-weight", v)} />
              <ColorRow label="Text color" value={val("color", rgbToHex(cs?.color ?? "rgb(0,0,0)"))} onChange={(v) => setStyle("color", v)} onClear={() => clearStyle("color")} />
              <BtnGroup label="Align" value={val("text-align", cs?.textAlign ?? "left")} options={[{ v: "left", l: "L" }, { v: "center", l: "C" }, { v: "right", l: "R" }, { v: "justify", l: "J" }]} onChange={(v) => setStyle("text-align", v)} />
              <NumRow label="Line height" value={numVal("line-height", parseFloat(cs?.lineHeight ?? "0") || 1.2)} step={0.05} unit="" onChange={(v) => setStyle("line-height", String(v))} />
              <NumRow label="Letter sp." value={numVal("letter-spacing", 0)} step={0.1} onChange={(v) => setStyle("letter-spacing", `${v}px`)} />
              <SelRow label="Transform" value={val("text-transform", cs?.textTransform ?? "none")} options={["none", "uppercase", "lowercase", "capitalize"]} onChange={(v) => setStyle("text-transform", v)} />
            </Section>

            {/* FILL & BORDER */}
            <Section title="Fill & Border">
              {(() => {
                const bg = colorToRgba(selected.styles["background-color"] ?? cs?.backgroundColor ?? "rgb(0,0,0)");
                return (
                  <>
                    <ColorRow label="Background" value={rgbHex(bg.r, bg.g, bg.b)}
                      onChange={(hex) => { const c = colorToRgba(hex); setStyle("background-color", rgbaStr(c.r, c.g, c.b, bg.a)); }}
                      onClear={() => clearStyle("background-color")} />
                    <SliderRow label="Fill opacity" min={0} max={1} step={0.01} value={Math.round(bg.a * 100) / 100}
                      onChange={(a) => setStyle("background-color", rgbaStr(bg.r, bg.g, bg.b, a))} />
                  </>
                );
              })()}
              <NumRow label="Radius" value={numVal("border-radius", 0)} min={0} max={100} onChange={(v) => setStyle("border-radius", `${v}px`)} />
              <NumRow label="Border w." value={numVal("border-width", 0)} min={0} max={20} onChange={(v) => { setStyle("border-width", `${v}px`); setStyle("border-style", "solid"); }} />
              <ColorRow label="Border col." value={val("border-color", rgbToHex(cs?.borderColor ?? "rgb(0,0,0)"))} onChange={(v) => setStyle("border-color", v)} onClear={() => clearStyle("border-color")} />
            </Section>

            {/* SPACING */}
            <Section title="Spacing">
              <BoxRow label="Padding" get={(s) => numVal(`padding-${s}`, 0)} set={(s, v) => setStyle(`padding-${s}`, `${v}px`)} />
              <BoxRow label="Margin" get={(s) => numVal(`margin-${s}`, 0)} set={(s, v) => setStyle(`margin-${s}`, `${v}px`)} />
            </Section>

            {/* SIZE */}
            <Section title="Size">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/50">Width</span>
                <input value={val("width", "")} placeholder="auto" onChange={(e) => e.target.value ? setStyle("width", e.target.value) : clearStyle("width")} className={`${FIELD} w-24 text-center`} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/50">Height</span>
                <input value={val("height", "")} placeholder="auto" onChange={(e) => e.target.value ? setStyle("height", e.target.value) : clearStyle("height")} className={`${FIELD} w-24 text-center`} />
              </div>
              <p className="text-[8px] text-white/25">Accepts px, %, rem, vh, auto…</p>
            </Section>

            {/* EFFECTS */}
            <Section title="Effects">
              <SliderRow label="Whole opacity" min={0} max={1} step={0.01} value={numVal("opacity", 1)} onChange={(v) => setStyle("opacity", String(v))} />
              <p className="text-[8px] text-white/25 leading-relaxed">Fades everything incl. text. To fade only the glass, use <span className="text-[#d6b06a]/70">Fill opacity</span> in Fill &amp; Border.</p>
              <BtnGroup label="Shadow" value={val("box-shadow", "none") === "none" ? "none" : "on"} options={[{ v: "none", l: "None" }, { v: "soft", l: "Soft" }, { v: "strong", l: "Strong" }]}
                onChange={(v) => { if (v === "none") clearStyle("box-shadow"); else setStyle("box-shadow", v === "soft" ? "0 10px 30px rgba(0,0,0,0.25)" : "0 24px 60px rgba(0,0,0,0.55)"); }} />
            </Section>

            {/* IMAGE FIT */}
            {(selected.isImg || selected.hasBg) && (
              <Section title={selected.isImg ? "Image Fit" : "Background Fit"} defaultOpen>
                {selected.isImg ? (
                  <>
                    <SliderRow label="Zoom" min={0.5} max={2.5} step={0.01} value={numVal("transform", 1) || (parseFloat(val("transform", "").match(/scale\(([^)]+)\)/)?.[1] ?? "1"))} unit="×"
                      onChange={(v) => setStyle("transform", `scale(${v})`)} />
                    <div className="grid grid-cols-2 gap-2">
                      <NumRow label="X" value={parseFloat(val("object-position", cs?.objectPosition ?? "50% 50%").split(" ")[0]) || 50} unit="%" min={0} max={100}
                        onChange={(v) => { const y = val("object-position", "50% 50%").split(" ")[1] ?? "50%"; setStyle("object-position", `${v}% ${y}`); }} />
                      <NumRow label="Y" value={parseFloat(val("object-position", cs?.objectPosition ?? "50% 50%").split(" ")[1]) || 50} unit="%" min={0} max={100}
                        onChange={(v) => { const x = val("object-position", "50% 50%").split(" ")[0] ?? "50%"; setStyle("object-position", `${x} ${v}%`); }} />
                    </div>
                    <SelRow label="Object fit" value={val("object-fit", cs?.objectFit ?? "cover")} options={["cover", "contain", "fill", "none"]} onChange={(v) => setStyle("object-fit", v)} />
                  </>
                ) : (
                  <>
                    <BtnGroup label="Fit" value={["cover", "contain"].includes(val("background-size", "")) ? val("background-size", "") : "custom"}
                      options={[{ v: "cover", l: "Cover" }, { v: "contain", l: "Whole" }, { v: "custom", l: "Custom" }]}
                      onChange={(v) => { if (v === "custom") { setStyle("background-size", "100%"); } else { setStyle("background-size", v); } setStyle("background-repeat", "no-repeat"); }} />
                    <SliderRow label="Zoom" min={15} max={350} step={1} unit="%"
                      value={parseFloat(val("background-size", "100")) || 100}
                      onChange={(v) => { setStyle("background-size", `${v}%`); setStyle("background-repeat", "no-repeat"); }} />
                    <NumRow label="Zoom %" value={parseFloat(val("background-size", "100")) || 100} unit="%" min={10} max={600}
                      onChange={(v) => { setStyle("background-size", `${v}%`); setStyle("background-repeat", "no-repeat"); }} />
                    <div className="grid grid-cols-2 gap-2">
                      <NumRow label="X" value={Math.round(parseFloat(val("background-position", cs?.backgroundPosition ?? "50% 50%").split(" ")[0]) || 50)} unit="%" min={-50} max={150}
                        onChange={(v) => { const y = val("background-position", cs?.backgroundPosition ?? "50% 50%").split(" ")[1] ?? "50%"; setStyle("background-position", `${v}% ${y}`); }} />
                      <NumRow label="Y" value={Math.round(parseFloat(val("background-position", cs?.backgroundPosition ?? "50% 50%").split(" ")[1]) || 50)} unit="%" min={-50} max={150}
                        onChange={(v) => { const x = val("background-position", cs?.backgroundPosition ?? "50% 50%").split(" ")[0] ?? "50%"; setStyle("background-position", `${x} ${v}%`); }} />
                    </div>
                    <button onClick={() => { clearStyle("background-size"); clearStyle("background-repeat"); }}
                      className="w-full text-[9px] text-white/35 hover:text-[#d6b06a] transition text-center">
                      reset zoom to cover
                    </button>
                  </>
                )}
                <button onClick={onSwap} className="w-full rounded-lg border border-[#d6b06a]/25 py-2 text-[10px] font-bold text-[#d6b06a] transition hover:border-[#d6b06a]/55 hover:bg-[#d6b06a]/10">
                  📂 Swap Image
                </button>
                {selected.swapName && <p className="text-[9px] text-green-400/80">✓ {selected.swapName}</p>}
                {selected.savedPath && <p className="text-[9px] text-green-400 break-all">→ {selected.savedPath}</p>}
              </Section>
            )}
          </div>

          {/* sticky actions */}
          <div className="border-t border-white/[0.08] p-3 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onSave} disabled={saving}
                className={`rounded-lg py-2 text-[10px] font-bold transition-all duration-200 disabled:opacity-50 ${
                  savedFlash
                    ? "bg-green-500 text-white shadow-[0_0_18px_rgba(34,197,94,0.6)]"
                    : "bg-[#d6b06a] text-[#08111f] hover:bg-[#e4be78]"
                }`}>
                {saving ? "Saving…" : savedFlash ? "✓ Saved!" : "Save"}
              </button>
              <button onClick={onRevert} className="rounded-lg border border-white/15 py-2 text-[10px] font-bold text-white/70 transition hover:border-[#d6b06a]/45 hover:text-[#d6b06a]">
                ↶ Revert
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={copyOne} className={`rounded-lg border py-2 text-[10px] font-bold transition ${copied === "one" ? "border-green-500/35 text-green-400" : "border-white/12 text-white/55 hover:text-white"}`}>
                {copied === "one" ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={onReset} className="rounded-lg border border-white/12 py-2 text-[10px] font-bold text-white/45 transition hover:border-red-400/40 hover:text-red-400">
                Reset all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
  /* eslint-enable react-hooks/rules-of-hooks */
}
