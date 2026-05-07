import { ownersNeighborhoods, type OwnersNeighborhood } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";
import { use3DTilt } from "@/lib/use3DTilt";

function NeighborhoodTile({ tile }: { tile: OwnersNeighborhood }) {
  const tilt = use3DTilt({ maxRotateDeg: 4, liftPx: 3 });

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`group relative cursor-pointer overflow-hidden rounded-[22px] border border-white/10 bg-cover bg-center transition-[box-shadow] duration-300 [transform-style:preserve-3d] [will-change:transform] hover:shadow-[0_30px_60px_rgba(6,16,29,0.45)] ${
        tile.tall ? "row-span-2" : ""
      }`}
      style={{ backgroundImage: `url("${tile.image}")` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,29,0.10)_0%,rgba(6,16,29,0.85)_100%)] transition-[background] duration-200 group-hover:bg-[linear-gradient(180deg,rgba(6,16,29,0.05)_0%,rgba(6,16,29,0.72)_100%)]"
      />
      <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-end p-4 [transform:translateZ(30px)]">
        <div className="text-base font-semibold">{tile.name}</div>
        <div className="mt-1 text-sm leading-snug text-white/85">{tile.quote}</div>
      </div>
    </div>
  );
}

export function OwnersNeighborhoods() {
  return (
    <section className="relative">
      <SectionDivider label="We know these blocks" number="03" />
      <p className="mt-2 text-sm text-white/55">Each tile lifts as you hover.</p>
      <div
        className="mt-5 grid gap-4"
        style={{
          gridTemplateColumns: "1.2fr 0.8fr 0.8fr",
          gridTemplateRows: "200px 200px",
          perspective: "1200px",
        }}
      >
        {ownersNeighborhoods.map((tile) => (
          <NeighborhoodTile key={tile.key} tile={tile} />
        ))}
      </div>
    </section>
  );
}
