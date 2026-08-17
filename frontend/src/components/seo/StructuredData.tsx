import Link from 'next/link';
import {
  breadcrumbJsonLd,
  jsonLdString,
  type Breadcrumb,
} from '../../lib/seo/structured-data';
import { cn } from '../../lib/utils/cn';

/**
 * <JsonLd>  — renders a JSON-LD object as a script tag, or nothing if null.
 *
 * ⚠ The breakout-safe `</script>` escape is applied centrally by
 *   `jsonLdString` (see its note), so every JSON-LD emission path — this
 *   component and the root layout alike — is uniformly safe. This component no
 *   longer double-escapes. [S-3]
 */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  const json = jsonLdString(data);
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}

/**
 * <SeoBreadcrumbs>  — the VISIBLE trail plus its matching BreadcrumbList schema.
 *
 * ⚠ Distinct from the presentational `Breadcrumbs` in primitives/Surface: this
 *   one ALSO emits JSON-LD, from the same source, so schema and visible trail
 *   cannot disagree — which is itself a Google structured-data violation.
 *
 * ⚠ The last crumb is the current page and is not a link (`aria-current`).
 *
 * Renders nothing for a trail shorter than two — a single crumb is not a path.
 */
export function SeoBreadcrumbs({
  trail,
  className,
}: {
  trail: readonly Breadcrumb[];
  className?: string;
}) {
  if (trail.length < 2) return null;
  const schema = breadcrumbJsonLd(trail);

  return (
    <>
      <JsonLd data={schema} />
      <nav
        aria-label="Breadcrumb"
        className={cn('font-body text-[length:--text-caption]', className)}
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-x-2">
                {isLast ? (
                  <span aria-current="page" className="text-[--color-ink-muted]">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.path}
                      className={cn(
                        'inline-flex min-h-[--touch-min] items-center text-[--color-ink]',
                        'no-underline hover:text-[--color-link] hover:underline',
                        'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                        'rounded-[--radius-sm]'
                      )}
                    >
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true" className="text-[--color-ink-subtle]">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
