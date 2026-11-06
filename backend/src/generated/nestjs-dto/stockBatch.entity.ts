import { ApiProperty } from "@nestjs/swagger";

export class StockBatchEntity {
  @ApiProperty({
    type: "string",
  })
  id!: string;
  @ApiProperty({
    description: "How many blank QR codes to create",
    minimum: 1,
    maximum: 200,
    type: "integer",
    format: "int32",
  })
  size!: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  createdAt!: Date;
}
