import { Briefcase, Building2, Home, type LucideIcon } from "lucide-react";

export type ListingAgent = {
  name: string;
  phone?: string;
  email?: string;
  license?: string;
};

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
  listingAgent?: ListingAgent;
  coListingAgent?: ListingAgent;
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
  /** Optional 15-second video tour URL (MP4). When present, shows "Watch 15s Video Tour" button on mobile detail sheet. */
  videoUrl?: string;
};

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
    { top: "31.3%", left: "89.9%" },
    { top: "72.9%", left: "61.9%" },
    { top: "29.7%", left: "13.6%" },
    { top: "8.4%", left: "36.1%" },
    { top: "90.1%", left: "95.7%" },
    { top: "90.0%", left: "11.4%" },
    { top: "8.2%", left: "72.5%" },
    { top: "26.7%", left: "56.1%" },
    { top: "90.6%", left: "50.8%" },
    { top: "29.7%", left: "13.6%" },
    { top: "34.9%", left: "33.5%" },
  ],
  "/rentals-hero/rentals-2.jpg": [
    { top: "40.5%", left: "49.0%" },
    { top: "24.6%", left: "70.9%" },
    { top: "15.1%", left: "39.9%" },
    { top: "85.8%", left: "67.5%" },
    { top: "89.9%", left: "16.1%" },
    { top: "24.4%", left: "93.0%" },
    { top: "35.7%", left: "10.5%" },
    { top: "69.9%", left: "32.7%" },
    { top: "29.0%", left: "26.8%" },
    { top: "45.0%", left: "80.1%" },
    { top: "11.3%", left: "54.1%" },
  ],
  "/rentals-hero/rentals-3.jpg": [
    { top: "86.0%", left: "56.3%" },
    { top: "16.3%", left: "68.4%" },
    { top: "10.9%", left: "49.5%" },
    { top: "89.0%", left: "82.5%" },
    { top: "87.4%", left: "17.7%" },
    { top: "14.6%", left: "90.4%" },
    { top: "39.4%", left: "14.1%" },
    { top: "40.8%", left: "69.7%" },
    { top: "58.1%", left: "34.4%" },
    { top: "60.0%", left: "58.2%" },
    { top: "16.1%", left: "27.3%" },
  ],
  // Dark mode
  "/rentals-hero/dark/rentals-1.jpg": [
    { top: "84.8%", left: "23.4%" },
    { top: "25.8%", left: "66.1%" },
    { top: "52.1%", left: "73.3%" },
    { top: "89.6%", left: "70.8%" },
    { top: "70.2%", left: "9.1%" },
    { top: "9.8%", left: "76.0%" },
    { top: "9.8%", left: "49.5%" },
    { top: "92.7%", left: "40.3%" },
    { top: "33.7%", left: "32.0%" },
    { top: "52.1%", left: "73.3%" },
    { top: "51.9%", left: "90.4%" },
  ],
  "/rentals-hero/dark/rentals-2.jpg": [
    { top: "23.8%", left: "10.3%" },
    { top: "12.7%", left: "71.3%" },
    { top: "49.2%", left: "75.9%" },
    { top: "43.9%", left: "32.3%" },
    { top: "91.9%", left: "84.2%" },
    { top: "78.6%", left: "49.2%" },
    { top: "90.2%", left: "11.2%" },
    { top: "70.1%", left: "7.0%" },
    { top: "30.6%", left: "76.9%" },
    { top: "49.2%", left: "75.9%" },
    { top: "22.6%", left: "38.6%" },
  ],
  "/rentals-hero/dark/rentals-3.jpg": [
    { top: "10.0%", left: "71.5%" },
    { top: "39.2%", left: "15.5%" },
    { top: "11.4%", left: "23.7%" },
    { top: "74.0%", left: "33.5%" },
    { top: "91.0%", left: "76.9%" },
    { top: "90.7%", left: "17.7%" },
    { top: "34.6%", left: "80.4%" },
    { top: "34.8%", left: "64.5%" },
    { top: "60.7%", left: "84.5%" },
    { top: "11.4%", left: "23.7%" },
    { top: "56.9%", left: "32.2%" },
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
    // These point at the current uploaded Triplex photos in /public/sale-media/1704-w-diamond/.
    image: "/sale-media/1704-w-diamond/download.png",
    gallery: [
      "/sale-media/1704-w-diamond/download.png",
      "/sale-media/1704-w-diamond/download-1.png",
      "/sale-media/1704-w-diamond/download-2.png",
      "/sale-media/1704-w-diamond/download-3.png",
      "/sale-media/1704-w-diamond/download-4.png",
      "/sale-media/1704-w-diamond/download-5.png",
      "/sale-media/1704-w-diamond/download-6.png",
      "/sale-media/1704-w-diamond/download-7.png",
      "/sale-media/1704-w-diamond/download-8.png",
      "/sale-media/1704-w-diamond/download-9.png",
      "/sale-media/1704-w-diamond/download-10.png",
      "/sale-media/1704-w-diamond/download-11.png",
      "/sale-media/1704-w-diamond/download-12.png",
      "/sale-media/1704-w-diamond/download-13.png",
      "/sale-media/1704-w-diamond/download-14.png",
      "/sale-media/1704-w-diamond/download-15.png",
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
    image: "/sale-media/1711-n-gratz-st/getmedia.jpeg",
    gallery: [
      "/sale-media/1711-n-gratz-st/getmedia.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-0.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-1.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-2.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-3.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-4.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-5.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-6.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-7.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-8.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-9.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-10.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-11.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-12.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-13.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-14.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-15.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-16.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-17.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-18.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-19.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-20.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-21.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-22.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-23.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-24.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-25.jpeg",
      "/sale-media/1711-n-gratz-st/getmedia-26.jpeg"
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
    image: "/sale-media/621-w-girard-ave/getmedia.jpeg",
    gallery: [
      "/sale-media/621-w-girard-ave/getmedia.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-1.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-2.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-3.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-4.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-5.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-6.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-7.jpeg",
      "/sale-media/621-w-girard-ave/getmedia-8.jpeg"
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
    image: "/sale-media/1215-w-lehigh-ave/getmedia-1.jpeg",
    gallery: [
      "/sale-media/1215-w-lehigh-ave/getmedia-1.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-2.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-3.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-4.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-5.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-6.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-7.jpeg",
      "/sale-media/1215-w-lehigh-ave/getmedia-8.jpeg"
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
  {
    id: 5,
    slug: "205-berbro-ave",
    title: "205 Berbro Ave — Upper Darby Duplex",
    propertyType: "Multi-Family",
    units: 2,
    price: "$395,000",
    address: "205 Berbro Ave, Upper Darby, PA 19082",
    beds: 0,
    baths: 0,
    sqft: 1590,
    lat: 39.9628,
    lng: -75.2705,
    top: "58%",
    left: "18%",
    image: "/sale-media/205-berbro-ave/cover.jpg",
    gallery: [
      "/sale-media/205-berbro-ave/cover.jpg",
      "/sale-media/205-berbro-ave/gallery-1.jpg",
      "/sale-media/205-berbro-ave/gallery-2.jpg",
      "/sale-media/205-berbro-ave/gallery-3.jpg",
      "/sale-media/205-berbro-ave/gallery-4.jpg",
      "/sale-media/205-berbro-ave/gallery-5.jpg",
      "/sale-media/205-berbro-ave/gallery-6.jpg",
      "/sale-media/205-berbro-ave/gallery-7.jpg",
    ],
    status: "Active Multi-Family",
    mlsNumber: "PADE2117528",
    brokerage: "Penn Liberty Real Estate",
    listingAgent: {
      name: "David Froelich",
      phone: "215-922-7900",
      email: "davepennliberty@gmail.com",
      license: "RS337196",
    },
    coListingAgent: {
      name: "Danilo Burgos",
      phone: "267-628-8748",
      email: "danilo@burg-properties.com",
      license: "RS370004",
    },
    description:
      "Twin/semi-detached duplex in Upper Darby's Beverly Hills neighborhood — two separately leased 2-bedroom, 1-bath units (~795 sq ft each) with projected rents of $675 and $750 per month. Stone and stucco construction (1927) with a full unfinished basement, wall-unit cooling, and baseboard hot-water heat fueled by natural gas. Driveway and on-street parking. Fee-simple ownership in Delaware County with convenient access to West Chester Pike and SEPTA.",
    highlights: [
      "2-unit duplex · 1,590 sq ft total",
      "Each unit: 2 bed · 1 bath · ~795 sq ft",
      "Twin/semi-detached · built 1927",
      "Projected rents: $675 / $750 per month",
      "Full unfinished basement · natural gas heat",
      "Upper Darby · Beverly Hills · near West Chester Pike",
      "Possession: 61–90 days from contract",
    ],
  },
  {
    id: 6,
    slug: "2526-2536-w-huntingdon-st",
    title: "2526–2536 W Huntingdon St — Land Development",
    propertyType: "Land",
    price: "$250,000",
    address: "2526–2536 W Huntingdon St N, Philadelphia, PA 19132",
    beds: 0,
    baths: 0,
    sqft: 10800,
    lotSqft: 10800,
    lat: 39.9915,
    lng: -75.1735,
    top: "38%",
    left: "52%",
    image: "/sale-media/2526-2536-w-huntingdon-st/cover.jpg",
    gallery: [
      "/sale-media/2526-2536-w-huntingdon-st/cover.jpg",
      "/sale-media/2526-2536-w-huntingdon-st/gallery-1.jpg",
      "/sale-media/2526-2536-w-huntingdon-st/gallery-2.jpg",
      "/sale-media/2526-2536-w-huntingdon-st/gallery-3.jpg",
      "/sale-media/2526-2536-w-huntingdon-st/gallery-4.jpg",
      "/sale-media/2526-2536-w-huntingdon-st/gallery-5.jpg",
      "/sale-media/2526-2536-w-huntingdon-st/gallery-6.jpg",
    ],
    status: "Active Land",
    mlsNumber: "PAPH2406154",
    brokerage: "Penn Liberty Real Estate",
    listingAgent: {
      name: "Juanita Sharperson",
      phone: "215-435-2825",
      email: "jsharperson68@gmail.com",
      license: "RS314983",
    },
    description:
      "Development opportunity in Strawberry Mansion — a 10-parcel assemblage totaling ~10,800 sq ft (0.25 acres) with two access points along West Huntingdon Street (2526–28, 2530–32, and 2534–36). RSA-5 zoning supports single-family residential by right; buyers may perform due diligence for other development paths. Surrounded by a mix of commercial and residential uses with strong transit access, Temple University main campus nearby, and Lehigh Avenue retail within blocks. Drive-by to evaluate this unique north Philadelphia land package.",
    highlights: [
      "10 parcels · ~10,800 sq ft lot (0.25 acres)",
      "RSA-5 zoning · single-family by right",
      "Two access points on W Huntingdon St",
      "Strawberry Mansion · Philadelphia 19132",
      "Near Temple main campus · Lehigh Ave corridor",
      "Cash or conventional financing · immediate possession",
      "Drive-by showings — contact listing agent",
    ],
  },
  {
    id: 7,
    slug: "2919-w-lehigh-ave",
    title: "2919 W Lehigh Ave — Vacant Land",
    propertyType: "Land",
    price: "$35,000",
    address: "2919 W Lehigh Ave, Philadelphia, PA 19132",
    beds: 0,
    baths: 0,
    sqft: 1125,
    lotSqft: 1125,
    lat: 39.9932,
    lng: -75.1648,
    top: "42%",
    left: "48%",
    image: "/sale-media/2919-w-lehigh-ave/cover.jpg",
    gallery: [
      "/sale-media/2919-w-lehigh-ave/cover.jpg",
      "/sale-media/2919-w-lehigh-ave/gallery-1.jpg",
      "/sale-media/2919-w-lehigh-ave/gallery-2.jpg",
    ],
    status: "Active Land",
    mlsNumber: "PAPH2498106",
    brokerage: "Penn Liberty Real Estate",
    listingAgent: {
      name: "Juanita Sharperson",
      phone: "215-435-2825",
      email: "jsharperson68@gmail.com",
      license: "RS314983",
    },
    description:
      "Vacant residential lot in Strawberry Mansion — 15 × 75 feet (~1,125 sq ft) with RSA-5 zoning and possible residential or apartment use per MLS. Public water and sewer; electric available. Strong development entry point on West Lehigh Avenue near 29th Street with public transit nearby. Immediate possession; cash or conventional financing.",
    highlights: [
      "1,125 sq ft lot · 15 × 75 ft dimensions",
      "RSA-5 zoning · vacant land",
      "Strawberry Mansion · Philadelphia 19132",
      "Public water & sewer · electric available",
      "Near Lehigh Ave & 29th St · transit access",
      "Immediate possession",
      "Drive-by showings — contact listing agent",
    ],
  },
  {
    id: 8,
    slug: "1751-n-27th-st",
    title: "1751 N 27th St — Brewerytown Rowhome",
    propertyType: "Residential",
    price: "$175,000",
    address: "1751 N 27th St N, Philadelphia, PA 19121",
    beds: 5,
    baths: 1,
    sqft: 1609,
    lat: 39.9824,
    lng: -75.1752,
    top: "36%",
    left: "54%",
    image: "/sale-media/1751-n-27th-st/cover.jpg",
    gallery: [
      "/sale-media/1751-n-27th-st/cover.jpg",
      "/sale-media/1751-n-27th-st/gallery-1.jpg",
      "/sale-media/1751-n-27th-st/gallery-2.jpg",
      "/sale-media/1751-n-27th-st/gallery-3.jpg",
      "/sale-media/1751-n-27th-st/gallery-4.jpg",
      "/sale-media/1751-n-27th-st/gallery-5.jpg",
      "/sale-media/1751-n-27th-st/gallery-6.jpg",
    ],
    status: "Under Contract",
    mlsNumber: "PAPH2617242",
    brokerage: "Penn Liberty Real Estate",
    listingAgent: {
      name: "Juanita Sharperson",
      phone: "215-435-2825",
      email: "jsharperson68@gmail.com",
      license: "RS314983",
    },
    description:
      "Interior row townhouse in Brewerytown — five bedrooms and one full bath across ~1,609 sq ft in a classic 1915 brick masonry building. Combination dining/living, eat-in kitchen with gas range, hardwood floors, and natural-gas forced-air heat. Below-average condition sold as-is, offering investors, developers, and owner-occupants room to customize. On-street parking; tenant-occupied — appointment-only showings with 24-hour notice.",
    highlights: [
      "5 bedrooms · 1 full bath · ~1,609 sq ft",
      "3-story interior row · built 1915",
      "Hardwood floors · eat-in kitchen · gas heat",
      "Brewerytown · RSA-5 · Philadelphia 19121",
      "Sold as-is · below-average condition",
      "Immediate possession · cash or conventional",
      "Appointment-only showings — 24 hr notice",
    ],
  },
  {
    id: 9,
    slug: "2811-castor-ave",
    title: "2811 Castor Ave — Port Richmond Rowhome",
    propertyType: "Residential",
    price: "$179,900",
    address: "2811 Castor Ave, Philadelphia, PA 19134",
    beds: 2,
    baths: 1,
    sqft: 728,
    lat: 39.9862,
    lng: -75.0754,
    top: "45%",
    left: "72%",
    image: "/sale-media/2811-castor-ave/cover.jpg",
    gallery: [
      "/sale-media/2811-castor-ave/cover.jpg",
      "/sale-media/2811-castor-ave/gallery-1.jpg",
      "/sale-media/2811-castor-ave/gallery-2.jpg",
      "/sale-media/2811-castor-ave/gallery-3.jpg",
      "/sale-media/2811-castor-ave/gallery-4.jpg",
      "/sale-media/2811-castor-ave/gallery-5.jpg",
      "/sale-media/2811-castor-ave/gallery-6.jpg",
      "/sale-media/2811-castor-ave/gallery-7.jpg",
      "/sale-media/2811-castor-ave/gallery-8.jpg",
      "/sale-media/2811-castor-ave/gallery-9.jpg",
      "/sale-media/2811-castor-ave/gallery-10.jpg",
      "/sale-media/2811-castor-ave/gallery-11.jpg",
      "/sale-media/2811-castor-ave/gallery-12.jpg",
      "/sale-media/2811-castor-ave/gallery-13.jpg",
      "/sale-media/2811-castor-ave/gallery-14.jpg",
    ],
    status: "Active Residential",
    mlsNumber: "PAPH2622494",
    brokerage: "Penn Liberty Real Estate",
    listingAgent: {
      name: "Richard Machado",
      phone: "215-275-9204",
      email: "richardpennliberty@gmail.com",
      license: "RS282437",
    },
    description:
      "End-of-row home in Port Richmond — two bedrooms, one full bath, and ~728 sq ft with hardwood floors, central air, and fenced front and rear yards. The main level offers open living and dining plus a versatile bonus room (office, gym, or lounge); upstairs are two bedrooms and a full bath. Built in 1955 with natural-gas heat, electric central A/C, and an unfinished basement. Near shopping, dining, I-95, and public transit; off-street parking available on Richmond St. Recently reduced to $179,900.",
    highlights: [
      "2 bedrooms · 1 full bath · ~728 sq ft",
      "End-of-row · built 1955 · Port Richmond",
      "Hardwood floors · central A/C · fireplace",
      "Fenced front & rear yards · bonus room",
      "Near I-95 · transit · Richmond St parking",
      "Immediate possession",
      "Recently reduced from $199,000",
    ],
  },
];

/**
 * Syndicated listing platforms — each href opens the real network so owners
 * can verify distribution / search their property.
 */
export const platforms = [
  {
    name: "Apartments.com",
    mark: "A",
    color: "text-[#52c23e]",
    href: "https://www.apartments.com/",
  },
  {
    name: "Apartment List",
    mark: "AL",
    color: "text-[#6e30ff]",
    href: "https://www.apartmentlist.com/",
  },
  {
    name: "Rent.com",
    mark: "R",
    color: "text-[#3a9cff]",
    href: "https://www.rent.com/",
  },
  {
    name: "Zillow Group",
    mark: "Z",
    color: "text-[#165dff]",
    href: "https://www.zillow.com/",
  },
  {
    name: "Zumper",
    mark: "ZU",
    color: "text-[#5cd4f5]",
    href: "https://www.zumper.com/",
  },
  {
    name: "Dwellsy",
    mark: "D",
    color: "text-[#ff7a2f]",
    href: "https://dwellsy.com/",
  },
  {
    name: "Rental Beast",
    mark: "RB",
    color: "text-[#ef3d46]",
    href: "https://www.rentalbeast.com/",
  },
  {
    name: "Bright MLS",
    mark: "B",
    color: "text-[#ff7d1a]",
    href: "https://www.brightmls.com/",
  },
] as const;

export type TeamPerson = {
  readonly name: string;
  readonly role: string;
  readonly bio: string;
  /** Optional italic line(s) rendered below the bio */
  readonly tagline?: string;
  readonly taglines?: readonly string[];
  /** Relative URL under `/public`, e.g. `/team/donna.jpg`. When omitted, Liberty mark shows behind initials */
  readonly photo?: string;
  /** Display format, e.g. `215-833-2827` — rendered as a `tel:` link when set */
  readonly phone?: string;
  readonly emails?: readonly string[];
};

/** Founders & principals — surfaced first on About */
export const teamPrincipals: readonly TeamPerson[] = [
  {
    name: "Ray Caceres",
    role: "Broker / Founder / U.S. Marine",
    bio: "Leads brokerage direction, deal strategy, and the firm's Foundation to the Company and his Clients.",
    taglines: ["License RM421140", "Penn Liberty License RB066799"],
    phone: "215-669-6166",
    emails: ["raypennliberty@gmail.com"],
  },
  {
    name: "Ramón Cáceres",
    role: "Co-Founder",
    bio: "Founding anchor of Penn Liberty, the father side of our family-founded firm, and a steady presence in our office.",
    tagline: "License RS152630A",
    phone: "215-397-7043",
    emails: ["ramoncaceres45@gmail.com"],
  },
  {
    name: "Ramon L. Caceres",
    role: "Co-Founder · Operations",
    bio: "Co-Founder of Penn Liberty. Leads day-to-day operations — property management, owner service, vendor coordination, and the systems that keep the firm running.",
    phone: "267-686-1510",
    emails: ["info@pennlibertyre.com"],
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
    tagline: "License RS337196",
  },
  {
    name: "Brandon Lohr",
    role: "Agent",
    bio: "A licensee supporting buyers and sellers throughout Philadelphia.",
    tagline: "License RS379544",
  },
  {
    name: "Juanita Sharperson",
    role: "Agent",
    bio: "Represents landlords and investors with clear communication, from showings through lease signatures and resale opportunities.",
    tagline: "License RS314983",
  },
  {
    name: "Fatima Aguilar",
    role: "Agent",
    bio: "Licensed agent throughout the Philadelphia area.",
    tagline: "License RS314983",
  },
  {
    name: "Richard Machado",
    role: "Agent",
    bio: "Licensed agent supporting buyers, sellers, and landlords throughout the Philadelphia area.",
    tagline: "License RS282437",
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

/** Buildium online rental application — opened when renters click Submit your application */
export const buildiumRentalApplicationUrl =
  "https://pennlibertyrentals.managebuilding.com/Resident/rental-application/new";

/** Resolve application URL: per-unit override → env → site default */
export function resolveRentalApplicationUrl(rental?: Pick<Rental, "applicationUrl"> | null): string {
  const perUnit = rental?.applicationUrl?.trim();
  if (perUnit && /^https?:\/\//i.test(perUnit)) {
    return perUnit;
  }

  const fromEnv = import.meta.env.VITE_BUILDIUM_RENTAL_APPLICATION_URL?.trim();
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv;
  }

  return buildiumRentalApplicationUrl;
}

export const serviceCards: {
  title: string;
  desc: string;
  page: PageKey;
  icon: LucideIcon;
  cta: string;
}[] = [
  {
    title: "Property Management",
    desc: "Full-service management for owners — leasing, rent, maintenance, reporting",
    page: "property-management",
    icon: Building2,
    cta: "Request a free review",
  },
  {
    title: "Find a Rental",
    desc: "Browse live Philly inventory, tour, and apply with ease",
    page: "rentals",
    icon: Home,
    cta: "Browse rentals",
  },
  {
    title: "Multi-Family & Investment Sales",
    desc: "Triplexes, land, and portfolio assets with local brokerage support",
    page: "listings",
    icon: Briefcase,
    cta: "View investment listings",
  },
];

export type PageKey = (typeof navItems)[number]["key"];
