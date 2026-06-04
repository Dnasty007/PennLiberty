export const ownersOperateIntro = {
  eyebrow: "Systems & accountability",
  title:
    "Your portfolio isn’t coordinated in spreadsheets and group texts. We run it on Buildium.",
  lead: "Buildium is the property management platform we use for applications, leases, rent, maintenance workflows, vendor coordination, and owner reporting. Owners get clearer answers because the paperwork and money trail aren’t improvised.",
  footnote:
    "Buildium® is a trademark of Buildium LLC. Penn Liberty names it so you understand how your property is administered day to day. We are independent and not endorsed by Buildium.",
} as const;

export type OwnersOperatePillar = {
  title: string;
  body: string;
};

export const ownersOperatePillars: OwnersOperatePillar[] = [
  {
    title: "Money you can reconcile",
    body: "Rent collection and owner disbursements are tracked in-platform. Fewer mysteries when you ask where a payment landed.",
  },
  {
    title: "Leasing with a paper trail",
    body: "Applications move through lawful screening steps; leases and resident documents stay attached to the tenancy instead of drifting between inboxes.",
  },
  {
    title: "Maintenance that doesn’t evaporate",
    body: "Work orders are routed, prioritized, and closed with history. Critical when boilers fail on a holiday weekend.",
  },
  {
    title: "Reporting you can rely on",
    body: "Owner statements summarize what happened financially and operationally. You’re informed when metrics move, not when someone remembers to forward a screenshot.",
  },
];

export type OwnersTab = {
  key: "time" | "money" | "risk" | "property" | "peace";
  label: string;
  number: string;
  title: string;
  body: string;
};

export const ownersTabs: OwnersTab[] = [
  {
    key: "time",
    label: "Your Time",
    number: "01",
    title: "Stop running a second job.",
    body: "A managed property gives you back evenings, weekends, and headspace. We handle the calls so you don't have to choose between your investment and your life.",
  },
  {
    key: "money",
    label: "Your Money",
    number: "02",
    title: "Vacancy is the silent killer.",
    body: "Marketing across 8+ platforms, fast tenant placement, and steady rent collection protect cash flow that DIY landlords lose without realizing it.",
  },
  {
    key: "risk",
    label: "Your Risk",
    number: "03",
    title: "Lease and screening mistakes are expensive.",
    body: "Proper applications, lawful screening, clean leases, and documented move-ins keep small problems from turning into court dates.",
  },
  {
    key: "property",
    label: "Your Property",
    number: "04",
    title: "A property is only as good as its upkeep.",
    body: "Local vendors, proactive maintenance, and real eyes on the property protect the asset itself - not just the income it generates.",
  },
  {
    key: "peace",
    label: "Your Peace of Mind",
    number: "05",
    title: "You should hear from us when it matters.",
    body: "Predictable communication. Clean reporting. A real person on the phone. The point of management is that you don't have to think about it daily.",
  },
];

export type OwnersPath = {
  key: "manage" | "sell" | "unsure";
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  featured: boolean;
};

export const ownersPaths: OwnersPath[] = [
  {
    key: "manage",
    eyebrow: "I want help managing",
    title: "Full-Service Management",
    body: "Leasing, tenants, rent, maintenance, vendor coordination, owner reporting. We run the day-to-day so you don't have to.",
    cta: "Explore management",
    featured: true,
  },
  {
    key: "sell",
    eyebrow: "I'm thinking of selling",
    title: "Real Estate Sales",
    body: "Local agents who know what your property is actually worth.",
    cta: "Explore selling",
    featured: false,
  },
  {
    key: "unsure",
    eyebrow: "I'm not sure yet",
    title: "Talk it through",
    body: "Tell us about the property. We'll figure it out together.",
    cta: "Start a conversation",
    featured: false,
  },
];

export type OwnersNeighborhood = {
  key: string;
  name: string;
  quote: string;
  image: string;
};

