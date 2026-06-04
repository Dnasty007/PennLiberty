import { Briefcase, Building2, Home, type LucideIcon } from "lucide-react";

/** Shared fields for sale listings and rental detail overlays. */
export type PropertyDetail = {
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  image: string;
  gallery: string[];
  propertyType?: string;
  status?: string;
  mlsNumber?: string;
  brokerage?: string;
  description?: string;
  highlights?: string[];
  sqft?: number;
};

export type Rental = PropertyDetail & {
  id: number;
  slug: string;
  /** Short line for cards, e.g. "2 bed · 1 bath · Available 05/01/26" */
  meta: string;
  /** Neighborhood / area label for card badge */
  area: string;
  /** Optional per-unit application link (e.g. Buildium listing URL). Overrides `VITE_BUILDIUM_RENTAL_APPLICATION_URL`. */
  applicationUrl?: string;
  dateAvailable?: string;
  securityDeposit?: string;
  applicationFee?: string;
};

function rentalAsset(slug: string, filename: string): string {
  return `/Rentals/${slug}/${filename}`;
}

function rentalGallery(slug: string, filenames: readonly string[]): string[] {
  return filenames.map((filename) => rentalAsset(slug, filename));
}

const diamond2fPhotos = [
  "cover.png",
  "img-2.png",
  "img-3.png",
  ...Array.from({ length: 22 }, (_, index) => `IMG_${index + 4}.jpg`),
] as const;

const diamond3fPhotos = [
  "cover.png",
  "img-2.png",
  "img-3.png",
  ...Array.from({ length: 6 }, (_, index) => `IMG_${index + 4}.jpg`),
  ...Array.from({ length: 20 }, (_, index) => `IMG_${index + 10}.jpg`),
  "IMG_430.jpg",
] as const;

const diamond2fGallery = rentalGallery("1704-w-diamond-st-2f", diamond2fPhotos);
const diamond3fGallery = rentalGallery("1704-w-diamond-st-3f", diamond3fPhotos);

/** Default pin positions — fallback if image not in `rentalPinOffsetsBySrc`. */
export const rentalMapPinOffsets = [
  { top: "83.6%", left: "56.7%" },
  { top: "20.9%", left: "64.2%" },
  { top: "19%", left: "50%" },
  { top: "44%", left: "61%" },
  { top: "36%", left: "73%" },
  { top: "27%", left: "58%" },
  { top: "38%", left: "48%" },
] as const;

/** Per-image pin positions for the Rentals hero. */
export const rentalPinOffsetsBySrc: Record<string, { top: string; left: string }[]> = {
  // Light mode
  "/rentals-hero/rentals-1.jpg": [
    { top: "35.7%", left: "89.0%" },
    { top: "14.6%", left: "62.2%" },
  ],
  "/rentals-hero/rentals-2.jpg": [
    { top: "86.1%", left: "59.2%" },
    { top: "20.9%", left: "64.2%" },
  ],
  "/rentals-hero/rentals-3.jpg": [
    { top: "87.4%", left: "48.2%" },
    { top: "16.3%", left: "68.4%" },
  ],
  // Dark mode
  "/rentals-hero/dark/rentals-1.jpg": [
    { top: "84.8%", left: "23.4%" },
    { top: "25.8%", left: "66.1%" },
  ],
  "/rentals-hero/dark/rentals-2.jpg": [
    { top: "74.2%", left: "43.9%" },
    { top: "12.7%", left: "71.3%" },
  ],
  "/rentals-hero/dark/rentals-3.jpg": [
    { top: "12.9%", left: "76.9%" },
    { top: "39.2%", left: "15.5%" },
  ],
};

export type SaleListing = PropertyDetail & {
  id: number;
  slug?: string;
  sqft: number;
  /** Map marker latitude (approx. geocode for Philly addresses). */
  lat: number;
  /** Map marker longitude. */
  lng: number;
  top: string;
  left: string;
  units?: number;
  lotSqft?: number;
};

/**
 * Live rental inventory — add units here as photos and MLS details are ready.
 */
