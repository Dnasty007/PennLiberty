import { ownersPaths, type OwnersPath } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";
import { use3DTilt } from "@/lib/use3DTilt";

function PathCard({ path, featured }: { path: OwnersPath; featured: boolean }) {
  const tilt = use3DTilt({ maxRotateDeg: 8, trackLightSpot: true });

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border p-6 transition-[border-color,background] duration-200 [transform-style:preserve-3d] [will-change:transform] ${
        featured
          ? "min-h-[240px] border-[#d6b06a]/55 bg-[linear-gradient(150deg,rgba(214,176,106,0.18),rgba(255,255,255,0.04))]"
          : "border-white/10 bg-white/[0.04]"
      } before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgba(214,176,106,0.18),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-200 data-[tilt-active=true]:before:opacity-100 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(140deg,rgba(255,255,255,0.16),rgba(255,255,255,0)_55%)] after:opacity-60 hover:border-[#d6b06a]/40`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-4 [transform:translateZ(30px)]">
        <div>
          <span
            className={`text-[11px] uppercase tracking-[0.22em] ${
              featured ? "text-[#d6b06a]" : "text-white/55"
            }`}
          >
            {path.eyebrow}
          </span>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">{path.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{path.body}</p>
        </div>
        <div className="text-sm font-semibold text-[#d6b06a]">{path.cta} →</div>
      </div>
    </div>
  );
}

export function OwnersPaths() {
  const featured = ownersPaths.find((p) => p.featured) ?? ownersPaths[0];
  const others = ownersPaths.filter((p) => !p.featured);

  return (
    <section className="relative">
      <SectionDivider label="However we can help" number="02" />
      <p className="mt-2 text-sm text-white/55">Hover the cards - they respond.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <PathCard path={featured} featured />
        <div className="grid gap-5">
          {others.map((path) => (
            <PathCard key={path.key} path={path} featured={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
