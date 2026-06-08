import type { Rental } from "@/lib/data";

export const RENTALS_JSON_PATH = "/rentals.json";

function normalizeRental(raw: Rental): Rental {
  const gallery = raw.gallery?.length ? raw.gallery : raw.image ? [raw.image] : [];
  return {
    ...raw,
    gallery,
    image: raw.image || gallery[0] || "",
  };
}

/** Live inventory — fetched at runtime so GoDaddy can update without rebuilding the app. */
export async function fetchRentalsCatalog(): Promise<Rental[]> {
  const response = await fetch(RENTALS_JSON_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load rentals (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("rentals.json must be a JSON array");
  }

  return data.map((item) => normalizeRental(item as Rental));
}