export const initialRentals: Rental[] = [
  {
    id: 1,
    slug: "1704-w-diamond-st-2f",
    title: "1704 W Diamond St, Unit 2F",
    price: "$1,150/mo",
    address: "1704 W Diamond St #2, Philadelphia, PA 19121",
    beds: 2,
    baths: 1,
    meta: "2 bed · 1 bath · Available 05/01/26",
    area: "Temple University",
    image: diamond2fGallery[0],
    gallery: diamond2fGallery,
    propertyType: "Residential Lease",
    status: "Active",
    mlsNumber: "PAPH2609562",
    brokerage: "Penn Liberty Real Estate",
    dateAvailable: "05/01/26",
    securityDeposit: "$1,150",
    applicationFee: "$50",
    description:
      "Great opportunity to rent this beautiful 2nd floor apartment in the heart of Temple University's campus. The unit features 2 spacious bedrooms, an outdoor deck, a full kitchen, and 1 bathroom. Additional features include basement laundry and an unfinished basement for storage space. The property is a stone's throw away from Temple University's main campus and is convenient to all major campus buildings. Move-in ready. Proof of income required, no evictions.",
    highlights: [
      "2 spacious bedrooms · 1 full bath",
      "Outdoor deck",
      "Basement laundry · storage in unfinished basement",
      "Central A/C · forced air heat (tenant pays electric, gas, heat)",
      "12–24 month lease · $50 application fee",
      "No pets · no smoking",
      "Steps from Temple University main campus",
    ],
  },
  {
    id: 2,
    slug: "1704-w-diamond-st-3f",
    title: "1704 W Diamond St, Unit 3F",
    price: "Contact for rent",
    address: "1704 W Diamond St #3, Philadelphia, PA 19121",
    beds: 2,
    baths: 1,
    meta: "2 bed · 1 bath · Temple University area",
    area: "Temple University",
    image: diamond3fGallery[0],
    gallery: diamond3fGallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    description:
      "Third-floor apartment in the same classic Temple University area rowhome as our 2F listing. Contact Penn Liberty for current rent, move-in date, and application details.",
    highlights: [
      "Third-floor unit in 3-unit building (1915 masonry row)",
      "Temple University neighborhood",
      "Contact office for current rent and availability",
    ],
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
      "/listings/1704-w-diamond/download-1.png",
      "/listings/1704-w-diamond/download-2.png",
      "/listings/1704-w-diamond/download-3.png",
      "/listings/1704-w-diamond/download-4.png",
      "/listings/1704-w-diamond/download-5.png",
      "/listings/1704-w-diamond/download-6.png",
      "/listings/1704-w-diamond/download-7.png",
      "/listings/1704-w-diamond/download-8.png",
      "/listings/1704-w-diamond/download-9.png",
      "/listings/1704-w-diamond/download-10.png",
      "/listings/1704-w-diamond/download-11.png",
      "/listings/1704-w-diamond/download-12.png",
      "/listings/1704-w-diamond/download-13.png",
      "/listings/1704-w-diamond/download-14.png",
      "/listings/1704-w-diamond/download-15.png",
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
    image: "/listings/1711-n-gratz-st/getmedia.jpeg",
    gallery: [
      "/listings/1711-n-gratz-st/getmedia.jpeg",
      "/listings/1711-n-gratz-st/getmedia-0.jpeg",
      "/listings/1711-n-gratz-st/getmedia-1.jpeg",
      "/listings/1711-n-gratz-st/getmedia-2.jpeg",
      "/listings/1711-n-gratz-st/getmedia-3.jpeg",
      "/listings/1711-n-gratz-st/getmedia-4.jpeg",
      "/listings/1711-n-gratz-st/getmedia-5.jpeg",
      "/listings/1711-n-gratz-st/getmedia-6.jpeg",
      "/listings/1711-n-gratz-st/getmedia-7.jpeg",
      "/listings/1711-n-gratz-st/getmedia-8.jpeg",
      "/listings/1711-n-gratz-st/getmedia-9.jpeg",
      "/listings/1711-n-gratz-st/getmedia-10.jpeg",
      "/listings/1711-n-gratz-st/getmedia-11.jpeg",
      "/listings/1711-n-gratz-st/getmedia-12.jpeg",
      "/listings/1711-n-gratz-st/getmedia-13.jpeg",
      "/listings/1711-n-gratz-st/getmedia-14.jpeg",
      "/listings/1711-n-gratz-st/getmedia-15.jpeg",
      "/listings/1711-n-gratz-st/getmedia-16.jpeg",
      "/listings/1711-n-gratz-st/getmedia-17.jpeg",
      "/listings/1711-n-gratz-st/getmedia-18.jpeg",
      "/listings/1711-n-gratz-st/getmedia-19.jpeg",
      "/listings/1711-n-gratz-st/getmedia-20.jpeg",
      "/listings/1711-n-gratz-st/getmedia-21.jpeg",
      "/listings/1711-n-gratz-st/getmedia-22.jpeg",
      "/listings/1711-n-gratz-st/getmedia-23.jpeg",
      "/listings/1711-n-gratz-st/getmedia-24.jpeg",
      "/listings/1711-n-gratz-st/getmedia-25.jpeg",
      "/listings/1711-n-gratz-st/getmedia-26.jpeg"
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
    image: "/listings/621-w-girard-ave/getmedia.jpeg",
    gallery: [
      "/listings/621-w-girard-ave/getmedia.jpeg",
      "/listings/621-w-girard-ave/getmedia-1.jpeg",
      "/listings/621-w-girard-ave/getmedia-2.jpeg",
      "/listings/621-w-girard-ave/getmedia-3.jpeg",
      "/listings/621-w-girard-ave/getmedia-4.jpeg",
      "/listings/621-w-girard-ave/getmedia-5.jpeg",
      "/listings/621-w-girard-ave/getmedia-6.jpeg",
      "/listings/621-w-girard-ave/getmedia-7.jpeg",
      "/listings/621-w-girard-ave/getmedia-8.jpeg"
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
    image: "/listings/1215-w-lehigh-ave/getmedia-1.jpeg",
    gallery: [
      "/listings/1215-w-lehigh-ave/getmedia-1.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-2.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-3.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-4.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-5.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-6.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-7.jpeg",
      "/listings/1215-w-lehigh-ave/getmedia-8.jpeg"
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
  /** Optional italic line rendered below the bio */
  readonly tagline?: string;
  /** Relative URL under `/public`, e.g. `/team/donna.jpg`. When omitted, Liberty mark shows behind initials */
  readonly photo?: string;
};

/** Founders & principals — surfaced first on About */
export const teamPrincipals: readonly TeamPerson[] = [
  {
    name: "Ray Caceres",
    role: "Broker / Founder / U.S. Marine",
    bio: "Leads brokerage direction, deal strategy, and the firm's Foundation to the Company and his Clients.",
  },
  {
    name: "Ramon Caceres",
    role: "Co-Founder",
    bio: "Founding anchor of Penn Liberty, the father side of our family-founded firm, and a steady presence in our office.",
  },
  {
    name: "Ramon L. Caceres",
    role: "Operations & Systems Management",
    bio: "Property Maintenance, overseeing the portal side of the business dealing with Owners and Vendors.",
  },
] as const;

/** Office operators, managers, and licensed agents — company roster */
export const teamStaff: readonly TeamPerson[] = [
  {
    name: "Donna Wunderle",
    role: "Office Secretary",
    bio: "First voice many hear at Penn Liberty. She keeps schedules coordinated, filings and paperwork orderly.",
  },
  {
    name: "David Froelich",
    role: "Head Property Manager / Agent",
    bio: "Leads resident service and the Company Books while remaining active in brokerage.",
  },
  {
    name: "Brandon Lohr",
    role: "Agent",
    bio: "A licensee supporting buyers and sellers throughout Philadelphia.",
  },
  {
    name: "Juanita Sharperson",
    role: "Agent",
    bio: "Represents landlords and investors with clear communication, from showings through lease signatures and resale opportunities.",
  },
  {
    name: "Fatima Aguilar",
    role: "Agent",
    bio: "Licensed agent throughout the Philadelphia area.",
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
