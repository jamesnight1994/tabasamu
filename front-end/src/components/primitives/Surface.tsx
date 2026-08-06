/**
 * SURFACE, CONTENT & FEEDBACK PRIMITIVES
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '../../lib/utils/cn';

/* ================================================================== *
 * Card
 * ================================================================== */

/**
 * `as` lets a Card be a `<li>` inside a product grid without losing its
 * semantics. The props are typed against the common HTMLElement rather than
 * HTMLDivElement, so `as="li"` typechecks.
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** `raised` lifts the card off the canvas; `flat` uses a hairline only. */
  elevation?: 'flat' | 'raised';
  as?: 'div' | 'article' | 'li';
}

export function Card({
  elevation = 'flat',
  as: Tag = 'div',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        // ⚠ Never pure white. `--color-surface` is #FFFCFA. [NN-01]
        'bg-[--color-surface]',
        'rounded-[--radius-lg]',
        'border border-[--color-border]',
        elevation === 'raised' && 'shadow-[--shadow-raised]',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ================================================================== *
 * Badge
 *
 * ⚠ A badge is a LABEL, never a promotion. There is no "SALE", no "ONLY 2
 *   LEFT", no countdown. Urgency architecture is forbidden. [P-07]
 * ================================================================== */

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-[--color-surface-sunken] text-[--color-ink-muted] border-[--color-border]',
  success: 'bg-[--color-success-bg] text-[--color-success] border-[--color-success]/25',
  warning: 'bg-[--color-warning-bg] text-[--color-ink] border-[--color-warning]/40',
  error: 'bg-[--color-error-bg] text-[--color-error] border-[--color-error]/25',
  info: 'bg-[--color-info-bg] text-[--color-ink] border-[--color-border]',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'label-caps',
        'rounded-[--radius-sm] border px-2 py-1',
        BADGE_TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ================================================================== *
 * SectionHeader
 * ================================================================== */

export function SectionHeader({
  eyebrow,
  title,
  intro,
  as: Tag = 'h2',
  align = 'start',
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  as?: 'h1' | 'h2' | 'h3';
  align?: 'start' | 'center';
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className
      )}
    >
      {eyebrow && <p className="label-caps text-[--color-accent]">{eyebrow}</p>}
      <Tag className="max-w-[--measure-wide]">{title}</Tag>
      {intro && (
        <p className="measure text-[length:--text-body-lg] text-[--color-ink-muted]">{intro}</p>
      )}
    </header>
  );
}

/* ================================================================== *
 * EditorialQuote — the mantra treatment.
 *
 * Brand Book §04: Fraunces italic, forest green or terracotta, NEVER gold.
 * "Once per page, maximum."
 * ================================================================== */

export function EditorialQuote({
  children,
  attribution,
  tone = 'forest',
  className,
}: {
  children: React.ReactNode;
  attribution?: string;
  /** Never `gold`. The type system says so, because the Brand Book does. */
  tone?: 'forest' | 'terracotta';
  className?: string;
}) {
  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <blockquote
        className={cn(
          'mantra measure-narrow text-[length:--text-h3]',
          tone === 'terracotta' ? 'text-[--color-accent]' : 'text-[--color-link]'
        )}
      >
        {children}
      </blockquote>
      {attribution && (
        <figcaption className="label-caps text-[--color-ink-muted]">{attribution}</figcaption>
      )}
    </figure>
  );
}

