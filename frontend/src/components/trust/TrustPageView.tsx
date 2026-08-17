import { SectionHeader } from '../primitives/Surface';
import { SeoBreadcrumbs } from '../seo/StructuredData';
import { cn } from '../../lib/utils/cn';
import type { TrustPage, ContentBlock } from '../../content/trust';

/**
 * TRUST PAGE VIEW  (Phase 8 · §6)
 *
 * One layout for every trust and legal page, driven by `src/content/trust.ts`.
 * Its whole job is to render two kinds of block honestly:
 *
 *   · a CONFIRMED block — normal editorial prose.
 *   · an AWAITING block — a visibly distinct panel that NAMES the gap and the
 *     decision behind it, and says only what is true right now.
 *
 * ⚠ The awaiting panel is a real, styled UI state — not a `TODO` comment and
 *   not invisible. A customer (and the client reviewing the site) can see
 *   exactly what is outstanding. This is the on-page half of the honesty
 *   discipline; the Legal-Content Requirements Register (docs/47) is the other.
 */

function ConfirmedBlockView({ heading, body }: { heading: string; body: readonly string[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[length:--text-h4]">{heading}</h2>
      {body.map((p, i) => (
        <p key={i} className="measure leading-relaxed text-[--color-ink]">
          {p}
        </p>
      ))}
    </section>
  );
}

function AwaitingBlockView({
  heading,
  blockedBy,
  interim,
}: {
  heading: string;
  blockedBy: string;
  interim: string;
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-2 rounded-[--radius-md] border border-[--color-border]',
        'bg-[--color-surface-sunken] p-5'
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[length:--text-h4]">{heading}</h2>
        {/* The honest marker. Not colour alone — it carries the word and the ID. */}
        <span
          className={cn(
            'label-caps rounded-[--radius-pill] border border-[--color-border]',
            'px-2.5 py-1 text-[--color-ink-muted]'
          )}
        >
          Awaiting confirmation
        </span>
      </div>
      <p className="measure leading-relaxed text-[--color-ink]">{interim}</p>
      <p className="font-mono text-[length:--text-micro] text-[--color-ink-subtle]">
        Blocked by {blockedBy}
      </p>
    </section>
  );
}

function BlockView({ block }: { block: ContentBlock }) {
  if (block.kind === 'confirmed') {
    return <ConfirmedBlockView heading={block.heading} body={block.body} />;
  }
  return (
    <AwaitingBlockView
      heading={block.heading}
      blockedBy={block.blockedBy}
      interim={block.interim}
    />
  );
}

export function TrustPageView({ page }: { page: TrustPage }) {
  return (
    <div className="mx-auto max-w-[--container-content] px-4 py-12 md:px-8 md:py-16">
      <SeoBreadcrumbs
        className="mb-8"
        trail={[
          { name: 'Home', path: '/' },
          { name: page.title, path: `/${page.slug}` },
        ]}
      />

      <SectionHeader as="h1" eyebrow={page.eyebrow} title={page.title} intro={page.intro} />

      <div className="mt-10 flex flex-col gap-8">
        {page.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>

      {page.footnote && (
        <p className="mt-10 border-t border-[--color-border] pt-6 text-[length:--text-caption] text-[--color-ink-muted]">
          {page.footnote}
        </p>
      )}
    </div>
  );
}
