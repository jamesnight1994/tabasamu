import type { NestApiProduct } from '../../adapters/http/map-nest-product';
import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminWebApi } from '../../lib/admin/web-api';
import type { AdminProductStatus } from '../../utils/admin/products/products-types';
import type { buildCreateProductPayload, buildUpdateProductPayload } from '../../utils/admin/products/products-form-mappers';

type AdminProductsListResponse = {
  items: NestApiProduct[];
  nextCursor: null;
};

export type CreateAdminProductPayload = ReturnType<typeof buildCreateProductPayload>;
export type UpdateAdminProductPayload = ReturnType<typeof buildUpdateProductPayload>;

export const adminProductsService = {
  async list(status?: AdminProductStatus): Promise<NestApiProduct[]> {
    const params = status ? { status } : undefined;
    const response = await adminWebApi.getAll<AdminProductsListResponse>(
      ADMIN_API_PATHS.products,
      params,
    );
    return response.items ?? [];
  },

  async create(payload: CreateAdminProductPayload): Promise<NestApiProduct> {
    return adminWebApi.createRecord<NestApiProduct>(ADMIN_API_PATHS.products, payload);
  },

  async update(id: string, payload: UpdateAdminProductPayload): Promise<NestApiProduct> {
    return adminWebApi.updateRecord<NestApiProduct>(ADMIN_API_PATHS.product(id), payload);
  },

  findCachedById(items: NestApiProduct[], id: string): NestApiProduct | undefined {
    return items.find((item) => item.id === id);
  },

  async publish(id: string): Promise<NestApiProduct> {
    return adminWebApi.postRecord<NestApiProduct>(ADMIN_API_PATHS.productPublish(id));
  },

  async archive(id: string): Promise<NestApiProduct> {
    return adminWebApi.updateRecord<NestApiProduct>(ADMIN_API_PATHS.product(id), {
      status: 'archived',
    });
  },
};
