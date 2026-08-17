'use client';

/**
 * OVERLAY & DISCLOSURE PRIMITIVES
 *
 * Built on Radix, which supplies the parts that are easy to get wrong and
 * expensive to debug: focus trapping, focus restoration, `aria-modal`, escape
 * handling, scroll locking, and correct roving-tabindex on tabs.
 *
 * All motion obeys P-11: <=200ms, opacity + a small translate only, and it is
 * removed entirely under `prefers-reduced-motion`.
 */

import * as RadixDialog from '@radix-ui/react-dialog';
import * as RadixTabs from '@radix-ui/react-tabs';
import * as RadixAccordion from '@radix-ui/react-accordion';
import * as RadixToast from '@radix-ui/react-toast';
import { cn } from '../../lib/utils/cn';

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

const SCRIM = cn(
  'fixed inset-0 z-[--z-overlay]',
  // Charcoal at low alpha — not black. Black is not in the palette.
  'bg-[#2D2D2D]/40 backdrop-blur-[2px]',
  'data-[state=open]:animate-in data-[state=open]:fade-in',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out',
  'motion-reduce:animate-none'
);

const CLOSE_BTN = cn(
  'grid size-11 place-items-center shrink-0',
  'rounded-[--radius-md] text-[--color-ink]',
  'hover:bg-[--color-surface-sunken]',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
  'transition-colors duration-[--duration-fast]'
);

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current">
      <path d="M3.5 3.5l9 9m0-9l-9 9" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================== *
 * Dialog
 * ================================================================== */

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Hide the visible title, but keep it for screen readers. */
  hideTitle?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  hideTitle,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={SCRIM} />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[--z-dialog] -translate-x-1/2 -translate-y-1/2',
            'flex w-[calc(100vw-2rem)] max-w-lg flex-col gap-6',
            'max-h-[calc(100dvh-4rem)] overflow-y-auto',
            'rounded-[--radius-lg] border border-[--color-border]',
            // Never pure white. [NN-01]
            'bg-[--color-surface] p-6 shadow-[--shadow-overlay]',
            'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out',
            'motion-reduce:animate-none'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <RadixDialog.Title
                className={cn('text-[length:--text-h3]', hideTitle && 'sr-only')}
              >
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-[length:--text-small] text-[--color-ink-muted]">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close aria-label="Close" className={CLOSE_BTN}>
              <CloseIcon />
            </RadixDialog.Close>
          </div>

          <div>{children}</div>

          {footer && <div className="flex flex-wrap justify-end gap-3">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ================================================================== *
 * Drawer — the cart drawer and the mobile nav drawer.
 *
 * ⚠ On a 360px phone the drawer is FULL WIDTH. A 320px panel with a 40px
 *   peek of the page behind it wastes the only screen the customer has.
 * ================================================================== */

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  side?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  /** Pinned to the bottom, outside the scroll area — e.g. the cart's checkout CTA. */
  footer?: React.ReactNode;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  side = 'right',
  children,
  footer,
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={SCRIM} />
        <RadixDialog.Content
          className={cn(
            'fixed z-[--z-drawer] flex flex-col',
            'border-[--color-border] bg-[--color-surface] shadow-[--shadow-overlay]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'motion-reduce:animate-none',

            /*
             * ⚠ A BOTTOM SHEET is a different object from a side panel, not a
             *   variant of one.
             *
             *   It is capped at 85svh — never 100vh — so a strip of the page
             *   stays visible behind it. That is what tells the customer the
             *   sheet is a layer over their results, not a new page they have
             *   navigated to.
             *
             *   `svh`, not `vh`: on mobile Safari, `100vh` is taller than the
             *   visible viewport when the address bar is showing, so a `vh`-sized
             *   sheet puts its own confirm button underneath the browser chrome.
             */
            side === 'bottom' && [
              'inset-x-0 bottom-0 max-h-[85svh] rounded-t-[--radius-lg] border-t',
              'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            ],

            side !== 'bottom' && [
              'inset-y-0 w-full md:max-w-md',
              side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              side === 'right'
                ? 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right'
                : 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
            ]
          )}
        >
          <header className="flex items-center justify-between gap-4 border-b border-[--color-border] px-5 py-4">
            <RadixDialog.Title className="text-[length:--text-h4]">{title}</RadixDialog.Title>
            <RadixDialog.Close aria-label="Close" className={CLOSE_BTN}>
              <CloseIcon />
            </RadixDialog.Close>
          </header>

          {/* The scroll area. The footer must never be occluded by it. */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

          {footer && (
            <footer
              className={cn(
                'border-t border-[--color-border] bg-[--color-surface] px-5 py-4',
                // Respect the iOS home indicator / Android gesture bar.
                'pb-[max(1rem,env(safe-area-inset-bottom))]'
              )}
            >
              {footer}
            </footer>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ================================================================== *
 * Tabs
 * ================================================================== */

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({
  items,
  defaultValue,
  className,
}: {
  items: readonly TabItem[];
  defaultValue?: string;
  className?: string;
}) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue ?? items[0]?.value}
      className={cn('flex flex-col gap-6', className)}
    >
      <RadixTabs.List
        className="flex gap-1 overflow-x-auto border-b border-[--color-border]"
        // Radix handles roving tabindex + arrow keys.
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'shrink-0 whitespace-nowrap px-4 py-3',
              'min-h-[--touch-min]',
              'font-body text-[length:--text-small] text-[--color-ink-muted]',
              'border-b-2 border-transparent',
              // ⚠ Selection is NOT colour-only — the underline carries it too.
              'data-[state=active]:border-[--color-accent] data-[state=active]:text-[--color-ink]',
              'data-[state=active]:font-medium',
              'hover:text-[--color-ink]',
              'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-[-2px]',
              'transition-colors duration-[--duration-fast]'
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content
          key={item.value}
          value={item.value}
          className="focus-visible:outline-2 focus-visible:outline-[--color-focus]"
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

/* ================================================================== *
 * Accordion
 * ================================================================== */

export interface AccordionItem {
  value: string;
  trigger: string;
  content: React.ReactNode;
}

export function Accordion({
  items,
  type = 'single',
  className,
  defaultValue,
  iconStyle = 'chevron',
  itemClassName,
}: {
  items: readonly AccordionItem[];
  type?: 'single' | 'multiple';
  className?: string;
  defaultValue?: string;
  iconStyle?: 'chevron' | 'plus';
  itemClassName?: string;
}) {
  const common = {
    className: cn('flex flex-col', className),
  };

  const body = items.map((item) => (
    <RadixAccordion.Item
      key={item.value}
      value={item.value}
      className={cn(itemClassName ?? 'border-b border-[--color-border]')}
    >
      <RadixAccordion.Header>
        <RadixAccordion.Trigger
          className={cn(
            'group flex w-full items-center justify-between gap-4 text-left',
            'min-h-[--touch-comfortable] py-4',
            iconStyle === 'plus'
              ? 'text-[1.375rem] font-[440] text-[--color-ink]'
              : 'font-body text-[length:--text-body] font-medium text-[--color-ink]',
            'hover:text-[--color-link]',
            'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-[-2px]',
            'transition-colors duration-[--duration-fast]'
          )}
        >
          {item.trigger}
          {iconStyle === 'plus' ? (
            <span className="relative size-3.5 shrink-0 text-[--color-ink-muted]" aria-hidden>
              <svg
                viewBox="0 0 12 12"
                className="cursor-pointer absolute inset-0 size-full group-data-[state=open]:hidden"
              >
                <path
                  d="M6 1.25v9.5M1.25 6h9.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                viewBox="0 0 12 12"
                className="cursor-pointer absolute inset-0 hidden size-full group-data-[state=open]:block"
              >
                <path
                  d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className={cn(
                'size-3 shrink-0 fill-[--color-ink-muted] cursor-pointer',
                'transition-transform duration-[--duration-base] ease-[--ease-standard]',
                'group-data-[state=open]:rotate-180',
                'motion-reduce:transition-none'
              )}
            >
              <path d="M6 8.5 1.5 4h9z" />
            </svg>
          )}
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>

      <RadixAccordion.Content
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-accordion-down',
          'data-[state=closed]:animate-accordion-up',
          'motion-reduce:animate-none'
        )}
      >
        <div
          className={cn(
            'accordion-content-body measure pb-5 text-[length:--text-body] text-[--color-ink-muted]',
            iconStyle === 'plus' && 'pb-6'
          )}
        >
          {item.content}
        </div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  ));

  return type === 'single' ? (
    <RadixAccordion.Root type="single" collapsible defaultValue={defaultValue} {...common}>
      {body}
    </RadixAccordion.Root>
  ) : (
    <RadixAccordion.Root type="multiple" defaultValue={defaultValue ? [defaultValue] : undefined} {...common}>
      {body}
    </RadixAccordion.Root>
  );
}

/* ================================================================== *
 * Toast
 *
 * ⚠ `role="status"` + `aria-live="polite"` — a toast must be announced, or it
 *   does not exist for a screen-reader user.
 * ================================================================== */

export type ToastTone = 'neutral' | 'success' | 'error';

const TOAST_TONE: Record<ToastTone, string> = {
  neutral: 'border-[--color-border]',
  success: 'border-[--color-success]',
  error: 'border-[--color-error]',
};

export interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: React.ReactNode;
}

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  tone = 'neutral',
  action,
}: ToastProps) {
  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={5000}
      className={cn(
        'flex items-start gap-4',
        'rounded-[--radius-lg] border-l-2 bg-[--color-surface] p-4',
        'border border-[--color-border] shadow-[--shadow-overlay]',
        TOAST_TONE[tone],
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out',
        'motion-reduce:animate-none'
      )}
    >
      <div className="flex flex-1 flex-col gap-1">
        <RadixToast.Title className="font-body text-[length:--text-small] font-medium text-[--color-ink]">
          {title}
        </RadixToast.Title>
        {description && (
          <RadixToast.Description className="text-[length:--text-caption] text-[--color-ink-muted]">
            {description}
          </RadixToast.Description>
        )}
      </div>

      {action && <RadixToast.Action altText="Action">{action}</RadixToast.Action>}

      <RadixToast.Close aria-label="Dismiss" className={cn(CLOSE_BTN, 'size-8')}>
        <CloseIcon />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      <RadixToast.Viewport
        className={cn(
          'fixed bottom-0 right-0 z-[--z-toast]',
          'flex w-full max-w-sm flex-col gap-2 p-4',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
          'outline-none'
        )}
      />
    </RadixToast.Provider>
  );
}
