'use client';

import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
  Toast,
} from '@heroui/react';
import { CONTACT_PAGE } from '../../content/contact';
import {
  contactFormDefaults,
  contactFormSchema,
  type ContactFormValues,
} from '../../domain/contact/contact-schema';

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const copy = CONTACT_PAGE.form;

  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contactFormDefaults,
    mode: 'onSubmit',
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };

      if (!res.ok) {
        const description = data.message ?? copy.toast.errorDescription;
        Toast.toast.danger(copy.toast.errorTitle, { description });
        return;
      }

      reset(contactFormDefaults);
      Toast.toast.success(copy.toast.successTitle, {
        description: copy.toast.successDescription,
      });
    } catch {
      Toast.toast.danger(copy.toast.errorTitle, { description: copy.toast.errorDescription });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Form className="contact-form flex flex-col gap-5" onSubmit={onSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              fullWidth
              isRequired
              isInvalid={!!fieldState.error}
              isDisabled={submitting}
              name={field.name}
              validationBehavior="aria"
              value={field.value}
              onBlur={field.onBlur}
              onChange={field.onChange}
            >
              <Label>{copy.fields.name}</Label>
              <Input
                autoComplete="name"
                className="contact-form__input"
                placeholder={copy.placeholders.name}
              />
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
            </TextField>
          )}
        />

        <Controller
          name="enquiryType"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              fullWidth
              isInvalid={!!fieldState.error}
              isDisabled={submitting}
              placeholder={copy.placeholders.enquiryType}
              selectedKey={field.value ?? null}
              onSelectionChange={(key) =>
                field.onChange(key ? (String(key) as ContactFormValues['enquiryType']) : undefined)
              }
              onBlur={field.onBlur}
            >
              <Label>{copy.fields.enquiryType}</Label>
              <Select.Trigger className="contact-form__input contact-form__select">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox items={copy.enquiryTypes}>
                  {(item) => (
                    <ListBox.Item id={item.value} textValue={item.label}>
                      {item.label}
                    </ListBox.Item>
                  )}
                </ListBox>
              </Select.Popover>
              {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
            </Select>
          )}
        />
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            fullWidth
            isRequired
            isInvalid={!!fieldState.error}
            isDisabled={submitting}
            name={field.name}
            type="email"
            validationBehavior="aria"
            value={field.value}
            onBlur={field.onBlur}
            onChange={field.onChange}
          >
            <Label>{copy.fields.email}</Label>
            <Input
              autoComplete="email"
              className="contact-form__input"
              inputMode="email"
              placeholder={copy.placeholders.email}
              type="email"
            />
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </TextField>
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            fullWidth
            isInvalid={!!fieldState.error}
            isDisabled={submitting}
            name={field.name}
            validationBehavior="aria"
            value={field.value}
            onBlur={field.onBlur}
            onChange={field.onChange}
          >
            <Label>{copy.fields.phone}</Label>
            <Input
              autoComplete="tel"
              className="contact-form__input"
              inputMode="tel"
              placeholder={copy.placeholders.phone}
              type="tel"
            />
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </TextField>
        )}
      />

      <Controller
        name="message"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            fullWidth
            isRequired
            isInvalid={!!fieldState.error}
            isDisabled={submitting}
            name={field.name}
            validationBehavior="aria"
            value={field.value}
            onBlur={field.onBlur}
            onChange={field.onChange}
          >
            <Label>{copy.fields.message}</Label>
            <TextArea
              className="contact-form__input min-h-[9rem] resize-y"
              placeholder={copy.placeholders.message}
              rows={5}
            />
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </TextField>
        )}
      />

      <div className="pt-1">
        <Button
          fullWidth
          isDisabled={submitting}
          isPending={submitting}
          size="lg"
          type="submit"
          className="contact-form__submit gap-3 uppercase tracking-wide"
        >
          {({ isPending }) => (
            <>
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                {isPending ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                )}
              </span>
              {isPending ? copy.submittingLabel : copy.submitLabel}
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}
