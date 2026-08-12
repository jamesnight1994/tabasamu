import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ImageRole, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { toApiProduct, type ApiProduct } from './product.mapper';

const includeAll = {
  variants: true,
  images: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: ProductStatus): Promise<{ items: ApiProduct[]; nextCursor: null }> {
    const products = await this.prisma.product.findMany({
      where: status ? { status } : undefined,
      include: includeAll,
      orderBy: { position: 'asc' },
    });
    return {
      items: products.map(toApiProduct),
      nextCursor: null,
    };
  }

  async bySlug(slug: string): Promise<ApiProduct> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: includeAll,
    });
    if (!product) throw new NotFoundException(`Product not found: ${slug}`);
    return toApiProduct(product);
  }

  async byId(id: string): Promise<ApiProduct> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: includeAll,
    });
    if (!product) throw new NotFoundException(`Product not found: ${id}`);
    return toApiProduct(product);
  }

  async create(dto: CreateProductDto): Promise<ApiProduct> {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Slug already exists: ${dto.slug}`);

    const product = await this.prisma.product.create({
      data: {
        id: dto.id,
        slug: dto.slug,
        name: dto.name,
        flavour: dto.flavour ?? dto.name,
        position: dto.position ?? 0,
        status: dto.status ?? ProductStatus.draft,
        subscriptionEligible: dto.subscriptionEligible ?? true,
        descriptor: dto.descriptor ?? null,
        base: dto.base ?? null,
        forwardNote: dto.forwardNote ?? null,
        seo: dto.seo === undefined ? undefined : (dto.seo as Prisma.InputJsonValue),
        variants: dto.variants?.length
          ? {
              create: dto.variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                sizeCode: v.sizeCode ?? '1L',
                millilitres: v.millilitres ?? 1000,
                priceAmount: v.priceAmount ?? null,
                currency: v.currency ?? 'KES',
                compareAt: v.compareAt ?? null,
                active: v.active ?? true,
                stockOnHand: v.stockOnHand ?? 0,
              })),
            }
          : undefined,
        images: dto.images?.length
          ? {
              create: dto.images.map((img, i) => ({
                src: img.src,
                alt: img.alt,
                width: img.width ?? 800,
                height: img.height ?? 1000,
                role: parseImageRole(img.role),
                sortOrder: img.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: includeAll,
    });

    return toApiProduct(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ApiProduct> {
    await this.ensureExists(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        flavour: dto.flavour,
        position: dto.position,
        status: dto.status,
        subscriptionEligible: dto.subscriptionEligible,
        descriptor: dto.descriptor,
        base: dto.base,
        forwardNote: dto.forwardNote,
        seo: dto.seo === undefined ? undefined : (dto.seo as Prisma.InputJsonValue),
      },
      include: includeAll,
    });
    return toApiProduct(product);
  }

  /**
   * Publish requires approved descriptor + base (regulated claims).
   * Ingredients/nutrition remain Pending (D-05) — do not block MVP publish.
   */
  async publish(id: string): Promise<ApiProduct> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product not found: ${id}`);

    const missing: string[] = [];
    if (!product.descriptor) missing.push('descriptor (D-13)');
    if (!product.base) missing.push('base (D-50)');
    if (missing.length) {
      throw new UnprocessableEntityException({
        message: 'Cannot publish until required fields are set',
        missing,
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.active },
      include: includeAll,
    });
    return toApiProduct(updated);
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`Product not found: ${id}`);
  }
}

function parseImageRole(role?: string): ImageRole {
  if (role && Object.values(ImageRole).includes(role as ImageRole)) {
    return role as ImageRole;
  }
  return ImageRole.packshot;
}
