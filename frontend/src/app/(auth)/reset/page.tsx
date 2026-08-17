import { Suspense } from 'react';
import { ResetFlow } from '../../../components/commerce/ResetFlow';

// ⚠ useSearchParams requires a Suspense boundary in the App Router.
export default function ResetPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />}>
      <ResetFlow />
    </Suspense>
  );
}
