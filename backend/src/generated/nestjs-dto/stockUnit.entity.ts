import { StockUnitStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class StockUnitEntity {
  @ApiProperty({
    type: "string",
  })
  id!: string;
  @ApiProperty({
    description: "Opaque serial. Scanner sends this string only.",
    type: "string",
  })
  code!: string;
  @ApiProperty({
    enum: StockUnitStatus,
    enumName: "StockUnitStatus",
  })
  status!: StockUnitStatus;
  @ApiProperty({
    description: "Variant / SKU. Null until activate.",
    type: "string",
    nullable: true,
  })
  variantId!: string | null;
  @ApiProperty({
    type: "string",
  })
  batchId!: string;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  createdAt!: Date;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  updatedAt!: Date;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  activatedAt!: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  soldAt!: Date | null;
}
