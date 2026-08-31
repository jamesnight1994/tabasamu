import type { LucideIcon } from 'lucide-react';
import { Citrus, FlaskConical, Leaf, Snowflake } from 'lucide-react';

const STEP_ICONS: Record<string, LucideIcon> = {
  Steep: Leaf,
  Ferment: FlaskConical,
  'Add the fruit': Citrus,
  Chill: Snowflake,
};

type AboutProcessCardProps = Readonly<{
  index: number;
  title: string;
  body: string;
}>;

export function AboutProcessCard({ index, title, body }: AboutProcessCardProps) {
  const Icon = STEP_ICONS[title] ?? Leaf;
  const step = String(index + 1).padStart(2, '0');

  return (
    <article className="about-process-card group flex h-full flex-col">
      <p aria-hidden="true" className="about-process-card__step">
        {step}.
      </p>

      <h3 className="about-process-card__title">{title}</h3>

      <p className="about-process-card__body">{body}</p>

      <div aria-hidden="true" className="about-process-card__icon-wrap">
        <Icon className="about-process-card__icon" strokeWidth={1.5} />
      </div>
    </article>
  );
}
