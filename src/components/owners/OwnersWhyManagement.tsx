import { useState } from "react";
import { ownersTabs } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";

export function OwnersWhyManagement() {
  const [active, setActive] = useState(ownersTabs[0].key);
  const panel = ownersTabs.find((tab) => tab.key === active) ?? ownersTabs[0];

  return (
    <section className="relative">
      <SectionDivider label="Why good management matters" number="01" />
      <div className="mt-5 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div className="flex flex-col gap-2">
          {ownersTabs.map((tab) => {
            const isActive = tab.key === active;

            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                  isActive
                    ? "border-[#d6b06a]/55 bg-[#d6b06a]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive ? "bg-[#d6b06a] text-[#08111f]" : "bg-[#d6b06a]/20 text-[#d6b06a]"
                  }`}
                >
                  {tab.number}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div>
          <h3 className="text-3xl font-semibold leading-tight tracking-tight md:text-[34px]">
            {panel.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-white/75 md:text-[15px]">{panel.body}</p>
        </div>
      </div>
    </section>
  );
}
