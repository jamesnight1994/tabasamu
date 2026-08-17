import { Suspense } from 'react';
import { VerifyEmail } from '../../../components/commerce/VerifyEmail';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-sm bg-charcoal/5" />}>
      <VerifyEmail />
    </Suspense>
  );
}
