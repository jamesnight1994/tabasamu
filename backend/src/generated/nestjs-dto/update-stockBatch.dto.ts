import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional } from "class-validator";

export class UpdateStockBatchDto {
  @ApiProperty({
    description: "How many blank QR codes to create",
    minimum: 1,
    maximum: 200,
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  size?: number;
}
