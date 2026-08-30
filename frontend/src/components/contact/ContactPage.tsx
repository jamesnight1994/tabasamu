import '../../styles/contact.css';

import { ContactFormSection } from './ContactFormSection';
import { ContactHero } from './ContactHero';
import { ContactValueProps } from './ContactValueProps';

export function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactFormSection />
      <ContactValueProps />
    </>
  );
}
