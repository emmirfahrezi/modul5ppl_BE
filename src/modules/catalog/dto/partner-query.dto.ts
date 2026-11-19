import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return typeof value === 'string' ? value.trim() || undefined : value;
};

const toOptionalNumber = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
};

export class PartnerQueryDto {
  @ApiPropertyOptional({
    description: 'Kata kunci pencarian mitra (nama usaha, deskripsi, alamat, kode partner)',
    example: 'grafika',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Unit Usaha naungan partner (dari M2)',
    example: 1,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'unit_usaha_id harus berupa angka bulat' })
  unit_usaha_id?: number;

  @ApiPropertyOptional({
    description: 'Filter kategori usaha (Produk atau Jasa)',
    example: 'Produk',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Nomor halaman (default 1)', example: 1, default: 1 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah item per halaman (default 20, maksimal 100)',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number = 20;
}
