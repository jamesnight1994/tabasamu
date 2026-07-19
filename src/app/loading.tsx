import { Skeleton, SkeletonText } from '../components/primitives/Surface';

export default function Loading() {
  return (
    <main id="main" className="mx-auto max-w-[--container-max] px-4 py-16 md:px-8">
      <span className="sr-only" role="status">
        Loading
      </span>
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-2/3 max-w-md" />
        <SkeletonText lines={3} className="max-w-[--measure-body]" />
      </div>
    </main>
  );
}
