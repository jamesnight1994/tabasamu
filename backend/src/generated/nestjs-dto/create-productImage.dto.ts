import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateProductImageDto {
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  src!: string;
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  alt!: string;
}
