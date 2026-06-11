import { ClipboardList, Landmark, LibraryBig, ShieldCheck, Wrench } from "lucide-react";
import { ownersOperateIntro, ownersOperatePillars } from "@/lib/owners";

const pillarIcons = [Landmark, ClipboardList, Wrench, LibraryBig];

const BUILDIUM_URL = "https://www.buildium.com/";

type OwnersOperateBandProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

export function OwnersOperateBand({ lightMode, mutedText, subtleText }: OwnersOperateBandProps) {
  const shell = lightMode
    ? "border-black/12 bg-gradient-to-br from-white/75 to-white/50 shadow-[inset_0_0_0_1px_rgba(214,176,106,0.12)]"
    : "border-white/[0.10] bg-[linear-gradient(150deg,rgba(18,32,54,0.5),rgba(7,13,26,0.36))] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.08)]";
  const eyebrow = lightMode ? "text-[#99773d]" : "text-[#dcb672]";
  const h2c = lightMode ? "text-black" : "text-white";
  const lead = mutedText;
  const link = lightMode
    ? "text-[#885a10] decoration-[#d6b06a]/50 hover:text-black"
    : "text-[#e8cc8a] decoration-[#d6b06a]/45 hover:text-[#f2ddb0]";
  const platformBox = lightMode
    ? "border-[#d6b06a]/35 bg-[rgba(214,176,106,0.1)]"
    : "border-[#d6b06a]/25 bg-[rgba(214,176,106,0.07)]";
  const platformLabel = subtleText;
  const platformTitle = lightMode ? "text-black" : "text-white";
  const platformMuted = mutedText;
  const pillarCard = lightMode
    ? "border-black/10 bg-black/[0.02] hover:border-[#d6b06a]/40 hover:bg-black/[0.04]"
    : "border-white/[0.08] bg-[rgba(255,255,255,0.025)] hover:border-[#d6b06a]/32 hover:bg-[rgba(255,255,255,0.038)]";
  const pillarTitle = lightMode ? "text-black" : "text-white";
  const pillarBody = mutedText;
  const footRule = lightMode ? "border-black/10" : "border-white/[0.08]";
  const foot = subtleText;

  return (
    <section
      className="relative scroll-mt-24 md:scroll-mt-[6.75rem]"
      aria-labelledby="owners-operate-heading"
    >
      <div className={`overflow-hidden rounded-[28px] border p-5 backdrop-blur-lg md:p-8 lg:p-9 ${shell}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="max-w-xl shrink-0">
            <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
              {ownersOperateIntro.eyebrow}
            </span>
            <h2
              id="owners-operate-heading"
              className={`mt-3 text-[1.625rem] font-semibold leading-[1.14] tracking-[-0.015em] md:text-[2rem] ${h2c}`}
            >
              {ownersOperateIntro.title}
            </h2>
            <p className={`mt-4 text-[0.98rem] leading-relaxed md:text-[1.0625rem] ${lead}`}>
              {ownersOperateIntro.lead}
            </p>
            <a
              href={BUILDIUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-[3px] transition-colors ${link}`}
            >
              What is Buildium?
              <span aria-hidden>↗</span>
            </a>
          </div>

          <div className={`shrink-0 rounded-2xl border px-5 py-4 md:w-[280px] md:px-6 md:py-5 ${platformBox}`}>
            <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${platformLabel}`}>Platform</div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${platformTitle}`}>Buildium</div>
            <p className={`mt-2 text-xs leading-relaxed ${platformMuted}`}>
              Property management software for leasing, accounting, maintenance, and owner portals.
            </p>
          </div>
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4 md:mt-10 xl:grid-cols-4">
          {ownersOperatePillars.map((pillar, i) => {
            const Icon = pillarIcons[i] ?? ShieldCheck;
            return (
              <li
                key={pillar.title}
                className={`rounded-2xl border px-4 py-[1.125rem] transition-colors duration-200 md:px-[1.125rem] ${pillarCard}`}
              >
                <Icon className="h-5 w-5 text-[#d6b06a]" strokeWidth={1.75} aria-hidden />
                <h3 className={`mt-3 text-sm font-semibold leading-snug ${pillarTitle}`}>{pillar.title}</h3>
                <p className={`mt-2 text-[13px] leading-relaxed ${pillarBody}`}>{pillar.body}</p>
              </li>
            );
          })}
        </ul>

        <p className={`mt-8 border-t pt-6 text-[11px] leading-relaxed md:text-xs ${footRule} ${foot}`}>
          {ownersOperateIntro.footnote}
        </p>
      </div>
    </section>
  );
}
