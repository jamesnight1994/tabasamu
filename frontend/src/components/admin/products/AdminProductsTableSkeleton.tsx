'use client';

type AdminProductsTableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function AdminProductsTableSkeleton({
  columns = 8,
  rows = 6,
}: AdminProductsTableSkeletonProps) {
  return (
    <div className="admin-products-skeleton animate-pulse flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <div className="mb-3 flex gap-4 border-b border-zinc-100 pb-3">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={`head-${index}`} className="h-5 flex-1 rounded bg-zinc-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="mb-2 flex gap-4 border-b border-zinc-50 py-3 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1 rounded bg-zinc-100" />
          ))}
        </div>
      ))}
    </div>
  );
}
