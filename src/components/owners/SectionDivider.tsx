type SectionDividerProps = {
  label: string;
  /** Small chapter marker (shown inline—no oversized watermarks). */
  number?: string;
  lightMode: boolean;
};

export function SectionDivider({ label, number, lightMode }: SectionDividerProps) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";

  const rule = lightMode ? "border-black/10" : "border-white/[0.08]";
  const mono = lightMode ? "text-[#a67c32]" : "text-[#dcb672]";
  const heading = lightMode ? "text-black/54" : "text-white/54";

  return (
    <div className="relative mb-7 md:mb-9">
      <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b ${rule} pb-3 md:gap-x-5`}>
        {number ? (
          <span className={`font-mono text-xs font-semibold tabular-nums ${mono}`}>{number}</span>
        ) : null}
        <h2 id={`owners-${slug}`} className={`min-w-[40%] flex-1 text-[11px] font-semibold uppercase tracking-[0.26em] ${heading}`}>
          {label}
        </h2>
      </div>
    </div>
  );
}
