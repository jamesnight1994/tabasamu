
export const CONTACT_PAGE = {
  meta: {
    title: 'Contact',
    description: 'How to reach Tabasamu Sips. Brewed in Nairobi, Kenya.',
  },
  hero: {
    eyebrow: 'Get in touch',
    title: 'Contact',
  },
  form: {
    aside: {
      eyebrow: "We're here to help",
      titleLines: ['Questions about', 'our kombucha'],
      body:
        'Whether you need help with an order, want to know more about our caffeine-free rooibos brew, or are exploring wholesale — send us a message and we will get back to you.',
      contactLabels: {
        email: 'Email',
        phone: 'Phone',
        location: 'Where we brew',
      },
    },
    fields: {
      name: 'Full name',
      email: 'Email',
      phone: 'Phone (optional)',
      enquiryType: 'Enquiry type (optional)',
      message: 'Message',
    },
    placeholders: {
      name: 'Your full name',
      email: 'Email address',
      phone: 'Phone number',
      enquiryType: 'Select…',
      message: 'How can we help?',
    },
    submitLabel: 'Send message',
    submittingLabel: 'Sending…',
    enquiryTypes: [
      { value: 'general' as const, label: 'General enquiry' },
      { value: 'order' as const, label: 'Order question' },
      { value: 'wholesale' as const, label: 'Wholesale' },
    ],
    success: {
      title: 'Message received',
      body: 'Thank you. We will be in touch when we can.',
    },
    toast: {
      successTitle: 'Message sent',
      successDescription: 'Thank you. We will be in touch when we can.',
      errorTitle: 'Could not send message',
      errorDescription: 'Something went wrong. Please try again in a moment.',
    },
  },
  valueProps: {
    eyebrow: 'The short version',
    title: 'Three things worth knowing.',
    intro: 'What goes into every bottle — in brief.',
    points: [
      {
        title: 'No caffeine',
        body: 'A rooibos base with none to begin with — fine at four in the afternoon.',
      },
      {
        title: 'Small batches',
        body: 'Brewed small enough that every batch is tasted before it leaves.',
      },
      {
        title: 'Kenyan fruit',
        body: 'Passion, pineapple, beetroot, and more — pressed here, added last.',
      },
    ],
  },
} as const;
