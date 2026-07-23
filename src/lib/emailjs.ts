/**
 * Website lead delivery → company desk (info@) via GoDaddy PHP.
 * EmailJS kept only as a quiet last-resort fallback.
 */
import emailjs from "@emailjs/browser";
import { PENN_EMAIL } from "@/lib/brand";

export const EMAILJS_SERVICE_ID = "Owner_Email_Website";
export const EMAILJS_TEMPLATE_ID = "template_mol56qf";
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

async function sendViaEmailJs(payload: WebsiteLeadPayload): Promise<void> {
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      ...payload,
      email: normalizeVisitorEmail(payload.email),
      to_email: PENN_EMAIL,
      to: PENN_EMAIL,
      reply_to: normalizeVisitorEmail(payload.email),
    },
    EMAILJS_PUBLIC_KEY,
  );
}

/** Send a lead to the company desk (info@). */
export async function sendWebsiteLead(payload: WebsiteLeadPayload): Promise<void> {
  let lastError = "unknown error";

  try {
    await sendViaPhp(payload);
    return;
  } catch (phpErr) {
    lastError = errText(phpErr);
    console.warn("PHP contact mail failed:", phpErr);
  }

  try {
    await sendViaEmailJs(payload);
    return;
  } catch (ejErr) {
    lastError = `${lastError} | EmailJS: ${errText(ejErr)}`;
    console.warn("EmailJS fallback failed:", ejErr);
  }

  throw new LeadDeliveryError(
    `Could not send (${lastError}). Please email ${PENN_EMAIL} or call 215-922-7900.`,
  );
}
