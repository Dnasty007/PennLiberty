import { Briefcase, Building2, Home, type LucideIcon } from "lucide-react";

export type Rental = {
  id: number;
  title: string;
  price: string;
  meta: string;
  area: string;
  image: string;
};

export type SaleListing = {
  id: number;
  slug?: string;
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
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

export const initialRentals: Rental[] = [];

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

export const team = [
  {
    name: "Broker / Founder",
    role: "Sales Leadership",
    bio: "Experienced sales leadership focused on trust, deal execution, and client relationships across Philadelphia and surrounding markets.",
  },
  {
    name: "Ramon Caceres",
    role: "Rentals & Growth",
    bio: "Focused on rental growth, property management systems, marketing, and building the future-facing Penn Liberty experience.",
  },
  {
    name: "Penn Liberty Agents",
    role: "Sales, Rentals, Leasing",
    bio: "A growing team supporting buyers, sellers, landlords, tenants, and property owners with responsive local service.",
  },
] as const;

export const navItems = [
  { label: "Home", key: "home" },
  { label: "Rentals", key: "rentals" },
  { label: "Property Management", key: "property-management" },
  { label: "Listings", key: "listings" },
  { label: "Team", key: "team" },
  { label: "Contact", key: "contact" },
] as const;

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
