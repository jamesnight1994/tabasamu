-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "ImageRole" AS ENUM ('hero', 'packshot', 'lifestyle', 'label', 'process');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flavour" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "subscription_eligible" BOOLEAN NOT NULL DEFAULT true,
    "descriptor" TEXT,
    "base" TEXT,
    "forward_note" TEXT,
    "seo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size_code" TEXT NOT NULL DEFAULT '1L',
    "millilitres" INTEGER NOT NULL DEFAULT 1000,
    "price_amount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "compare_at" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stock_on_hand" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 800,
    "height" INTEGER NOT NULL DEFAULT 1000,
    "role" "ImageRole" NOT NULL DEFAULT 'packshot',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_key" ON "variants"("sku");

-- CreateIndex
CREATE INDEX "variants_product_id_idx" ON "variants"("product_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
