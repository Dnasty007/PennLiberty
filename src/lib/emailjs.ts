/**
 * Website lead delivery → company desk (info@).
 *
 * Order:
 * 1. Same-origin PHP on GoDaddy (/api/contact.php)
 * 2. FormSubmit → info@ (may need one-time Activate link in info@)
 * 3. EmailJS fallback (only if template still exists)
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
  constructor(
    message: string,
    readonly code: "activation" | "failed" = "failed",
  ) {
    super(message);
    this.name = "LeadDeliveryError";
  }
}

async function sendViaPhp(payload: WebsiteLeadPayload): Promise<void> {
  const res = await fetch("/api/contact.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    throw new Error(`PHP endpoint returned non-JSON (${res.status})`);
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || `PHP mail HTTP ${res.status}`);
  }
}

async function sendViaFormSubmit(payload: WebsiteLeadPayload): Promise<void> {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(PENN_EMAIL)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: `Penn Liberty website: ${payload.title}`,
      _template: "table",
      _captcha: false,
      _replyto: payload.email,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      message: payload.message,
      time: payload.time,
      source: payload.title,
    }),
  });

  const text = await res.text();
  let data: { success?: string | boolean; message?: string } = {};
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    /* non-JSON */
  }

  const msg = (data.message || "").toLowerCase();
  const needsActivation =
    msg.includes("activation") ||
    msg.includes("activate form") ||
    msg.includes("activate");

  if (needsActivation) {
    throw new LeadDeliveryError(
      `Almost there — open ${PENN_EMAIL}, find the FormSubmit “Activate Form” email (check Spam), click the link once, then press Send Message again.`,
      "activation",
    );
  }

  if (!res.ok || data.success === false || data.success === "false") {
    throw new Error(data.message || `FormSubmit HTTP ${res.status}`);
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
  const errors: string[] = [];

  try {
    await sendViaPhp(payload);
    return;
  } catch (err) {
    errors.push(`PHP: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    await sendViaFormSubmit(payload);
    return;
  } catch (err) {
    // Activation is actionable — stop here so the UI can show the steps
    if (err instanceof LeadDeliveryError && err.code === "activation") {
      throw err;
    }
    errors.push(`FormSubmit: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    await sendViaEmailJs(payload);
    return;
  } catch (err) {
    errors.push(`EmailJS: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new LeadDeliveryError(
    `Could not send right now. Please email ${PENN_EMAIL} or call 215-922-7900.`,
    "failed",
  );
}
