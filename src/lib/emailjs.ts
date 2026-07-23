/**
 * Website lead delivery → company desk (info@).
 *
 * Primary: FormSubmit (delivers straight to PENN_EMAIL).
 * Fallback: EmailJS (legacy Gmail path) if FormSubmit fails.
 *
 * First FormSubmit use: info@ gets an activation email — click Confirm once.
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
    /* non-JSON body */
  }

  if (!res.ok) {
    throw new Error(data.message || `FormSubmit HTTP ${res.status}`);
  }

  // FormSubmit returns 200 with success false when email not confirmed yet
  if (data.success === false || data.success === "false") {
    throw new Error(data.message || "FormSubmit rejected the send");
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
    await sendViaFormSubmit(payload);
    return;
  } catch (primaryErr) {
    console.warn("FormSubmit failed, trying EmailJS fallback:", primaryErr);
  }

  await sendViaEmailJs(payload);
}
