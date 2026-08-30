import type { Metadata } from 'next';
import { ContactPage } from '../../../components/contact/ContactPage';
import { CONTACT_PAGE } from '../../../content/contact';
import { pageMeta } from '../../../lib/seo';

export const metadata: Metadata = pageMeta({
  title: CONTACT_PAGE.meta.title,
  description: CONTACT_PAGE.meta.description,
  path: '/contact',
});

export default function Page() {
  return <ContactPage />;
}
