import { GlassCard } from "@/components/GlassCard";
import { team } from "@/lib/data";

type TeamSectionProps = {
  lightMode: boolean;
  mutedText: string;
};

export function TeamSection({ lightMode, mutedText }: TeamSectionProps) {
  return (
    <section>
      <h2 className="mb-6 text-3xl font-semibold">Our Team</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {team.map((person) => (
          <GlassCard lightMode={lightMode} key={person.name} className="p-6">
            <h3 className="text-xl font-semibold">{person.name}</h3>
            <p className="text-[#d6b06a]">{person.role}</p>
            <p className={`mt-2 ${mutedText}`}>{person.bio}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
