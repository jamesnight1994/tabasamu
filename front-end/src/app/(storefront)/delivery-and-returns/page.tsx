import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { TrustPageView } from '../../../components/trust/TrustPageView';
import { DELIVERY_RETURNS } from '../../../content/trust';

/**
 * delivery-and-returns — trust/legal page. Copy lives in src/content/trust.ts so the
 * content lint can scan it. Blocked facts render as visible "awaiting
 * confirmation" panels, never invented.
 */
export const metadata: Metadata = pageMeta({
  title: DELIVERY_RETURNS.title,
  description: DELIVERY_RETURNS.metaDescription,
  path: '/delivery-and-returns',
});

export default function Page() {
  return <TrustPageView page={DELIVERY_RETURNS} />;
}
