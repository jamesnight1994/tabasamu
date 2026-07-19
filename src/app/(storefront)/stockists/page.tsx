import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { TrustPageView } from '../../../components/trust/TrustPageView';
import { STOCKISTS } from '../../../content/trust';

/**
 * stockists — trust/legal page. Copy lives in src/content/trust.ts so the
 * content lint can scan it. Blocked facts render as visible "awaiting
 * confirmation" panels, never invented.
 */
export const metadata: Metadata = pageMeta({
  title: STOCKISTS.title,
  description: STOCKISTS.metaDescription,
  path: '/stockists',
});

export default function Page() {
  return <TrustPageView page={STOCKISTS} />;
}
