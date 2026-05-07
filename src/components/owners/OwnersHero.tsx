import type { ReactNode } from "react";

type OwnersHeroProps = {
  trailing?: ReactNode;
};

export function OwnersHero({ trailing }: OwnersHeroProps) {
  return (
    <section className="relative grid grid-cols-[3px_1fr] gap-5 px-1 py-1">
      <div className="rounded-full bg-[linear-gradient(180deg,#d6b06a,rgba(214,176,106,0))]" />
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
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
