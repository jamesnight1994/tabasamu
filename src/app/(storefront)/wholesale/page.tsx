import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { TrustPageView } from '../../../components/trust/TrustPageView';
import { WHOLESALE } from '../../../content/trust';

/**
 * wholesale — trust/legal page. Copy lives in src/content/trust.ts so the
 * content lint can scan it. Blocked facts render as visible "awaiting
 * confirmation" panels, never invented.
 */
export const metadata: Metadata = pageMeta({
  title: WHOLESALE.title,
  description: WHOLESALE.metaDescription,
  path: '/wholesale',
});

export default function Page() {
  return <TrustPageView page={WHOLESALE} />;
}
