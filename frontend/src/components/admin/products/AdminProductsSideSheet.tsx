'use client';

import { useEffect, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '@heroui/react';
import { useAppDispatch, useAppSelector } from '../../../redux/admin/hooks';
import {
  closeProductSheet,
  createAdminProduct,
  selectProductSheet,
  selectProductSheetConfig,
  selectProductSheetProduct,
  selectProductSheetSubmitLoader,
  updateAdminProduct,
} from '../../../redux/admin/slices/productsSlice';
import type { ProductSheetConfig } from '../../../utils/admin/products/products-form-config';
import { adminProductCreateSchema } from '../../../utils/admin/products/products-form-schema';
import {
  buildEmptyProductFormDefaults,
  computeNextProductPosition,
  productToFormValues,
} from '../../../utils/admin/products/products-form-defaults';
import { suggestProductSlugFromName } from '../../../utils/admin/products/products-slug';
import type { AdminProductFormValues, ProductSheetState } from '../../../utils/admin/products/products-types';
import { AdminSideSheet } from '../common/AdminSideSheet';
import { AdminProductsForm } from './AdminProductsForm';

type AdminProductsSideSheetContentProps = {
  config: ProductSheetConfig;
  sheet: ProductSheetState;
};

function AdminProductsSideSheetContent({ config, sheet }: AdminProductsSideSheetContentProps) {
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectProductSheetProduct);
  const submitLoader = useAppSelector(selectProductSheetSubmitLoader);
  const items = useAppSelector((state) => state.adminProducts.items);
  const nextPosition = computeNextProductPosition(items);

  const form = useForm<AdminProductFormValues>({
    defaultValues: buildEmptyProductFormDefaults(nextPosition),
    resolver: yupResolver(adminProductCreateSchema) as Resolver<AdminProductFormValues>,
    mode: 'onSubmit',
  });

  const { reset, handleSubmit, control, setValue, setError } = form;
  const slugManuallyEditedRef = useRef(false);
  const nameValue = useWatch({ control, name: 'name' });

  useEffect(() => {
    slugManuallyEditedRef.current = false;
  }, [config.context, sheet.productId]);

  useEffect(() => {
    if (config.isUpdate || slugManuallyEditedRef.current) return;
    setValue('slug', suggestProductSlugFromName(nameValue ?? ''), { shouldValidate: false });
  }, [nameValue, config.isUpdate, setValue]);

  const handleSlugManualEdit = () => {
    slugManuallyEditedRef.current = true;
  };

  useEffect(() => {
    if (config.isUpdate && product) {
      reset(productToFormValues(product));
      return;
    }

    if (config.isUpdate && !product) {
      dispatch(closeProductSheet());
      return;
    }

    reset(buildEmptyProductFormDefaults(nextPosition));
  }, [config.isUpdate, product, nextPosition, reset, dispatch]);

  const handleClose = () => {
    if (submitLoader) return;
    dispatch(closeProductSheet());
  };

  const onSubmit = async (values: AdminProductFormValues) => {
    if (config.isUpdate && sheet.productId) {
      await dispatch(updateAdminProduct({ id: sheet.productId, formValues: values }));
      return;
    }

    const result = await dispatch(createAdminProduct(values));
    if (createAdminProduct.rejected.match(result) && result.payload?.slugConflict) {
      setError('slug', {
        type: 'server',
        message: 'This slug is already in use. Choose a different slug.',
      });
    }
  };

  const description =
    config.isUpdate && product ? product.name : 'Create a new catalogue product.';

  return (
    <AdminSideSheet
      open
      title={config.title}
      description={description}
      onClose={handleClose}
      dismissDisabled={submitLoader}
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button variant="secondary" onPress={handleClose} isDisabled={submitLoader}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-product-sheet-form"
            variant="primary"
            isPending={submitLoader}
            isDisabled={submitLoader}
          >
            {config.submitLabel}
          </Button>
        </div>
      }
    >
      <form
        id="admin-product-sheet-form"
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-full"
      >
        <AdminProductsForm
          form={form}
          context={config.context}
          isUpdate={config.isUpdate}
          onSlugManualEdit={handleSlugManualEdit}
          autoFocusName
        />
      </form>
    </AdminSideSheet>
  );
}

export function AdminProductsSideSheet() {
  const sheet = useAppSelector(selectProductSheet);
  const config = useAppSelector(selectProductSheetConfig);

  if (!sheet.visible || !config) {
    return null;
  }

  return <AdminProductsSideSheetContent config={config} sheet={sheet} />;
}
