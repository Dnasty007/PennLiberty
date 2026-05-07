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
  tall?: boolean;
};

export const ownersNeighborhoods: OwnersNeighborhood[] = [
  {
    key: "northern-liberties",
    name: "Northern Liberties",
    quote: "Investor-strong. Doesn't blink.",
    image:
      "https://images.unsplash.com/photo-1568526381923-caf3fd520382?auto=format&fit=crop&w=1400&q=80",
    tall: true,
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

export type OwnersVoice = {
  quote: string;
  attribution: string;
  polaroidImage: string;
  polaroidCaption: string;
};

export const ownersVoice: OwnersVoice = {
  quote:
    "They handle our triplex like it's theirs. We hear from them when it matters - and not a minute more.",
  attribution: "Maria - South Philly owner - with us since 2018",
  polaroidImage:
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=900&q=80",
  polaroidCaption: "That's our city.",
};

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
