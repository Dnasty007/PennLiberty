import { ownersVoice } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";

export function OwnersVoices() {
  return (
    <section className="relative">
      <SectionDivider label="Owner voices" number="04" />
      <div className="mt-6 grid gap-7 md:grid-cols-[1.3fr_0.7fr] md:items-center">
        <div>
          <blockquote className="relative pl-6 text-3xl font-medium leading-tight tracking-tight md:text-[34px]">
            <span
              aria-hidden
              className="absolute -top-6 -left-1 font-serif text-[110px] leading-none text-[#d6b06a]/40"
            >
              &ldquo;
            </span>
            {ownersVoice.quote}
          </blockquote>
          <div className="mt-5 pl-6 text-sm text-white/60">{ownersVoice.attribution}</div>
        </div>
        <div className="rotate-[-3deg] rounded-md border border-white/16 bg-white/[0.06] p-3 pb-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-md transition-[transform,box-shadow] duration-300 hover:translate-y-[-6px] hover:rotate-0 hover:scale-[1.02] hover:shadow-[0_36px_80px_rgba(0,0,0,0.5)]">
          <img
            src={ownersVoice.polaroidImage}
            alt="A Philadelphia row home block"
            className="block h-[220px] w-full rounded-sm object-cover"
          />
          <div className="mt-3 text-center font-serif text-sm italic text-white/85">
            &ldquo;{ownersVoice.polaroidCaption}&rdquo;
          </div>
        </div>
      </div>
    </section>
  );
}
