import { useEffect, useRef, useSyncExternalStore, useState } from "react";
import { ownersTabs } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";

const FINE_POINTER_MQ = "(hover: hover) and (pointer: fine)";
const MOBILE_TAB_CYCLE_MS = 6000;

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
  const [displayedKey, setDisplayedKey] = useState(ownersTabs[0].key);
  const [panelVisible, setPanelVisible] = useState(true);
  const hoverSwitchPanels = usePrefersFinePointerHover();
  const isMobileTabs = !hoverSwitchPanels;
  const userInteractingRef = useRef(false);
  const panel = ownersTabs.find((tab) => tab.key === displayedKey) ?? ownersTabs[0];

  useEffect(() => {
    if (!isMobileTabs || active === displayedKey) return;

    setPanelVisible(false);
    const swapTimer = window.setTimeout(() => {
      setDisplayedKey(active);
      setPanelVisible(true);
    }, 280);

    return () => window.clearTimeout(swapTimer);
  }, [active, displayedKey, isMobileTabs]);

  useEffect(() => {
    if (isMobileTabs) return;
    setDisplayedKey(active);
    setPanelVisible(true);
  }, [active, isMobileTabs]);

  useEffect(() => {
    if (!isMobileTabs) return;

    const timer = window.setInterval(() => {
      if (userInteractingRef.current) return;
      setActive((prev) => {
        const idx = ownersTabs.findIndex((tab) => tab.key === prev);
        return ownersTabs[(idx + 1) % ownersTabs.length].key;
      });
    }, MOBILE_TAB_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [isMobileTabs]);

  useEffect(() => {
    if (!isMobileTabs) return;
    const btn = document.getElementById(`owners-why-tab-${active}`);
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active, isMobileTabs]);

  const pauseAutoCycle = () => {
    userInteractingRef.current = true;
  };

  const resumeAutoCycle = () => {
    userInteractingRef.current = false;
  };

  const selectTab = (key: (typeof ownersTabs)[number]["key"]) => {
    setActive(key);
  };

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
    <section
      className="relative"
      onTouchStart={isMobileTabs ? pauseAutoCycle : undefined}
      onTouchEnd={isMobileTabs ? resumeAutoCycle : undefined}
      onTouchCancel={isMobileTabs ? resumeAutoCycle : undefined}
    >
      <SectionDivider lightMode={lightMode} label="Why good management matters" number="01" />
      <p className="sr-only">
        Desktop: resting the pointer over a pillar shows its story. Touch devices: tabs auto-advance; tap or swipe to browse.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px,minmax(0,1fr)] lg:gap-12">
        <nav
          role="tablist"
          aria-label="Why management pillars"
          className="pl-touch-scroll-x flex flex-row gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-[7.75rem] lg:flex-col lg:gap-2 lg:self-start lg:overflow-visible lg:pb-0"
          style={isMobileTabs ? { WebkitOverflowScrolling: "touch" } : undefined}
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
                onClick={() => selectTab(tab.key)}
                onMouseEnter={hoverSwitchPanels ? () => selectTab(tab.key) : undefined}
                onFocus={() => selectTab(tab.key)}
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
          className={`min-w-0 rounded-[26px] border px-6 py-7 backdrop-blur-[12px] transition-[opacity,transform] duration-[280ms] ease-out md:px-8 md:py-9 lg:rounded-[28px] ${
            isMobileTabs
              ? panelVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
              : ""
          } ${panelShell}`}
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