export const ownersNeighborhoods: OwnersNeighborhood[] = [
  {
    key: "northern-liberties",
    name: "Northern Liberties",
    quote: "Investor-strong. Doesn't blink.",
    image:
      "https://images.unsplash.com/photo-1568526381923-caf3fd520382?auto=format&fit=crop&w=1400&q=80",
  },
  {
    key: "temple",
    name: "Temple / North Philly",
    quote: "Triplex country.",
    image:
      "https://images.unsplash.com/photo-1545158539-1709fed7e2bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "fishtown",
    name: "Fishtown",
    quote: "Listings move fast.",
    image:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "south-philly",
    name: "South Philly",
    quote: "Long-term tenants.",
    image:
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "center-city",
    name: "Center City",
    quote: "Premium care, premium leases.",
    image:
      "https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=1200&q=80",
  },
];

export type PinOffset = { top: string; left: string };

/**
 * Per-image pin positions for the metro coverage panel.
 * Each key is a public path matching `ownersPageBackdropPool`.
 * Falls back to the default array for any image not listed here.
 */
export const ownersPinOffsetsBySrc: Record<string, PinOffset[]> = {
  // Light mode
  "/owners/owners-1.jpg": [
    { top: "16.7%", left: "32.5%" },
    { top: "9.6%", left: "51.8%" },
    { top: "23.4%", left: "22.5%" },
    { top: "30.6%", left: "10.1%" },
    { top: "2.2%", left: "73.5%" },
  ],
  "/owners/owners-2.jpg": [
    { top: "12.9%", left: "18.2%" },
    { top: "26.5%", left: "59.2%" },
    { top: "40.0%", left: "27.1%" },
    { top: "44.0%", left: "56.6%" },
    { top: "3.0%", left: "54.4%" },
  ],
  "/owners/owners-3.jpg": [
    { top: "79.8%", left: "66.6%" },
    { top: "15.2%", left: "85.0%" },
    { top: "18.6%", left: "21.8%" },
    { top: "35.2%", left: "5.2%" },
    { top: "1.6%", left: "52.3%" },
  ],
  // Dark mode (adjust positions once images are placed)
  "/owners/dark/owners-1.jpg": [
    { top: "42.6%", left: "65.1%" },
    { top: "16.5%", left: "60.0%" },
    { top: "88.5%", left: "6.1%" },
    { top: "89.2%", left: "73.9%" },
    { top: "4.7%", left: "2.9%" },
  ],
  "/owners/dark/owners-2.jpg": [
    { top: "22.4%", left: "61.7%" },
    { top: "70.3%", left: "37.9%" },
    { top: "14.4%", left: "16.4%" },
    { top: "78.3%", left: "5.4%" },
    { top: "4.5%", left: "54.4%" },
  ],
  "/owners/dark/owners-3.jpg": [
    { top: "39.4%", left: "15.3%" },
    { top: "55.5%", left: "64.1%" },
    { top: "41.9%", left: "62.6%" },
    { top: "57.4%", left: "13.1%" },
    { top: "13.9%", left: "41.4%" },
  ],
};

/** Default fallback pin positions (used if image not in ownersPinOffsetsBySrc). */
export const ownersCoveragePinOffsets: readonly PinOffset[] = [
  { top: "38%", left: "36%" },
  { top: "22%", left: "74%" },
  { top: "50%", left: "68%" },
  { top: "58%", left: "28%" },
  { top: "12%", left: "52%" },
] as const;

/** Full-page Owners shell backdrop (`public/owners/owners-1.jpg`). */
export const ownersBackdropImage = "/owners/owners-1.jpg";

export const assistantSuggestions = [
  "How does property management work?",
  "Do you sell properties too?",
  "What if I'm out of state?",
  "How do I list my rental?",
  "What neighborhoods do you cover?",
  "Can I start with leasing only?",
];

export const assistantInitialReply =
  "Hi - I'm Penn Liberty's assistant. Ask me anything about managing or selling property in Philadelphia, or pick one of the suggestions to get started.";

export const assistantNetworkErrorReply =
  "I lost connection for a second. Want to try again, or use the property review form on this page so the team can follow up directly?";
