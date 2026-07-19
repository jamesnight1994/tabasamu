'use client';

import type * as React from 'react';

/**
 * FORM PRIMITIVES
 *
 * Accessibility rules enforced here, not documented and forgotten:
 *  - Every field has a real `<label>`. A placeholder is NOT a label — it
 *    vanishes on focus and is invisible to many screen readers.
 *  - Errors are wired with `aria-describedby` + `aria-invalid`, and announced
 *    via `role="alert"`.
 *  - Error text is NEVER colour-only. It carries a text cue as well, so it
 *    survives colour-blindness and greyscale. (WCAG 1.4.1)
 *  - No pure-white grounds anywhere. Fields sit on cream-sunken. [NN-01]
 */

import { forwardRef, useId } from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import * as RadixRadio from '@radix-ui/react-radio-group';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '../../lib/utils/cn';

/* ------------------------------------------------------------------ *
 * Field shell — label + hint + error, shared by every control.
 * ------------------------------------------------------------------ */

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Visually hide the label but keep it for screen readers. Use sparingly. */
  hideLabel?: boolean;
  children: (ids: { inputId: string; describedBy: string | undefined }) => React.ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  required,
  hideLabel,
  children,
  className,
}: FieldProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'font-body text-[length:--text-small] font-medium text-[--color-ink]',
          hideLabel && 'sr-only'
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-[--color-ink-muted]" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-[length:--text-caption] text-[--color-ink-muted]">
          {hint}
        </p>
      )}

      {children({ inputId, describedBy })}

      {error && <FormError id={errorId}>{error}</FormError>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FormError
 * ------------------------------------------------------------------ */

export function FormError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-[length:--text-caption] text-[--color-error]"
    >
      {/* ⚠ NOT colour-only. A text cue survives greyscale and colour-blindness. */}
      <span aria-hidden="true" className="font-medium">
        !
      </span>
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Shared control styling
 * ------------------------------------------------------------------ */

const CONTROL = [
  'w-full font-body text-[length:--text-body] text-[--color-ink]',
  // Not pure white. [NN-01]
  'bg-[--color-surface-sunken]',
  'border border-[--color-border] rounded-[--radius-md]',
  'px-4 min-h-[--touch-comfortable]',
  'placeholder:text-[--color-ink-subtle]',
  'transition-[border-color] duration-[--duration-fast]',
  'hover:border-[--color-border-strong]',
  'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-0',
  'focus-visible:border-[--color-focus]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'aria-[invalid=true]:border-[--color-error]',
].join(' ');

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'h-12', className)}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ *
 * PhoneInput
 *
 * ⚠ Kenyan numbers only. `inputMode="tel"` brings up the right keypad — a
 *   text keyboard on a phone field is a real conversion cost on mobile.
 *   Normalisation to 2547XXXXXXXX happens in the DOMAIN layer, not here. [NN-06]
 * ------------------------------------------------------------------ */

export const PhoneInput = forwardRef<HTMLInputElement, InputProps>(function PhoneInput(
  { className, ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="0712 345 678"
      className={className}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ *
 * Textarea
 * ------------------------------------------------------------------ */

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'resize-y py-3 leading-[--leading-body]', className)}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ *
 * Select — native. A custom listbox is a large a11y liability for no gain,
 * and the native control is what a mid-range Android renders best.
 * ------------------------------------------------------------------ */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, placeholder, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(CONTROL, 'h-12 cursor-pointer appearance-none pr-10', className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-4 top-1/2 size-3 -translate-y-1/2 fill-[--color-ink-muted]"
      >
        <path d="M6 8.5 1.5 4h9z" />
      </svg>
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Checkbox
 * ------------------------------------------------------------------ */

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * ReactNode, not string — a facet row carries a colour swatch and a result
   * count alongside the text. It stays REQUIRED: an unlabelled checkbox is
   * invisible to a screen reader.
   */
  label: React.ReactNode;
  hint?: string;
  disabled?: boolean;
  name?: string;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  hint,
  disabled,
  name,
}: CheckboxProps) {
  const generated = useId();
  const cbId = id ?? generated;

  return (
    <div className="flex items-start gap-3">
      <RadixCheckbox.Root
        id={cbId}
        name={name}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
        disabled={disabled}
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center',
          'rounded-[--radius-sm] border border-[--color-border-strong]',
          'bg-[--color-surface-sunken]',
          'data-[state=checked]:border-[--color-action] data-[state=checked]:bg-[--color-action]',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-[--duration-fast]'
        )}
      >
        <RadixCheckbox.Indicator>
          <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-[--color-action-fg]">
            <path d="m2.5 6.2 2.3 2.3 4.7-5" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={cbId}
          className="cursor-pointer font-body text-[length:--text-small] text-[--color-ink]"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[length:--text-caption] text-[--color-ink-muted]">{hint}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * RadioGroup
 * ------------------------------------------------------------------ */

