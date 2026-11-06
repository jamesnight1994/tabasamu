import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ConnectStockUnitDto {
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({
    description: "Opaque serial. Scanner sends this string only.",
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;
}
