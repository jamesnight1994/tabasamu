-- CreateEnum
CREATE TYPE "StockUnitStatus" AS ENUM ('printed', 'in_stock', 'sold', 'void');

-- CreateTable
CREATE TABLE "stock_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "StockUnitStatus" NOT NULL DEFAULT 'printed',
    "variant_id" TEXT,
    "batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),
    "sold_at" TIMESTAMP(3),

    CONSTRAINT "stock_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_units_code_key" ON "stock_units"("code");

-- CreateIndex
CREATE INDEX "stock_units_variant_id_idx" ON "stock_units"("variant_id");

-- CreateIndex
CREATE INDEX "stock_units_status_idx" ON "stock_units"("status");

-- CreateIndex
CREATE INDEX "stock_units_batch_id_idx" ON "stock_units"("batch_id");

-- AddForeignKey
ALTER TABLE "stock_units" ADD CONSTRAINT "stock_units_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
