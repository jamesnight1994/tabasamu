import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateProductImageDto {
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  src?: string;
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  alt?: string;
}
