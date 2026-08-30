import { z } from 'zod';

export const ENQUIRY_TYPES = ['general', 'order', 'wholesale'] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === '' || v.length >= 7, 'Enter a valid phone number'),
  enquiryType: z.enum(ENQUIRY_TYPES).optional(),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const contactFormDefaults: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  enquiryType: undefined,
  message: '',
};
