import { ImageRole } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import {
  ProductEntity,
  type ProductEntity as ProductEntityAsType,
} from "./product.entity";

export class ProductImageEntity {
  @ApiProperty({
    type: "string",
  })
  id!: string;
  @ApiProperty({
    type: "string",
  })
  productId!: string;
  @ApiProperty({
    type: "string",
  })
  src!: string;
  @ApiProperty({
    type: "string",
  })
  alt!: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  width!: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  height!: number;
  @ApiProperty({
    enum: ImageRole,
    enumName: "ImageRole",
  })
  role!: ImageRole;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  sortOrder!: number;
  @ApiProperty({
    type: () => ProductEntity,
    required: false,
  })
  product?: ProductEntityAsType;
}
