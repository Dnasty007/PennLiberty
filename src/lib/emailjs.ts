/**
 * Shared EmailJS config for website lead forms.
 * Desk inbox is always PENN_EMAIL (info@). Template "To Email" must be
 * either info@pennlibertyre.com or {{to_email}} in the EmailJS dashboard.
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

/** Send a lead to the company desk (info@). */
export async function sendWebsiteLead(payload: WebsiteLeadPayload): Promise<void> {
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      ...payload,
      /** Recipient for templates that use {{to_email}} */
      to_email: PENN_EMAIL,
      /** Common EmailJS template aliases */
      to: PENN_EMAIL,
      reply_to: payload.email,
    },
    EMAILJS_PUBLIC_KEY,
  );
}
