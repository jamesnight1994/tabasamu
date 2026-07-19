import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { TrustPageView } from '../../../components/trust/TrustPageView';
import { TERMS } from '../../../content/trust';

/**
 * terms — trust/legal page. Copy lives in src/content/trust.ts so the
 * content lint can scan it. Blocked facts render as visible "awaiting
 * confirmation" panels, never invented.
 */
export const metadata: Metadata = pageMeta({
  title: TERMS.title,
  description: TERMS.metaDescription,
  path: '/terms',
});

export default function Page() {
  return <TrustPageView page={TERMS} />;
}
