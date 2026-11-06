import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  slug!: string;
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  name!: string;
  @ApiProperty({
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  flavour!: string;
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
