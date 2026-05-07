import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { SectionDivider } from "@/components/owners/SectionDivider";

const interestOptions = [
  "I want help managing",
  "I'm thinking of selling",
  "I'm not sure yet",
] as const;

export function OwnersCTA() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [property, setProperty] = useState("");
  const [interest, setInterest] = useState<string>(interestOptions[0]);

  const submit = () => {
    const subject = encodeURIComponent("Property Review Request");
    const body = encodeURIComponent(
      [
        `Interest: ${interest}`,
        "",
        `Name: ${name}`,
        `Contact: ${contact}`,
        `Property: ${property}`,
      ].join("\n"),
    );
    window.location.href = `mailto:info@pennlibertyre.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="relative">
      <SectionDivider label="Let's start simple" number="05" />
      <div className="mt-5 grid gap-7 md:grid-cols-[1fr_0.85fr] md:items-center">
        <div>
          <h3 className="text-3xl font-semibold leading-tight tracking-tight md:text-[34px]">
            Tell us about your property.
            <br />
            We'll walk you through the best next step.
          </h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
            No pitch deck, no pressure. A short conversation about your property, your goals, and
            what management - or sales - could look like.
          </p>
          <p className="mt-3 text-sm text-white/55">
            Or just call <strong className="text-[#d6b06a]">215-987-4444</strong>. Real person,
            every time.
          </p>
        </div>
        <GlassCard className="p-5 md:p-6">
          <div className="grid gap-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="border-white/14 bg-white/[0.05] text-white placeholder:text-white/45"
            />
            <Input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Email or phone"
              className="border-white/14 bg-white/[0.05] text-white placeholder:text-white/45"
            />
            <Input
              value={property}
              onChange={(event) => setProperty(event.target.value)}
              placeholder="Property address (or neighborhood)"
              className="border-white/14 bg-white/[0.05] text-white placeholder:text-white/45"
            />
            <select
              value={interest}
              onChange={(event) => setInterest(event.target.value)}
              className="h-10 w-full rounded-md border border-white/14 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/70"
            >
              {interestOptions.map((option) => (
                <option key={option} value={option} className="bg-[#0a1322] text-white">
                  {option}
                </option>
              ))}
            </select>
            <Button
              onClick={submit}
              className="mt-1 rounded-full bg-[#d6b06a] py-3 text-base font-semibold text-[#08111f] hover:bg-[#e4be78]"
            >
              Start With a Property Review
            </Button>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
