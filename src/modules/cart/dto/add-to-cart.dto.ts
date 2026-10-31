import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({ description: 'ID produk dari Modul M4', example: 31 })
  @IsNotEmpty({ message: 'product_id wajib diisi' })
  @Type(() => Number)
  @IsInt({ message: 'product_id harus berupa angka bulat' })
  product_id: number;

  @ApiPropertyOptional({ description: 'Jumlah kuantitas produk yang ditambahkan (default 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'qty harus berupa angka bulat' })
  @Min(1, { message: 'qty minimal 1' })
  qty?: number = 1;
}

