import { SubscriptionDetail } from '../../../../../components/commerce/SubscriptionViews';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubscriptionDetail subscriptionId={id} />;
}
