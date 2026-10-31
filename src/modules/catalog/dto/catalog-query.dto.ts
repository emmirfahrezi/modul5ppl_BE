import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CatalogQueryDto {
  @ApiPropertyOptional({ description: 'Kata kunci pencarian produk atau jasa', example: 'beras' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Unit Usaha (dari Modul M2)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  unit_usaha_id?: number;

  @ApiPropertyOptional({ description: 'Filter berdasarkan kategori', example: 'Percetakan' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Nomor halaman (default 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Jumlah item per halaman (default 20, max 100)', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  per_page?: number = 20;
}

