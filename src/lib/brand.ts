/** Shared brand identity — phone, email, legal lines used across the site. */

export const PENN_PHONE_DISPLAY = "215-922-7900";
export const PENN_PHONE_TEL = "+12159227900";
/** Primary public contact — Co-Founder Operations (site inquiries) */
export const PENN_EMAIL = "Rayluke@pennlibertyre.com";
/** Legacy desk inbox (kept for reference; not used as primary CTA) */
export const PENN_EMAIL_LEGACY = "info@pennlibertyre.com";
export const PENN_BROKERAGE_LICENSE = "RB066799";
export const PENN_FOUNDED_YEAR = 2009;
export const PENN_COPYRIGHT_YEAR = 2009;
export const PENN_CITY = "Philadelphia, PA";
export const PENN_FIRM_NAME = "Penn Liberty Real Estate";
export const PENN_TAGLINE = "Real Estate & Property Management";
/** Public portfolio size (doors managed) */
export const PENN_UNITS_MANAGED = "175+";

export function pennMailto(subject: string, body: string): string {
  return (
    `mailto:${PENN_EMAIL}?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}
