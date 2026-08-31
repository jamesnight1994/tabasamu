import type { Metadata } from 'next';
import { AboutPage } from '../../../components/about/AboutPage';
import { ABOUT_PAGE } from '../../../content/about';
import { pageMeta } from '../../../lib/seo';

export const metadata: Metadata = pageMeta({
  title: ABOUT_PAGE.meta.title,
  description: ABOUT_PAGE.meta.description,
  path: '/about',
});

export default function Page() {
  return <AboutPage />;
}
