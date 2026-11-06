import { ApiProperty } from "@nestjs/swagger";
import {
  ProductEntity,
  type ProductEntity as ProductEntityAsType,
} from "./product.entity";
import {
  StockUnitEntity,
  type StockUnitEntity as StockUnitEntityAsType,
} from "./stockUnit.entity";

export class VariantEntity {
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
  sku!: string;
  @ApiProperty({
    type: "string",
  })
  sizeCode!: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  millilitres!: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  priceAmount!: number | null;
  @ApiProperty({
    type: "string",
  })
  currency!: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  compareAt!: number | null;
  @ApiProperty({
    type: "boolean",
  })
  active!: boolean;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  stockOnHand!: number;
  @ApiProperty({
    type: () => ProductEntity,
    required: false,
  })
  product?: ProductEntityAsType;
  @ApiProperty({
    type: () => StockUnitEntity,
    isArray: true,
    required: false,
  })
  stockUnits?: StockUnitEntityAsType[];
}
