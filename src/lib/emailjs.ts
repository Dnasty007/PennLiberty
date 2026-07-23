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

async function sendViaPhp(payload: WebsiteLeadPayload): Promise<void> {
  const endpoint = `${window.location.origin}/api/contact.php`;

  // Send as JSON — our PHP parses this reliably (form-urlencoded+charset is flaky on some hosts)
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
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
      to_email: PENN_EMAIL,
      to: PENN_EMAIL,
      reply_to: payload.email,
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
    lastError = phpErr instanceof Error ? phpErr.message : String(phpErr);
    console.warn("PHP contact mail failed:", phpErr);
  }

  try {
    await sendViaEmailJs(payload);
    return;
  } catch (ejErr) {
    const ejMsg = ejErr instanceof Error ? ejErr.message : String(ejErr);
    console.warn("EmailJS fallback failed:", ejErr);
    lastError = `${lastError} | EmailJS: ${ejMsg}`;
  }

  throw new LeadDeliveryError(
    `Could not send (${lastError}). Please email ${PENN_EMAIL} or call 215-922-7900.`,
  );
}
