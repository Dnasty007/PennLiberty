import { useSyncExternalStore, useState } from "react";
import { ownersTabs } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";

const FINE_POINTER_MQ = "(hover: hover) and (pointer: fine)";

function subscribeFinePointerMedia(onChange: () => void) {
  const mq = window.matchMedia(FINE_POINTER_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getFinePointerSnap(): boolean {
  return window.matchMedia(FINE_POINTER_MQ).matches;
}

/** Desktop / trackpad setups where hover is meaningful; excludes most phones. */
function usePrefersFinePointerHover(): boolean {
  return useSyncExternalStore(subscribeFinePointerMedia, getFinePointerSnap, () => false);
}

const WHY_DETAIL_PANEL_ID = "owners-why-management-detail-panel";

type OwnersWhyManagementProps = {
  lightMode: boolean;
  mutedText: string;
};

export function OwnersWhyManagement({ lightMode, mutedText }: OwnersWhyManagementProps) {
  const [active, setActive] = useState(ownersTabs[0].key);
  const hoverSwitchPanels = usePrefersFinePointerHover();
  const panel = ownersTabs.find((tab) => tab.key === active) ?? ownersTabs[0];

  const inactiveTab = lightMode
    ? "border-black/[0.10] bg-black/[0.03] text-black/72 hover:bg-black/[0.06] hover:text-black"
    : "border-white/[0.08] bg-[rgba(255,255,255,0.02)] text-white/72 hover:bg-[rgba(255,255,255,0.05)] hover:text-white";
  const activeTab = lightMode
    ? "border-[#c49a42]/65 bg-[#d6b06a]/[0.22] text-black shadow-[inset_0_0_0_1px_rgba(214,176,106,0.18)]"
    : "border-[#d6b06a]/50 bg-[#d6b06a]/[0.13] text-white shadow-[inset_0_0_0_1px_rgba(214,176,106,0.12)]";

  const badgeInactive = lightMode ? "bg-[#d6b06a]/30 text-[#6b4710]" : "bg-[#d6b06a]/22 text-[#d6b06a]";
  const badgeActive = lightMode ? "bg-[#b8892e] text-white" : "bg-[#d6b06a] text-[#08111f]";

  const panelShell = lightMode
    ? "border-black/[0.10] bg-white/[0.45] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.08)]"
    : "border-white/[0.09] bg-[rgba(255,255,255,0.025)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]";

  const eyebrow = lightMode ? "text-[#a67c32]" : "text-[#dcb672]/95";
  const heading = lightMode ? "text-black" : "text-white";
  const bodyInk = mutedText;

  return (
    <section className="relative">
      <SectionDivider lightMode={lightMode} label="Why good management matters" number="01" />
      <p className="sr-only">
        Desktop: resting the pointer over a pillar shows its story. Touch devices: tap a pillar.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px,minmax(0,1fr)] lg:gap-12">
        <nav
          role="tablist"
          aria-label="Why management pillars"
          className="pl-touch-scroll-x flex flex-row gap-2 overflow-x-auto pb-2 lg:sticky lg:top-[6.75rem] lg:flex-col lg:gap-2 lg:self-start lg:overflow-visible lg:pb-0"
          data-pl-horizontal-scroll
        >
          {ownersTabs.map((tab) => {
            const isActive = tab.key === active;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`owners-why-tab-${tab.key}`}
                aria-controls={WHY_DETAIL_PANEL_ID}
                onClick={() => setActive(tab.key)}
                onMouseEnter={hoverSwitchPanels ? () => setActive(tab.key) : undefined}
                onFocus={() => setActive(tab.key)}
                className={`flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm transition-all duration-200 lg:min-w-0 lg:px-4 ${
                  isActive ? activeTab : inactiveTab
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive ? badgeActive : badgeInactive
                  }`}
                >
                  {tab.number}
                </span>
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div
          role="tabpanel"
          id={WHY_DETAIL_PANEL_ID}
          aria-labelledby={`owners-why-detail-${panel.key}`}
          className={`min-w-0 rounded-[26px] border px-6 py-7 backdrop-blur-[12px] md:px-8 md:py-9 lg:rounded-[28px] ${panelShell}`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
            {panel.label}
          </span>
          <h3
            id={`owners-why-detail-${panel.key}`}
            className={`mt-4 text-2xl font-semibold leading-snug tracking-[-0.02em] md:text-[2rem] ${heading}`}
          >
            {panel.title}
          </h3>
          <p className={`mt-5 max-w-2xl text-[0.98rem] leading-relaxed md:text-[1.05rem] ${bodyInk}`}>{panel.body}</p>
        </div>
      </div>
    </section>
  );
}
