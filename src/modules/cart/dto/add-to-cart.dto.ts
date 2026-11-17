import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID produk (UUID / ID) dari Modul M4',
    example: '91180a0e-7b74-4178-9c3b-2f8a63a16a52',
  })
  @IsNotEmpty({ message: 'product_id wajib diisi' })
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString({ message: 'product_id harus berupa teks / UUID' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Jumlah kuantitas produk yang ditambahkan (default 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'qty harus berupa angka bulat' })
  @Min(1, { message: 'qty minimal 1' })
  qty?: number = 1;
}

