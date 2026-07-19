import { Suspense } from 'react';
import { OrderDetail } from '../../../../../components/commerce/OrderViews';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-charcoal/5" />}>
      <OrderDetail orderId={id} />
    </Suspense>
  );
}
