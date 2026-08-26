'use client';

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100] as const;

type AdminProductsPaginationProps = {
  page: number;
  rowsPerPage: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

type PaginationNavButtonProps = {
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function PaginationNavButton({
  ariaLabel,
  disabled = false,
  onClick,
  children,
}: PaginationNavButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="admin-products-pagination__nav-btn"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function AdminProductsPagination({
  page,
  rowsPerPage,
  total,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}: AdminProductsPaginationProps) {
  if (total === 0) {
    return null;
  }

  const first = (page - 1) * rowsPerPage + 1;
  const last = Math.min(page * rowsPerPage, total);
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="admin-products-pagination flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-white py-3">
      <p className="font-body text-sm text-zinc-600">
        Showing {first} to {last} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-body text-sm text-zinc-600">
          Rows
          <select
            aria-label="Rows per page"
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <div className="admin-products-pagination__nav" role="group" aria-label="Pagination">
            <PaginationNavButton
              ariaLabel="First page"
              disabled={isFirstPage}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="size-4" aria-hidden />
            </PaginationNavButton>
            <PaginationNavButton
              ariaLabel="Previous page"
              disabled={isFirstPage}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </PaginationNavButton>
            <PaginationNavButton
              ariaLabel="Next page"
              disabled={isLastPage}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" aria-hidden />
            </PaginationNavButton>
            <PaginationNavButton
              ariaLabel="Last page"
              disabled={isLastPage}
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronsRight className="size-4" aria-hidden />
            </PaginationNavButton>
          </div>
          <span className="min-w-[4.5rem] text-center font-body text-sm text-zinc-700">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}
