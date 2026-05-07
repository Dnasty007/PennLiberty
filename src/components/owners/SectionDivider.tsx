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
