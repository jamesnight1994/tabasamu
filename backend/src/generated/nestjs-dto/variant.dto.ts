import { ApiProperty } from "@nestjs/swagger";

export class VariantDto {
  @ApiProperty({
    type: "string",
  })
  id!: string;
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
}