export interface RadioOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  hideLegend?: boolean;
}

export function RadioGroup({
  name,
  legend,
  options,
  value,
  onValueChange,
  hideLegend,
}: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend
        className={cn(
          'font-body text-[length:--text-small] font-medium text-[--color-ink]',
          hideLegend && 'sr-only'
        )}
      >
        {legend}
      </legend>

      <RadixRadio.Root
        name={name}
        value={value}
        onValueChange={onValueChange}
        className="flex flex-col gap-3"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-start gap-3">
            <RadixRadio.Item
              id={`${name}-${opt.value}`}
              value={opt.value}
              disabled={opt.disabled}
              className={cn(
                'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                'border border-[--color-border-strong] bg-[--color-surface-sunken]',
                'data-[state=checked]:border-[--color-action]',
                'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-[--duration-fast]'
              )}
            >
              <RadixRadio.Indicator className="size-2.5 rounded-full bg-[--color-action]" />
            </RadixRadio.Item>

            <div className="flex flex-col gap-0.5">
              <label
                htmlFor={`${name}-${opt.value}`}
                className="cursor-pointer font-body text-[length:--text-small] text-[--color-ink]"
              >
                {opt.label}
              </label>
              {opt.hint && (
                <span className="text-[length:--text-caption] text-[--color-ink-muted]">
                  {opt.hint}
                </span>
              )}
            </div>
          </div>
        ))}
      </RadixRadio.Root>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ *
 * Switch
 * ------------------------------------------------------------------ */

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Switch({ id, checked, onCheckedChange, label, hint, disabled }: SwitchProps) {
  const generated = useId();
  const swId = id ?? generated;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={swId}
          className="cursor-pointer font-body text-[length:--text-small] font-medium text-[--color-ink]"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[length:--text-caption] text-[--color-ink-muted]">{hint}</span>
        )}
      </div>

      <RadixSwitch.Root
        id={swId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-[--radius-pill]',
          'border border-[--color-border-strong] bg-[--color-surface-sunken]',
          'data-[state=checked]:border-[--color-action] data-[state=checked]:bg-[--color-action]',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-[--duration-fast]'
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            'block size-4 translate-x-1 rounded-full bg-[--color-ink-muted]',
            'data-[state=checked]:translate-x-6 data-[state=checked]:bg-[--color-action-fg]',
            'transition-transform duration-[--duration-fast] ease-[--ease-standard]'
          )}
        />
      </RadixSwitch.Root>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * QuantityControl
 *
 * ⚠ Buttons are 44px. On a 360px Android this is the difference between a
 *   sale and a rage-tap. Both buttons carry a real accessible name — an
 *   unlabelled "+" is invisible to a screen reader.
 * ------------------------------------------------------------------ */

export interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** For the accessible name: "Decrease quantity of Pineapple Ginger". */
  itemName?: string;
}

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  itemName,
}: QuantityControlProps) {
  const suffix = itemName ? ` of ${itemName}` : '';
  const labelId = useId();

  const btn = cn(
    'grid size-11 place-items-center shrink-0',
    'text-[--color-ink] cursor-pointer',
    'hover:bg-[--color-surface-sunken]',
    'focus-visible:outline-2 focus-visible:outline-[--color-focus] focus-visible:outline-offset-[-2px]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'transition-colors duration-[--duration-fast]'
  );

  return (
    <div
      className={cn(
        'inline-flex items-center',
        'rounded-[--radius-md] border border-[--color-border]',
        'bg-[--color-surface]'
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease quantity${suffix}`}
        className={cn(btn, 'rounded-l-[--radius-md]')}
      >
        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current">
          <rect x="1" y="5.25" width="10" height="1.5" rx="0.75" />
        </svg>
      </button>

      <output
        id={labelId}
        aria-live="polite"
        className="min-w-10 text-center font-mono text-[length:--text-small] tabular-nums text-[--color-ink]"
      >
        {value}
      </output>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Increase quantity${suffix}`}
        className={cn(btn, 'rounded-r-[--radius-md]')}
      >
        <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current">
          <path d="M5.25 1h1.5v4h4v1.5h-4v4h-1.5v-4h-4V5h4z" />
        </svg>
      </button>
    </div>
  );
}
