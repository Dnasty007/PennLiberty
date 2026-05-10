import { Briefcase, Building2, Home, type LucideIcon } from "lucide-react";

export type Rental = {
  id: number;
  title: string;
  price: string;
  meta: string;
  area: string;
  image: string;
  /** Optional per-unit application link (e.g. Buildium listing URL). Overrides `VITE_BUILDIUM_RENTAL_APPLICATION_URL`. */
  applicationUrl?: string;
};

/** Same bundled skyline as Rentals hero (`siteImagery.rentalsHeroPool`) — for future map wiring. */
export const rentalsVisualMapSrc = "/listings-philly-map-teaser.png";

/** Pin positions (% of hero) aligned to `initialRentals` length at build time — adjust if you reorder. */
export const rentalMapPinOffsets = [
  { top: "31%", left: "54%" },
  { top: "24%", left: "69%" },
  { top: "19%", left: "50%" },
  { top: "44%", left: "61%" },
  { top: "36%", left: "73%" },
  { top: "27%", left: "58%" },
] as const;

export type SaleListing = {
  id: number;
  slug?: string;
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  /** Map marker latitude (approx. geocode for Philly addresses). */
  lat: number;
  /** Map marker longitude. */
  lng: number;
  top: string;
  left: string;
  image: string;
  gallery: string[];
  propertyType?: string;
  units?: number;
  lotSqft?: number;
  status?: string;
  mlsNumber?: string;
  brokerage?: string;
  description?: string;
  highlights?: string[];
};

/**
 * Placeholder rental cards for the site — sample copy and Unsplash stills.
 * Replace the array (same `Rental` shape) when you wire live inventory or a feed.
 */
export const initialRentals: Rental[] = [
  {
    id: 1,
    title: "Renovated 2BR brick row apartment",
    price: "$1,895/mo",
    meta: "2 bed · 1 bath · Pets case-by-case",
    area: "Fishtown — Girard corridor & transit nearby",
    image:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 2,
    title: "Efficiency studio near Broad & Cecil B.",
    price: "$1,125/mo",
    meta: "Studio · Updated kitchenette · Laundry in building",
    area: "Temple / North Philly",
    image:
      "https://images.unsplash.com/photo-1545158539-1709fed7e2bf?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 3,
    title: "Garden-level 1BR with washer/dryer",
    price: "$1,675/mo",
    meta: "1 bed · 1 bath · Private rear patio",
    area: "South Philly — tenant-stable blocks",
    image:
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 4,
    title: "Center City alcove junior 1BR",
    price: "$2,250/mo",
    meta: "1 bed · 1 bath · Doorman elevator building",
    area: "Rittenhouse / Avenue of the Arts",
    image:
      "https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 5,
    title: "Loft-style 2BR with skyline views",
    price: "$2,495/mo",
    meta: "2 bed · 2 bath · Garage parking avail.",
    area: "Northern Liberties",
    image:
      "https://images.unsplash.com/photo-1568526381923-caf3fd520382?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 6,
    title: "Bi-level 3BR townhome-style rental",
    price: "$2,850/mo",
    meta: "3 bed · 2 bath · Rooftop deck",
    area: "Fairmount / Art Museum area",
    image:
      "https://images.unsplash.com/photo-1559406041-c7d2bbf2fd1c?auto=format&fit=crop&w=1200&q=85",
  },
];

