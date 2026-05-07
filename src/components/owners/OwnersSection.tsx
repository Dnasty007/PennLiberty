import type { ReactNode } from "react";
import { OwnersHero } from "@/components/owners/OwnersHero";
import { OwnersWhyManagement } from "@/components/owners/OwnersWhyManagement";
import { OwnersPaths } from "@/components/owners/OwnersPaths";
import { OwnersNeighborhoods } from "@/components/owners/OwnersNeighborhoods";
import { OwnersVoices } from "@/components/owners/OwnersVoices";
import { OwnersCTA } from "@/components/owners/OwnersCTA";
import { ownersBackdropImage } from "@/lib/owners";

type OwnersSectionProps = {
  assistantTrigger?: ReactNode;
};

export function OwnersSection({ assistantTrigger }: OwnersSectionProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] px-7 py-9 md:px-9 md:py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url("${ownersBackdropImage}")`, transform: "scale(1.05)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(900px_540px_at_75%_0%,rgba(214,176,106,0.14)_0%,transparent_60%),radial-gradient(700px_500px_at_0%_100%,rgba(82,124,196,0.10)_0%,transparent_55%),linear-gradient(180deg,rgba(6,16,29,0.45)_0%,rgba(6,16,29,0.78)_100%)]"
      />
      <div className="relative space-y-10">
        <OwnersHero trailing={assistantTrigger} />
        <OwnersWhyManagement />
        <OwnersPaths />
        <OwnersNeighborhoods />
        <OwnersVoices />
        <OwnersCTA />
      </div>
    </section>
  );
}
