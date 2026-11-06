import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateProductDto {
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string;
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  flavour?: string;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  descriptor?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  base?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  forwardNote?: string | null;
  @ApiProperty({
    type: () => Object,
    required: false,
    nullable: true,
  })
  @IsOptional()
  seo?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
}
