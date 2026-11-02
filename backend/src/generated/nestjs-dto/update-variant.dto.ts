import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateVariantDto {
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  priceAmount?: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  compareAt?: number | null;
}
