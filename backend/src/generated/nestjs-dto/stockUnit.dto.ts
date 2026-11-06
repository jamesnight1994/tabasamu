import { StockUnitStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class StockUnitDto {
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
