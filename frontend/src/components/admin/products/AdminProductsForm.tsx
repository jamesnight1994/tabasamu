'use client';

import {
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
} from '@heroui/react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import {
  PRODUCT_FORM_SECTIONS,
  type ProductFormFieldConfig,
} from '../../../utils/admin/products/products-form-config';
import type { AdminProductFormValues, ProductSheetContext } from '../../../utils/admin/products/products-types';
import { AdminProductsFormSection } from './AdminProductsFormSection';

type AdminProductsFormProps = {
  form: UseFormReturn<AdminProductFormValues>;
  context: ProductSheetContext;
  isUpdate: boolean;
  onSlugManualEdit?: () => void;
  autoFocusName?: boolean;
};

function shouldShowField(field: ProductFormFieldConfig, context: ProductSheetContext) {
  if (!field.modes) return true;
  return field.modes.includes(context);
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-sm font-medium text-zinc-700">{label}</span>
      <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-body text-sm text-zinc-600">
        {value || '—'}
      </span>
    </div>
  );
}

export function AdminProductsForm({
  form,
  context,
  isUpdate,
  onSlugManualEdit,
  autoFocusName = false,
}: AdminProductsFormProps) {
  const { control } = form;

  const renderField = (field: ProductFormFieldConfig) => {
    const readOnly = isUpdate && field.readOnlyOnUpdate;

    if (field.type === 'boolean') {
      return (
        <Controller
          key={field.key}
          name={field.key}
          control={control}
          render={({ field: formField, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Switch
                isSelected={Boolean(formField.value)}
                onChange={formField.onChange}
                isDisabled={readOnly}
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="font-body text-sm text-zinc-700">{field.label}</Label>
              </Switch>
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </div>
          )}
        />
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <Controller
          key={field.key}
          name={field.key}
          control={control}
          render={({ field: formField, fieldState }) => (
            <Select
              fullWidth
              isRequired={field.required}
              isInvalid={!!fieldState.error}
              selectedKey={String(formField.value ?? '')}
              onSelectionChange={(key) => formField.onChange(String(key ?? ''))}
              onBlur={formField.onBlur}
              isDisabled={readOnly}
            >
              <Label>{field.label}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox items={field.options}>
                  {(item) => (
                    <ListBox.Item id={item.value} textValue={item.label}>
                      {item.label}
                    </ListBox.Item>
                  )}
                </ListBox>
              </Select.Popover>
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </Select>
          )}
        />
      );
    }

    const inputType = field.type === 'number' ? 'number' : 'text';

    return (
      <Controller
        key={field.key}
        name={field.key}
        control={control}
        render={({ field: formField, fieldState }) => (
          <TextField
            fullWidth
            isRequired={field.required}
            isInvalid={!!fieldState.error}
            isReadOnly={readOnly}
            name={formField.name}
            type={inputType}
            validationBehavior="aria"
            value={String(formField.value ?? '')}
            onBlur={formField.onBlur}
            onChange={(value) => {
              if (field.type === 'number') {
                const parsed = value === '' ? 0 : Number(value);
                formField.onChange(Number.isNaN(parsed) ? 0 : parsed);
                return;
              }
              if (field.key === 'slug') {
                onSlugManualEdit?.();
              }
              formField.onChange(value);
            }}
          >
            <Label>{field.label}</Label>
            <Input
              placeholder={field.placeholder}
              readOnly={readOnly}
              autoFocus={autoFocusName && field.key === 'name'}
            />
            {fieldState.error ? <FieldError>{fieldState.error.message}</FieldError> : null}
          </TextField>
        )}
      />
    );
  };

  return (
    <div className="admin-products-sheet-form space-y-4">
      {PRODUCT_FORM_SECTIONS.map((section) => {
        if (section.id === 'variant' && isUpdate) {
          const values = form.getValues();
          return (
            <AdminProductsFormSection
              key={section.id}
              title={section.title}
              description="SKU and stock cannot be changed here yet."
            >
              <ReadOnlyValue label="SKU" value={values.primarySku} />
              <ReadOnlyValue label="Stock on hand" value={String(values.stockOnHand)} />
            </AdminProductsFormSection>
          );
        }

        const fields = section.fields.filter((field) => shouldShowField(field, context));
        if (!fields.length) return null;

        return (
          <AdminProductsFormSection
            key={section.id}
            title={section.title}
            description={section.description}
          >
            {fields.map((field) => renderField(field))}
          </AdminProductsFormSection>
        );
      })}
    </div>
  );
}
