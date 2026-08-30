import 'server-only';

import nodemailer from 'nodemailer';
import type { ContactFormValues, EnquiryType } from '../../domain/contact/contact-schema';

const ENQUIRY_LABELS: Record<EnquiryType, string> = {
  general: 'General enquiry',
  order: 'Order question',
  wholesale: 'Wholesale',
};

function enquiryLabel(type: ContactFormValues['enquiryType']): string {
  return type ? ENQUIRY_LABELS[type] : 'General enquiry';
}

function contactMailConfig() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  const inbox = process.env.CONTACT_INBOX_TO?.trim() || user;

  if (!user || !pass || !inbox) {
    throw new Error('Contact email is not configured (EMAIL_USER / EMAIL_PASS).');
  }

  return { user, pass, inbox };
}

export async function sendContactEmail(data: ContactFormValues): Promise<void> {
  const { user, pass, inbox } = contactMailConfig();
  const enquiry = enquiryLabel(data.enquiryType);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const phoneLine = data.phone.trim() ? `Phone: ${data.phone.trim()}` : null;

  const text = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    phoneLine,
    `Enquiry type: ${enquiry}`,
    '',
    data.message,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  await transporter.sendMail({
    from: `"Tabasamu Sips" <${user}>`,
    to: inbox,
    replyTo: data.email,
    subject: `[Tabasamu Contact] ${enquiry} — ${data.name}`,
    text,
  });
}

export function isContactEmailConfigured(): boolean {
  try {
    contactMailConfig();
    return true;
  } catch {
    return false;
  }
}
