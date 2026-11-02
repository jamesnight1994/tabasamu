import { Prisma, ProductStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class ProductDto {
  @ApiProperty({
    type: "string",
  })
  id!: string;
  @ApiProperty({
    type: "string",
  })
  slug!: string;
  @ApiProperty({
    type: "string",
  })
  name!: string;
  @ApiProperty({
    type: "string",
  })
  flavour!: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  position!: number;
  @ApiProperty({
    enum: ProductStatus,
    enumName: "ProductStatus",
  })
  status!: ProductStatus;
  @ApiProperty({
    type: "boolean",
  })
  subscriptionEligible!: boolean;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  descriptor!: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  base!: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  forwardNote!: string | null;
  @ApiProperty({
    type: () => Object,
    nullable: true,
  })
  seo!: Prisma.JsonValue | null;
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
}
