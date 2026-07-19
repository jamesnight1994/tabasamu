import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import { SectionHeader } from '../../../components/primitives/Surface';
import { SeoBreadcrumbs } from '../../../components/seo/StructuredData';
import { CookiePreferences } from '../../../components/analytics/CookiePreferences';

export const metadata: Metadata = pageMeta({
  title: 'Cookie preferences',
  description:
    'Choose whether Tabasamu Sips may use privacy-respecting analytics. Essential cookies keep the shop working; measurement is always optional.',
  path: '/cookie-preferences',
});

export default function Page() {
  return (
    <div className="mx-auto max-w-[--container-content] px-4 py-12 md:px-8 md:py-16">
      <SeoBreadcrumbs
        className="mb-8"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Cookie preferences', path: '/cookie-preferences' },
        ]}
      />
      <SectionHeader
        as="h1"
        eyebrow="Your choice"
        title="Cookie preferences."
        intro="We use only what the shop needs, plus measurement if you allow it. Change your mind here any time."
      />
      <div className="mt-10">
        <CookiePreferences />
      </div>
    </div>
  );
}
