import { ContactForm } from './ContactForm';
import { ContactFormAside } from './ContactFormAside';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

export function ContactFormSection() {
  return (
    <section aria-labelledby="contact-form-heading" className="bg-surface">
      <div className="container mx-auto w-full max-w-[--container-max] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="contact-section-inset contact-form-section grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-center md:gap-12 lg:gap-16">
          <ScrollReveal delay={0} x={-18} className="min-w-0">
            <ContactFormAside />
          </ScrollReveal>

          <ScrollReveal delay={0.08} x={18} className="min-w-0">
            <div className="contact-form-card rounded-[24px] border border-[--color-border]/60 bg-white p-6 shadow-[--shadow-raised] md:p-8 lg:p-10">
              <ContactForm />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
