import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { TrustPageView } from '../../../components/trust/TrustPageView';
import { CONTACT } from '../../../content/trust';

/**
 * contact — trust/legal page. Copy lives in src/content/trust.ts so the
 * content lint can scan it. Blocked facts render as visible "awaiting
 * confirmation" panels, never invented.
 */
export const metadata: Metadata = pageMeta({
  title: CONTACT.title,
  description: CONTACT.metaDescription,
  path: '/contact',
});

export default function Page() {
  return <TrustPageView page={CONTACT} />;
}
