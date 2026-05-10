import type { ReactNode } from "react";

type OwnersHeroProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
  trailing?: ReactNode;
};

const ownerProofPoints = [
  { term: "Since", detail: "2009", note: "Philly leases & exits" },
  { term: "Systems", detail: "Buildium", note: "Leasing · rent · work orders · reporting" },
  { term: "Where", detail: "Block-level", note: "Not flyover playbook management" },
] as const;

export function OwnersHero({ lightMode, mutedText, subtleText, trailing }: OwnersHeroProps) {
  const topRule = lightMode ? "border-black/10" : "border-white/[0.09]";
  const eyebrow = lightMode ? "text-[#a67c32]" : "text-[#dcb672]";
  const h1Strong = lightMode ? "text-black" : "text-white";
  const h1Sub = lightMode ? "text-black/[0.92]" : "text-white/[0.93]";
  const strongInk = lightMode ? "text-black/92" : "text-white/92";
  const asideShell = lightMode
    ? "border-black/12 bg-gradient-to-br from-white/80 to-white/55 shadow-[inset_0_0_0_1px_rgba(214,176,106,0.12)]"
    : "border-white/[0.11] bg-[linear-gradient(160deg,rgba(18,32,54,0.55),rgba(8,14,26,0.42))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]";
  const glance = lightMode ? "text-[#8b6914]" : "text-[#d6b06a]/90";
  const dlTerm = subtleText;
  const dlVal = lightMode ? "text-black" : "text-white";
  const dlNote = mutedText;

  return (
    <section className="relative">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(236px,300px)] lg:items-start lg:gap-x-14 xl:gap-x-16">
        <header className="min-w-0">
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b ${topRule} pb-5 md:gap-x-5`}>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
              Welcome, property owners
            </span>
            {trailing ? <div className="flex flex-wrap items-center gap-2">{trailing}</div> : null}
          </div>

          <h1 id="owners-hero-title" className={`mt-7 max-w-[22ch] text-[2.125rem] font-semibold leading-[1.06] tracking-[-0.02em] sm:max-w-none sm:text-4xl md:text-[46px] md:leading-[1.03] xl:text-[52px] ${h1Strong}`}>
            Owning property in Philadelphia is rewarding.
            <span className={`mt-3 block max-w-[20ch] text-[0.92em] font-medium md:max-w-[28ch] ${h1Sub}`}>
              Managing it well is what protects that reward.
            </span>
          </h1>

          <p className={`mt-6 max-w-2xl text-base leading-relaxed md:text-lg md:leading-snug ${mutedText}`}>
            Penn Liberty has been managing and selling Philadelphia properties since 2009. Day to day we run
            leasing, accounting, maintenance, and owner reporting through{" "}
            <strong className={`font-semibold ${strongInk}`}>Buildium property management software</strong>
            —so approvals, disbursements, and work orders aren&apos;t improvised in side threads. Whether
            you&apos;re a first-time landlord or running a portfolio, we&apos;ll walk you through what disciplined
            management protects — and why it matters more than most owners expect.
          </p>
        </header>

        <aside className="lg:sticky lg:top-[6.75rem] lg:self-start">
          <div className={`rounded-[22px] border p-6 backdrop-blur-xl ${asideShell}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${glance}`}>At a glance</p>
            <dl className="mt-6 space-y-6">
              {ownerProofPoints.map((row) => (
                <div key={row.detail} className="border-l-2 border-[#d6b06a]/45 pl-4">
                  <dt className={`text-[11px] font-medium uppercase tracking-[0.14em] ${dlTerm}`}>{row.term}</dt>
                  <dd className={`mt-1 text-lg font-semibold tracking-tight ${dlVal}`}>{row.detail}</dd>
                  <p className={`mt-2 text-[13px] leading-snug ${dlNote}`}>{row.note}</p>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}
