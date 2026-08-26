'use client';

import type { ReactNode } from 'react';

type AdminProductsFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminProductsFormSection({
  title,
  description,
  children,
}: AdminProductsFormSectionProps) {
  return (
    <section className="admin-products-form-section rounded-lg border border-zinc-200 bg-white p-4">
      <header className="mb-4 border-b border-zinc-100 pb-3">
        <h3 className="font-body text-sm font-semibold text-zinc-800">{title}</h3>
        {description ? (
          <p className="mt-1 font-body text-xs text-zinc-500">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