export const initialSaleListings: SaleListing[] = [
  {
    id: 1,
    slug: "1704-w-diamond",
    title: "Philadelphia Triplex",
    propertyType: "Multi-Family",
    units: 3,
    price: "$425,000",
    address: "1704 W Diamond St, Philadelphia, PA 19121",
    beds: 0,
    baths: 0,
    sqft: 1760,
    lat: 39.9848,
    lng: -75.1571,
    top: "34%",
    left: "58%",
    // These point at the current uploaded Triplex photos in /public/listings/1704-w-diamond/.
    image: "/listings/1704-w-diamond/download.png",
    gallery: [
      "/listings/1704-w-diamond/download.png",
      "/listings/1704-w-diamond/download%20(1).png",
      "/listings/1704-w-diamond/download%20(2).png",
      "/listings/1704-w-diamond/download%20(3).png",
      "/listings/1704-w-diamond/download%20(4).png",
      "/listings/1704-w-diamond/download%20(5).png",
      "/listings/1704-w-diamond/download%20(6).png",
      "/listings/1704-w-diamond/download%20(7).png",
      "/listings/1704-w-diamond/download%20(8).png",
      "/listings/1704-w-diamond/download%20(9).png",
      "/listings/1704-w-diamond/download%20(10).png",
      "/listings/1704-w-diamond/download%20(11).png",
      "/listings/1704-w-diamond/download%20(12).png",
      "/listings/1704-w-diamond/download%20(13).png",
      "/listings/1704-w-diamond/download%20(14).png",
      "/listings/1704-w-diamond/download%20(15).png",
    ],
    status: "Active Multi-Family",
    mlsNumber: "PAPH2513930",
    brokerage: "Penn Liberty Real Estate",
    description:
      "Great investment on a wide street with plenty of parking and close to major transportation. This 3-story, 3-unit building is located in the City of Philadelphia just minutes from Center City, entertainment, schools, shopping, and dining. Each unit offers 2 large bedrooms, full kitchens, and baths, with central air throughout. The first floor has yard access, the second floor has a private rear deck, and the third-floor apartment has a more modern vibe with high ceilings.",
    highlights: [
      "3-story triplex",
      "3 units total",
      "Each unit has 2 bedrooms and 1 bath",
      "Central air throughout",
      "First-floor yard access",
      "Second-floor private rear deck",
      "Third-floor apartment with high ceilings",
    ],
  },
  {
    id: 2,
    slug: "1711-n-gratz-st",
    title: "1711 N Gratz St Triplex",
    propertyType: "Multi-Family",
    units: 3,
    price: "$355,000",
    address: "1711 N Gratz St, Philadelphia, PA 19121",
    beds: 0,
    baths: 0,
    sqft: 2184,
    lat: 39.9891,
    lng: -75.1567,
    top: "31%",
    left: "55%",
    image: "/listings/1711%20N%20Gratzs%20St/GetMedia.jpeg",
    gallery: [
      "/listings/1711%20N%20Gratzs%20St/GetMedia.jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(0).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(1).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(2).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(3).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(4).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(5).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(6).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(7).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(8).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(9).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(10).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(11).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(12).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(13).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(14).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(15).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(16).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(17).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(18).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(19).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(20).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(21).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(22).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(23).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(24).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(25).jpeg",
      "/listings/1711%20N%20Gratzs%20St/GetMedia%20(26).jpeg"
    ],
    status: "Active Multi-Family",
    mlsNumber: "PAPH2513624",
    brokerage: "Penn Liberty Real Estate",
    description:
      "Prime investment opportunity in the desirable Temple University area. This triplex generates strong income and offers three separately metered all-electric 2-bedroom, 1-bath units with full kitchens, in-unit washer and dryer, hardwood floors, and central air. The very walkable location near Temple University, strong transit access, and stable rental appeal make this a compelling multi-family hold in Philadelphia.",
    highlights: [
      "Triplex near Temple University",
      "3 total units",
      "Each unit has 2 bedrooms and 1 bath",
      "Separately metered all-electric units",
      "In-unit washer and dryer",
      "Hardwood floors and central air",
      "Strong walkability and transit access"
    ],
  },
  {
    id: 3,
    slug: "621-w-girard-ave",
    title: "621 W Girard Ave Land Opportunity",
    propertyType: "Land",
    price: "$260,000",
    address: "621 W Girard Ave, Philadelphia, PA 19123",
    beds: 0,
    baths: 0,
    sqft: 1432,
    lotSqft: 1432,
    lat: 39.9683,
    lng: -75.1494,
    top: "47%",
    left: "61%",
    image: "/listings/621%20W%20Girard%20Ave/GetMedia.jpeg",
    gallery: [
      "/listings/621%20W%20Girard%20Ave/GetMedia.jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(1).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(2).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(3).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(4).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(5).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(6).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(7).jpeg",
      "/listings/621%20W%20Girard%20Ave/GetMedia%20(8).jpeg"
    ],
    status: "Active Land",
    mlsNumber: "PAPH2551122",
    brokerage: "Penn Liberty Real Estate",
    description:
      "Discover an exceptional investment opportunity in the heart of Northern Liberties. This prime piece of land offers a unique canvas for investors looking to capitalize on one of Philadelphia's most sought-after neighborhoods. With strong city access, skyline and street views, and proximity to transit, this site is positioned for compelling future development.",
    highlights: [
      "1,432 sqft lot",
      "Northern Liberties location",
      "CMX2 zoning",
      "City and street views",
      "Bus stop directly out front",
      "Close to commuter rail and subway access",
      "Can be sold with 623 W Girard Ave"
    ],
  },
  {
    id: 4,
    slug: "1215-w-lehigh-ave",
    title: "1215 W Lehigh Ave Development Opportunity",
    propertyType: "Commercial Sale",
    units: 5,
    price: "$185,000",
    address: "1215 W Lehigh Ave, Philadelphia, PA 19133",
    beds: 0,
    baths: 0,
    sqft: 3400,
    lat: 39.9927,
    lng: -75.1544,
    top: "22%",
    left: "64%",
    image: "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(1).jpeg",
    gallery: [
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(1).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(2).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(3).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(4).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(5).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(6).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(7).jpeg",
      "/listings/1215%20W%20Lehigh%20Ave/GetMedia%20(8).jpeg"
    ],
    status: "Active Commercial Sale",
    mlsNumber: "PAPH2567122",
    brokerage: "Penn Liberty Real Estate",
    description:
      "Shovel-ready development opportunity with complete plans and permits in place. This street-to-street property offers updated 2024 plans for a five-unit apartment building configuration and sits just off Broad Street with quick access to transit and Center City. The site is positioned for investors and developers looking for a project with strong upside in Philadelphia.",
    highlights: [
      "Shovel-ready with plans and permits",
      "Configured for 5 units",
      "Approx. 3,400 sqft building potential",
      "Street-to-street property",
      "Business use: apartment building",
      "Close to Broad Street subway",
      "Major rehab / redevelopment opportunity"
    ],
  },
];

