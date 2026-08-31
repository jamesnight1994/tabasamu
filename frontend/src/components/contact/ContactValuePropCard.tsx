import type { LucideIcon } from 'lucide-react';
import { Citrus, Layers, Moon } from 'lucide-react';

const VALUE_PROP_ICONS: Record<string, LucideIcon> = {
  'No caffeine': Moon,
  'Small batches': Layers,
  'Kenyan fruit': Citrus,
};

type ContactValuePropCardProps = Readonly<{
  index: number;
  title: string;
  body: string;
}>;

export function ContactValuePropCard({ index, title, body }: ContactValuePropCardProps) {
  const Icon = VALUE_PROP_ICONS[title] ?? Moon;
  const step = String(index + 1).padStart(2, '0');

  return (
    <article className="contact-value-prop-card group flex h-full flex-col">
      <p aria-hidden="true" className="contact-value-prop-card__step">
        {step}.
      </p>

      <h3 className="contact-value-prop-card__title">{title}</h3>

      <p className="contact-value-prop-card__body">{body}</p>

      <div aria-hidden="true" className="contact-value-prop-card__icon-wrap">
        <Icon className="contact-value-prop-card__icon" strokeWidth={1.5} />
      </div>
    </article>
  );
}
