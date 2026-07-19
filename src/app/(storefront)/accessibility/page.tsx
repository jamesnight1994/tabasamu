import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { TrustPageView } from '../../../components/trust/TrustPageView';
import { ACCESSIBILITY } from '../../../content/trust';

/**
 * accessibility — trust/legal page. Copy lives in src/content/trust.ts so the
 * content lint can scan it. Blocked facts render as visible "awaiting
 * confirmation" panels, never invented.
 */
export const metadata: Metadata = pageMeta({
  title: ACCESSIBILITY.title,
  description: ACCESSIBILITY.metaDescription,
  path: '/accessibility',
});

export default function Page() {
  return <TrustPageView page={ACCESSIBILITY} />;
}