export const platforms = [
  { name: "Apartments.com", mark: "A", color: "text-[#52c23e]" },
  { name: "Apartment List", mark: "AL", color: "text-[#6e30ff]" },
  { name: "Rent.com", mark: "R", color: "text-[#3a9cff]" },
  { name: "Zillow Group", mark: "Z", color: "text-[#165dff]" },
  { name: "Zumper", mark: "ZU", color: "text-[#5cd4f5]" },
  { name: "Dwellsy", mark: "D", color: "text-[#ff7a2f]" },
  { name: "Rental Beast", mark: "RB", color: "text-[#ef3d46]" },
  { name: "Bright MLS", mark: "B", color: "text-[#ff7d1a]" },
] as const;

export type TeamPerson = {
  readonly name: string;
  readonly role: string;
  readonly bio: string;
  /** Relative URL under `/public`, e.g. `/team/donna.jpg`. When omitted, Liberty mark shows behind initials */
  readonly photo?: string;
};

/** Founders & principals — surfaced first on About */
export const teamPrincipals: readonly TeamPerson[] = [
  {
    name: "Ray",
    role: "Broker / Founder",
    bio: "Leads brokerage direction, deal strategy, and the firm's promise to Philadelphia clients—with the same hustle he expects from everyone on the roster.",
  },
  {
    name: "Ramon Caceres",
    role: "Co-Founder",
    bio: "Founding anchor of Penn Liberty—the father side of our family-founded firm—and a steady presence behind how we steward owners, renters, and investors.",
  },
  {
    name: "Ramon L. Caceres",
    role: "Operations & Systems",
    bio: "\"Ray Luke\" day-to-day—owns Penn Liberty platforms, workflows, and internal tools so leasing, listings, and property management stay fast, visible, and consistent.",
  },
] as const;

/** Office operators, managers, and licensed agents — company roster */
export const teamStaff: readonly TeamPerson[] = [
  {
    name: "Donna",
    role: "Office Secretary",
    bio: "First voice many hear at Penn Liberty—she keeps schedules coordinated, filings and paperwork orderly, and the front office warm and professional.",
  },
  {
    name: "Dave",
    role: "Head Property Manager · Agent",
    bio: "Leads resident service and portfolio operations while remaining active in brokerage—your bridge between the field and closing table.",
  },
  {
    name: "Brandon",
    role: "Agent",
    bio: "In-office licensee supporting buyers and sellers alongside the leadership team—with local Philly context and disciplined follow-through.",
  },
  {
    name: "Juanita Sharperson",
    role: "Agent",
    bio: "Represents landlords, tenants, and investors with clear communication—from showings through lease signatures and resale opportunities.",
  },
  {
    name: "Charlee Bolen",
    role: "Agent",
    bio: "Helps buyers and renters navigate Philly inventory with straight answers and attentive showings—from first tour to handshake.",
  },
  {
    name: "Fatima",
    role: "Agent",
    bio: "Licensed agent rounding out our sales and leasing bench—focused on approachable service and attentive client communication.",
  },
] as const;

/** @deprecated Use teamPrincipals + teamStaff for explicit sections */
export const team = [...teamPrincipals, ...teamStaff] as const;

export const navItems = [
  { label: "Home", key: "home" },
  { label: "For Owners", key: "property-management" },
  { label: "Rentals", key: "rentals" },
  { label: "Listings", key: "listings" },
  { label: "About", key: "team" },
  { label: "Contact", key: "contact" },
] as const;

/** Buildium Resident portal — tenants, owners, and vendors with Penn Liberty sign in here */
export const manageBuildingResidentLoginUrl =
  "https://signin.managebuilding.com/Resident/portal/global-login";

export const serviceCards: { title: string; desc: string; page: PageKey; icon: LucideIcon }[] = [
  {
    title: "Find a Rental",
    desc: "Browse listings and apply with ease",
    page: "rentals",
    icon: Home,
  },
  {
    title: "Property Management",
    desc: "Full-service management for owners",
    page: "property-management",
    icon: Building2,
  },
  {
    title: "Buy & Sell",
    desc: "Work with experienced agents",
    page: "listings",
    icon: Briefcase,
  },
];

export type PageKey = (typeof navItems)[number]["key"];
