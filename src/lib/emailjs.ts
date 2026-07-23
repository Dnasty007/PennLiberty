/**
 * Website lead delivery → company desk (info@).
 *
 * Primary: EmailJS (Gmail connected as info@) — same path as dashboard Test It.
 * Fallback: GoDaddy PHP (/api/contact.php) if EmailJS fails.
 */
import emailjs from "@emailjs/browser";
import { PENN_EMAIL } from "@/lib/brand";

export const EMAILJS_SERVICE_ID = "Owner_Email_Website";
/** Current EmailJS Contact Us template (recreated after old mol56qf was deleted). */
export const EMAILJS_TEMPLATE_ID = "template_7ru8po5";
export const EMAILJS_PUBLIC_KEY = "ykKMeoPCgTNLT5di1";

export type WebsiteLeadPayload = {
  title: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  time: string;
};

export class LeadDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadDeliveryError";
  }
}

/** Clean visitor email before send (mobile autofill often adds junk chars). */
export function normalizeVisitorEmail(raw: string): string {
  let email = raw.trim();
  email = email.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, "");
  const angle = email.match(/<([^>]+@[^>]+)>/);
  if (angle) email = angle[1].trim();
  email = email.replace(/[\r\n\s]/g, "");
  return email;
}

function errText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.message === "string") return o.message;
    try {
      return JSON.stringify(err);
    } catch {
      return "unknown error";
    }
  }
  return "unknown error";
}

async function sendViaEmailJs(payload: WebsiteLeadPayload): Promise<void> {
  const email = normalizeVisitorEmail(payload.email);
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      title: payload.title,
      name: payload.name.trim(),
      email,
      phone: payload.phone.trim() || "N/A",
      address: payload.address.trim() || "N/A",
      message: payload.message.trim(),
      time: payload.time,
      to_email: PENN_EMAIL,
      to: PENN_EMAIL,
      reply_to: email,
    },
    EMAILJS_PUBLIC_KEY,
  );
}

async function sendViaPhp(payload: WebsiteLeadPayload): Promise<void> {
  const endpoint = `${window.location.origin}/api/contact.php`;

  const body = {
    ...payload,
    email: normalizeVisitorEmail(payload.email),
    name: payload.name.trim(),
    phone: payload.phone.trim() || "N/A",
    message: payload.message.trim(),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: { ok?: boolean; error?: string; mail?: boolean; saved?: boolean } = {};
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    throw new Error(
      `Mail server returned unexpected response (${res.status}). Please email ${PENN_EMAIL} directly.`,
    );
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Mail server error (${res.status})`);
  }
}

/** Send a lead to the company desk (info@). */
export async function sendWebsiteLead(payload: WebsiteLeadPayload): Promise<void> {
  let lastError = "unknown error";

  // Primary: EmailJS (dashboard Test It path — now working with info@)
  try {
    await sendViaEmailJs(payload);
    return;
  } catch (ejErr) {
    lastError = errText(ejErr);
    console.warn("EmailJS send failed:", ejErr);
  }

  // Fallback: site PHP
  try {
    await sendViaPhp(payload);
    return;
  } catch (phpErr) {
    lastError = `${lastError} | PHP: ${errText(phpErr)}`;
    console.warn("PHP contact mail failed:", phpErr);
  }

  throw new LeadDeliveryError(
    `Could not send (${lastError}). Please email ${PENN_EMAIL} or call 215-922-7900.`,
  );
}
