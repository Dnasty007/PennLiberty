export const ownersOperateIntro = {
  eyebrow: "Systems & accountability",
  title:
    "Your portfolio isn’t coordinated in spreadsheets and group texts—we run it on Buildium.",
  lead: "Buildium is the property management platform we use for applications, leases, rent, maintenance workflows, vendor coordination, and owner reporting. Owners get clearer answers because the paperwork and money trail aren’t improvised.",
  footnote:
    "Buildium® is a trademark of Buildium LLC. Penn Liberty names it so you understand how your property is administered day to day—we are independent and not endorsed by Buildium.",
} as const;

export type OwnersOperatePillar = {
  title: string;
  body: string;
};

export const ownersOperatePillars: OwnersOperatePillar[] = [
  {
    title: "Money you can reconcile",
    body: "Rent collection and owner disbursements are tracked in-platform—fewer mysteries when you ask where a payment landed.",
  },
  {
    title: "Leasing with a paper trail",
    body: "Applications move through lawful screening steps; leases and resident documents stay attached to the tenancy instead of drifting between inboxes.",
  },
  {
    title: "Maintenance that doesn’t evaporate",
    body: "Work orders are routed, prioritized, and closed with history—critical when boilers fail on a holiday weekend.",
  },
  {
    title: "Reporting you can rely on",
    body: "Owner statements summarize what happened financially and operationally—you’re informed when metrics move, not when someone remembers to forward a screenshot.",
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
    eyebrow: "List your property with us",
    title: "Full-Service Management",
    body: "98% occupancy. Three generations of Philly expertise. We handle leasing, screening, rent, maintenance, and owner reporting — so your investment works without you running it.",
    cta: "List Your Property With Us",
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

/** Illustrative pin positions over the Owners coverage editorial panel (%). */
export const ownersCoveragePinOffsets = [
  { top: "30%", left: "54%" },
  { top: "24%", left: "68%" },
  { top: "42%", left: "61%" },
  { top: "36%", left: "48%" },
  { top: "19%", left: "58%" },
] as const;

export const ownersBackdropImage =
  "https://images.unsplash.com/photo-1559406041-c7d2bbf2fd1c?auto=format&fit=crop&w=2000&q=80";

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
