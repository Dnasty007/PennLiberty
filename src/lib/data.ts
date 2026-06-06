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
  /** Optional 15-second video tour URL (MP4). When present, shows "Watch 15s Video Tour" button on mobile detail sheet. */
  videoUrl?: string;
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

/** Placeholder until photos land in folder — swap to rentalGallery(..., ["cover.jpg", ...]). */
const cecilMoore2Gallery = ["/branding/liberty-head-grey.png"];
const n15th3fRearGallery = ["/branding/liberty-head-grey.png"];
const gratz2fGallery = ["/branding/liberty-head-grey.png"];
const kensington3Gallery = ["/branding/liberty-head-grey.png"];
const kensington1cPhotos = [
  "cover-1.png",
  "cover-2.png",
  "IMG_5797.jpg",
  "IMG_7380.jpg",
  "IMG_7381.jpg",
  "IMG_7382.jpg",
] as const;
const kensington1cGallery = rentalGallery("2633-kensington-ave-1c", kensington1cPhotos);
const glenloch3fPhotos = [
  "cover-1.jpg",
  "20240911_134958.jpg",
  "20240911_135008.jpg",
  "20240911_135011.jpg",
  "20240911_135016.jpg",
  "20240911_135050.jpg",
] as const;
const glenloch3fGallery = rentalGallery("5316-glenloch-st-3f", glenloch3fPhotos);
const n811_15thStPhotos = [
  "IMG_0062.JPEG",
  "IMG_0063.JPEG",
  "IMG_0064.JPEG",
  "IMG_0065.JPEG",
  "IMG_0067.JPEG",
  "IMG_0069.JPEG",
  "IMG_0070.JPEG",
  "IMG_0071.JPEG",
  "IMG_0072.JPEG",
  "IMG_0073.JPEG",
  "IMG_0074.JPEG",
  "IMG_0075.JPEG",
  "IMG_0076.JPEG",
  "IMG_0077.JPEG",
  "IMG_0078.JPEG",
  "IMG_0079.JPEG",
  "IMG_0080.JPEG",
  "IMG_0083.JPEG",
  "IMG_0084.JPEG",
  "IMG_9605.jpg",
  "IMG_9612.JPEG",
  "IMG_9613.JPEG",
  "IMG_9614.JPEG",
  "IMG_9615.JPEG",
] as const;
const n811_15thStGallery = rentalGallery("811-n-15th-st", n811_15thStPhotos);

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
    price: "$1,200/mo",
    address: "1704 W Diamond St #3, Philadelphia, PA 19121",
    beds: 2,
    baths: 1,
    meta: "2 bed · 1 bath · $1,200/mo · Temple University area",
    area: "Temple University",
    image: diamond3fGallery[0],
    gallery: diamond3fGallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    applicationFee: "$50",
    description:
      "Third-floor two-bedroom, one-bath apartment in the same classic Temple University area rowhome as our 2F listing — $1,200 per month. Contact Penn Liberty for move-in date and application details.",
    highlights: [
      "2 bedrooms · 1 bath · 3rd floor",
      "Third-floor unit in 3-unit building (1915 masonry row)",
      "Temple University neighborhood",
      "$1,200/mo · $50 application fee",
    ],
  },
  {
    id: 3,
    slug: "2542-cecil-b-moore-ave-2",
    title: "2542 Cecil B. Moore Ave",
    price: "$1,950/mo",
    address: "2542 Cecil B. Moore Ave, Philadelphia, PA 19121",
    beds: 4,
    baths: 3,
    sqft: 1472,
    meta: "4 bed · 3 bath · Available 04/20/26",
    area: "Brewerytown",
    image: cecilMoore2Gallery[0],
    gallery: cecilMoore2Gallery,
    propertyType: "Residential Lease",
    status: "Active",
    mlsNumber: "PAPH2609626",
    brokerage: "Penn Liberty Real Estate",
    dateAvailable: "04/20/26",
    securityDeposit: "$2,300",
    description:
      "Four bedrooms and three full baths with in-unit washer and dryer. All-new hardwood floors, fresh paint, and a modern kitchen with upgraded cabinets and appliances. Oversized rear deck with skyline views. Bi-level interior row/townhouse (1915) in Brewerytown with central A/C, full basement, and on-street parking.",
    highlights: [
      "4 bedrooms · 3 full baths · ~1,472 sq ft",
      "Washer & dryer · new hardwood floors · freshly painted",
      "Modern kitchen — upgraded cabinets & appliances",
      "Oversized rear deck with skyline view",
      "Central A/C · natural gas · on-street parking",
      "12–24 month lease · $2,300 security deposit",
      "Brewerytown · near Girard Ave corridor",
    ],
  },
  {
    id: 4,
    slug: "1540-n-15th-st-3f-rear",
    title: "1540 N 15th St, 3rd Floor Rear",
    price: "$950/mo",
    address: "1540 N 15th St, 3rd Floor Rear, Philadelphia, PA 19121",
    beds: 1,
    baths: 1,
    sqft: 450,
    meta: "1 bed · 1 bath · ~450 sq ft · Temple area",
    area: "Temple University",
    image: n15th3fRearGallery[0],
    gallery: n15th3fRearGallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    dateAvailable: "11/05/25",
    securityDeposit: "$1,900",
    applicationFee: "$50",
    description:
      "Third-floor rear one-bedroom, one-bath apartment blocks from Temple University. Steps from the Broad Street Line, campus buildings, and neighborhood restaurants. Large kitchen opens to a cozy living room with hardwood floors. Gas stove, full-size refrigerator, and generous cabinet and counter space. Corner building with abundant windows; bedroom at the rear with closet space and room to furnish comfortably.",
    highlights: [
      "1 bedroom · 1 bath · ~450 sq ft",
      "Third floor rear · hardwood floors",
      "Gas stove · full-size refrigerator",
      "Corner building · bright, windowed rooms",
      "Blocks from Temple U · near Broad St. Line",
      "$1,900 security deposit · $50 application fee",
    ],
  },
  {
    id: 5,
    slug: "1711-n-gratz-st-2f",
    title: "1711 N Gratz St, Unit 2F",
    price: "$1,100/mo",
    address: "1711 N Gratz St, Unit 2F, Philadelphia, PA 19121",
    beds: 2,
    baths: 1,
    meta: "2 bed · 1 bath · Temple University area",
    area: "Temple University",
    image: gratz2fGallery[0],
    gallery: gratz2fGallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    securityDeposit: "$2,100",
    applicationFee: "$50",
    description:
      "Second-floor two-bedroom, one-bath apartment just off Temple University's main campus. Enter into a kitchen with a full-size refrigerator, electric stove, range hood, and eat-in dining space. Central air, gas heat, and in-unit laundry.",
    highlights: [
      "2 bedrooms · 1 bath · 2nd floor",
      "Eat-in kitchen · full-size refrigerator",
      "Electric stove · range hood",
      "Central A/C · gas heat",
      "In-unit laundry",
      "Steps from Temple University main campus",
      "$2,100 security deposit · $50 application fee",
    ],
  },
  {
    id: 6,
    slug: "2633-kensington-ave-3",
    title: "2633 Kensington Ave, Unit 3",
    price: "$2,500/mo",
    address: "2633 Kensington Ave, Unit 3, Philadelphia, PA 19125",
    beds: 3,
    baths: 2,
    meta: "3 bed · 2 bath · Available 05/29/26",
    area: "Kensington",
    image: kensington3Gallery[0],
    gallery: kensington3Gallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    dateAvailable: "05/29/26",
    securityDeposit: "$2,500",
    applicationFee: "$50",
    description:
      "Three-bedroom, two-bath apartment at 2633 Kensington Avenue in the 19125 corridor. Contact Penn Liberty for a showing, full amenity list, and application details.",
    highlights: [
      "3 bedrooms · 2 baths",
      "Kensington · Philadelphia 19125",
      "Available 05/29/26",
      "$2,500 security deposit · $50 application fee",
      "Contact Penn Liberty to schedule a tour",
    ],
  },
  {
    id: 7,
    slug: "2633-kensington-ave-1c",
    title: "2633 Kensington Ave, Unit 1C — Storefront",
    price: "$1,150/mo",
    address: "2633 Kensington Ave, Unit 1C, Philadelphia, PA 19125",
    beds: 0,
    baths: 0,
    meta: "$1,150/mo · Storefront · Kensington",
    area: "Kensington",
    image: kensington1cGallery[0],
    gallery: kensington1cGallery,
    propertyType: "Commercial Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    dateAvailable: "05/29/26",
    securityDeposit: "$1,150",
    applicationFee: "$50",
    description:
      "Storefront retail space at Unit 1C, 2633 Kensington Avenue in the 19125 corridor — $1,150 per month. Contact Penn Liberty for square footage, permitted uses, showing times, and application details.",
    highlights: [
      "Storefront · Unit 1C",
      "$1,150/mo",
      "Kensington · Philadelphia 19125",
      "Available 05/29/26",
      "$1,150 security deposit · $50 application fee",
      "Same building as our Unit 3 listing — contact office to tour",
    ],
  },
  {
    id: 8,
    slug: "5316-glenloch-st-3f",
    title: "5316 Glenloch St",
    price: "$1,350/mo",
    address: "5316 Glenloch St, Philadelphia, PA 19124",
    beds: 2,
    baths: 1,
    sqft: 660,
    meta: "2 bed · 1 bath · ~660 sq ft · Available 06/01/26",
    area: "Frankford",
    image: glenloch3fGallery[0],
    gallery: glenloch3fGallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    dateAvailable: "06/01/26",
    securityDeposit: "$1,350",
    applicationFee: "$50",
    description:
      "Very nice two-bedroom ranch-style home at 5316 Glenloch Street. Ultra-modern kitchen and bathroom recently replaced. Hardwood floors throughout. Front and rear fenced yards. Granite counters with open bar area. Central air. Stackable washer and dryer included. Move-in ready — first month, last month, and security ($3,150 total). Proof of income required; no evictions.",
    highlights: [
      "2 bedrooms · 1 bath · ~660 sq ft",
      "Ranch-style home · hardwood floors throughout",
      "Ultra-modern kitchen & bath · granite counters · open bar",
      "Central A/C · stackable washer & dryer included",
      "Front & rear fenced yards · eat-in kitchen",
      "Frankford · Philadelphia 19124",
      "Available 06/01/26",
      "$1,350 security deposit · $50 application fee",
      "Move-in: 1st, last & security ($3,150 total)",
    ],
  },
  {
    id: 11,
    slug: "811-n-15th-st",
    title: "811 N 15th St",
    price: "$3,500/mo",
    address: "811 N 15th St, Philadelphia, PA 19130",
    beds: 0,
    baths: 0,
    meta: "$3,500/mo · Fairmount · Philadelphia 19130",
    area: "Fairmount",
    image: n811_15thStGallery[0],
    gallery: n811_15thStGallery,
    propertyType: "Residential Lease",
    status: "Available",
    brokerage: "Penn Liberty Real Estate",
    applicationFee: "$50",
    description:
      "Rental at 811 N 15th Street in the Fairmount neighborhood — $3,500 per month. Contact Penn Liberty for move-in date, bedroom and bath details, and application information.",
    highlights: [
      "$3,500/mo",
      "Fairmount · Philadelphia 19130",
      "Contact office for availability and showing times",
      "$50 application fee",
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
  },
  {
    name: "Ramon Caceres",
    role: "Co-Founder",
    bio: "Founding anchor of Penn Liberty, the father side of our family-founded firm, and a steady presence in our office.",
    tagline: "License RS152630A",
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
    phone: "215-870-9016",
    emails: ["Pennlibertyre@gmail.com", "Pennlibertyrentals@gmail.com"],
  },
  {
    name: "David Froelich",
    role: "Head Property Manager / Agent",
    bio: "Leads resident service and the Company Books while remaining active in brokerage.",
    tagline: "License RS337196",
    phone: "267-231-5148",
    emails: ["Davepennliberty@gmail.com"],
  },
  {
    name: "Brandon Lohr",
    role: "Agent",
    bio: "A licensee supporting buyers and sellers throughout Philadelphia.",
    tagline: "License RS379544",
    phone: "215-251-8184",
    emails: ["bml1024@gmail.com"],
  },
  {
    name: "Juanita Sharperson",
    role: "Agent",
    bio: "Represents landlords and investors with clear communication, from showings through lease signatures and resale opportunities.",
    tagline: "License RS314983",
    phone: "215-435-2825",
    emails: ["jsharperson68@gmail.com"],
  },
  {
    name: "Fatima Aguilar",
    role: "Agent",
    bio: "Licensed agent throughout the Philadelphia area.",
    tagline: "License RS314983",
    phone: "215-833-2827",
    emails: ["Faguilar215@comcast.net"],
  },
  {
    name: "Richard Machado",
    role: "Agent",
    bio: "Licensed agent supporting buyers, sellers, and landlords throughout the Philadelphia area.",
    tagline: "License RS282437",
    phone: "215-275-9204",
    emails: ["richardpennliberty@gmail.com"],
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
