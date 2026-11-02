import { ImageRole } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class ProductImageDto {
  @ApiProperty({
    type: "string",
  })
  id!: string;
  @ApiProperty({
    type: "string",
  })
  src!: string;
  @ApiProperty({
    type: "string",
  })
  alt!: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  width!: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  height!: number;
  @ApiProperty({
    enum: ImageRole,
    enumName: "ImageRole",
  })
  role!: ImageRole;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  sortOrder!: number;
}
