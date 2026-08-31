import '../../styles/about.css';
import '../../styles/contact.css';

import { AboutHero } from './AboutHero';
import { AboutIngredientsSection } from './AboutIngredientsSection';
import { AboutStorySection } from './AboutStorySection';

export function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStorySection />
      <AboutIngredientsSection />
    </>
  );
}
