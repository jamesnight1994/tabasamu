import type { NestApiProduct } from '../../adapters/http/map-nest-product';
import { ADMIN_API_PATHS } from '../../lib/admin/api-paths';
import { adminWebApi } from '../../lib/admin/web-api';
import type { AdminProductStatus } from '../../utils/admin/products/products-types';

type AdminProductsListResponse = {
  items: NestApiProduct[];
  nextCursor: null;
};

export const adminProductsService = {
  async list(status?: AdminProductStatus): Promise<NestApiProduct[]> {
    const params = status ? { status } : undefined;
    const response = await adminWebApi.getAll<AdminProductsListResponse>(
      ADMIN_API_PATHS.products,
      params,
    );
    return response.items ?? [];
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
