import { NextResponse } from 'next/server';
import { contactFormSchema } from '../../../domain/contact/contact-schema';
import { isContactEmailConfigured, sendContactEmail } from '../../../lib/email/send-contact-email';

export async function POST(request: Request) {
  if (!isContactEmailConfigured()) {
    return NextResponse.json(
      { message: 'Contact email is not configured on the server.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please check the form and try again.', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    await sendContactEmail(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[contact] send failed', error);
    return NextResponse.json(
      { message: 'Unable to send your message. Please try again later.' },
      { status: 500 },
    );
  }
}
