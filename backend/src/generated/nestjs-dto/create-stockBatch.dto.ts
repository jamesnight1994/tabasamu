import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class CreateStockBatchDto {
  @ApiProperty({
    description: "How many blank QR codes to create",
    minimum: 1,
    maximum: 200,
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  size!: number;
}
