'use client';

/**
 * BUTTON
 *
 * ⚠ D-04 — RESOLVED BY THE CLIENT (2026-07-14), OPTION (a):
 *
 *     PRIMARY   = CHARCOAL ground, CREAM label.   12.87:1  ✅ AA / AAA
 *     SECONDARY = TERRACOTTA, used as an OUTLINE CTA.
 *
 *   The original terracotta-ground primary was 4.14:1 — BELOW the 4.5:1 AA
 *   threshold for normal text. It is not used as a solid ground for normal-size
 *   text anywhere in this system.
 *
 *   The `accent` variant (solid terracotta) is retained ONLY for the rare
 *   large-format CTA, and the component ENFORCES a >=19px semibold floor on it
 *   at runtime, because at large-text sizes 4.14:1 clears the 3.0:1 threshold.
 *   The rule is enforced in code, not left to a designer to remember. [AX-01]
 */

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render as a child element (e.g. a Next `<Link>`) while keeping the styling. */
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const BASE = [
  'inline-flex items-center justify-center gap-2',
  'font-body font-medium',
  'rounded-[--radius-md]',
  'cursor-pointer select-none',
  'transition-[background-color,border-color,color,opacity]',
  'duration-[--duration-fast] ease-[--ease-standard]',
  // ⚠ Focus is ALWAYS visible. Never `outline-none` without a replacement.
  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  // WCAG 2.2 (2.5.8) requires 24px; we use 44px — this is a phone-first store.
  'min-h-[--touch-min]',
  // P-11: motion is opacity + a small translate only. Nothing bounces.
  'active:translate-y-[1px]',
].join(' ');

const VARIANTS: Record<ButtonVariant, string> = {
  // ✅ D-04(a). 12.87:1.
  primary: [
    'bg-[--color-action] text-[--color-action-fg]',
    'hover:bg-[--color-action-hover]',
    'border border-transparent',
  ].join(' '),

  // Terracotta as an OUTLINE. The terracotta is a border and a label on cream —
  // as a 4.14:1 border it clears the 3.0:1 non-text threshold, and the LABEL is
  // charcoal, not terracotta.
  secondary: [
    'bg-transparent text-[--color-ink]',
    'border border-[--color-accent]',
    'hover:bg-[--color-surface-sunken]',
  ].join(' '),

  ghost: [
    'bg-transparent text-[--color-ink]',
    'border border-transparent',
    'hover:bg-[--color-surface-sunken]',
  ].join(' '),

  // ⚠ LARGE TEXT ONLY. Enforced below — see `size` guard.
  accent: [
    'bg-[--color-accent] text-[--color-action-fg]',
    'hover:bg-[--color-accent-hover]',
    'border border-transparent',
    // On a terracotta ground the forest focus ring lacks contrast; go cream.
    'focus-visible:outline-[--color-focus-inverse]',
  ].join(' '),

  destructive: [
    'bg-transparent text-[--color-error]',
    'border border-[--color-error]',
    'hover:bg-[--color-error-bg]',
  ].join(' '),
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-[length:--text-small]',
  md: 'h-12 px-6 text-[length:--text-body]',
  // >=19px semibold — the large-text threshold. Required by `accent`.
  lg: 'h-14 px-8 text-[length:--text-body-lg] font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    asChild = false,
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  },
  ref
) {
  // ⚠ ACCESSIBILITY GUARD, enforced in code.
  //   Solid terracotta on cream is 4.14:1. That FAILS AA for normal text but
  //   PASSES AA for large text (>=18.66px bold / >=24px regular). The `accent`
  //   variant is therefore only legal at `lg`. Rather than trust a comment,
  //   we upgrade the size and warn in development.
  let effectiveSize = size;
  if (variant === 'accent' && size !== 'lg') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Button] variant="accent" (solid terracotta) is 4.14:1 and only meets ' +
          'WCAG AA at LARGE text sizes. Size has been upgraded to "lg". ' +
          'Use variant="primary" (charcoal, 12.87:1) for normal-size CTAs. [AX-01, D-04]'
      );
    }
    effectiveSize = 'lg';
  }

  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[effectiveSize],
    fullWidth && 'w-full',
    className
  );

  /**
   * ⚠ `asChild` merges these props onto the CHILD element (e.g. a Next `<Link>`)
   *   via Radix `Slot`, which requires EXACTLY ONE React element child.
   *
   *   Injecting a loading spinner alongside `children` would hand Slot two
   *   children and crash the render ("Slot failed to slot onto its children").
   *   A link is also never in a `loading` state — that is a button concern —
   *   so in `asChild` mode we forward the child untouched.
   *
   *   `disabled` is likewise dropped: an anchor has no `disabled` attribute,
   *   and emitting one would produce invalid HTML.
   */
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