/* ================================================================== *
 * Breadcrumbs
 * ================================================================== */

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: readonly Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-[length:--text-caption]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="text-[--color-link] hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className="text-[--color-ink-muted]"
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-[--color-ink-subtle]">
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ================================================================== *
 * ResponsiveImage
 *
 * ⚠ Nairobi mobile is the target, not a MacBook. [P-10, A-04]
 *   - AVIF/WebP via Next's optimiser
 *   - explicit `sizes` so we never ship a 1536px file to a 360px phone
 *   - an aspect-ratio box, so the layout does not jump on a slow connection
 *     (CLS is a trust problem before it is a metric)
 *
 * ⚠ R-03 — THE PHOTO LIBRARY CANNOT YET SUPPORT AN ECOMMERCE SITE. Four usable
 *   16:9 landscape lifestyle frames exist. There are no packshots, no square
 *   crops, no 4:5 portraits, no cut-outs, no back-labels. `fallback` renders an
 *   honest missing-asset state rather than a broken image.
 * ================================================================== */

export interface ResponsiveImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  /** e.g. "(max-width: 768px) 100vw, 50vw" */
  sizes: string;
  priority?: boolean;
  aspect?: '1/1' | '4/5' | '3/2' | '16/9';
  className?: string;
  blurDataURL?: string;
}

const ASPECT_CLASS = {
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-video',
} as const;

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  aspect = '3/2',
  className,
  blurDataURL,
}: ResponsiveImageProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`Image not available: ${alt}`}
        className={cn(
          ASPECT_CLASS[aspect],
          'grid place-items-center',
          'rounded-[--radius-md] border border-dashed border-[--color-warning]',
          'bg-[--color-warning-bg]',
          className
        )}
      >
        <span className="px-4 text-center font-mono text-[length:--text-caption] text-[--color-ink-muted]">
          ⛔ Asset missing
          <br />
          <span className="text-[length:--text-micro]">Photography sprint — R-03</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn(ASPECT_CLASS[aspect], 'relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        className="size-full object-cover"
      />
    </div>
  );
}

/* ================================================================== *
 * Skeleton
 *
 * ⚠ P-11 caps motion at 200ms. A shimmer that sweeps for 1.5s violates it and
 *   reads as a "loading spectacle". This is a quiet opacity pulse instead, and
 *   it disappears entirely under `prefers-reduced-motion`.
 * ================================================================== */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-[--radius-md] bg-[--color-surface-sunken]',
        'motion-reduce:animate-none',
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 && 'w-2/3')} />
      ))}
    </div>
  );
}

/* ================================================================== *
 * EmptyState & ErrorState
 *
 * ⚠ Written in-voice. No jokes, no exclamation marks, non-judgemental.
 *   [Brand Book §07]
 * ================================================================== */

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-16 text-center', className)}>
      <h3 className="text-[length:--text-h3]">{title}</h3>
      {body && <p className="measure-narrow text-[--color-ink-muted]">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  action,
  className,
}: {
  title?: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-4 py-16 text-center', className)}
    >
      <h3 className="text-[length:--text-h3]">{title}</h3>
      {body && <p className="measure-narrow text-[--color-ink-muted]">{body}</p>}
      {action}
    </div>
  );
}

/* ================================================================== *
 * Pagination
 * ================================================================== */

export function Pagination({
  currentPage,
  totalPages,
  hrefFor,
  className,
}: {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const linkCls =
    'grid min-h-[--touch-min] min-w-[--touch-min] place-items-center rounded-[--radius-md] ' +
    'border border-[--color-border] px-3 font-body text-[length:--text-small] ' +
    'hover:bg-[--color-surface-sunken] transition-colors duration-[--duration-fast]';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-2', className)}>
      {currentPage > 1 && (
        <Link href={hrefFor(currentPage - 1)} rel="prev" className={linkCls}>
          Previous
        </Link>
      )}

      <ol className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <li key={page}>
            <Link
              href={hrefFor(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={cn(
                linkCls,
                page === currentPage &&
                  'border-[--color-action] bg-[--color-action] text-[--color-action-fg]'
              )}
            >
              {page}
            </Link>
          </li>
        ))}
      </ol>

      {currentPage < totalPages && (
        <Link href={hrefFor(currentPage + 1)} rel="next" className={linkCls}>
          Next
        </Link>
      )}
    </nav>
  );
}
