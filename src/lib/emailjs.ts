/**
 * Website lead delivery → company desk (info@).
 *
 * Primary: same-origin GoDaddy PHP (/api/contact.php) — reliable, no 3rd-party activate.
 * Fallback: EmailJS only if PHP fails (template may be missing).
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

/** Deliver via GoDaddy PHP mail → info@. */
async function sendViaPhp(payload: WebsiteLeadPayload): Promise<void> {
  // Prefer absolute URL so /contact and other routes always hit the real file
  const endpoint = `${window.location.origin}/api/contact.php`;

  const body = new URLSearchParams({
    title: payload.title,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    message: payload.message,
    time: payload.time,
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const text = await res.text();
  let data: { ok?: boolean; error?: string } = {};
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
      to_email: PENN_EMAIL,
      to: PENN_EMAIL,
      reply_to: payload.email,
    },
    EMAILJS_PUBLIC_KEY,
  );
}

/** Send a lead to the company desk (info@). */
export async function sendWebsiteLead(payload: WebsiteLeadPayload): Promise<void> {
  try {
    await sendViaPhp(payload);
    return;
  } catch (phpErr) {
    console.warn("PHP contact mail failed:", phpErr);
  }

  try {
    await sendViaEmailJs(payload);
    return;
  } catch (ejErr) {
    console.warn("EmailJS fallback failed:", ejErr);
  }

  throw new LeadDeliveryError(
    `Could not send right now. Please email ${PENN_EMAIL} or call 215-922-7900.`,
  );
}
