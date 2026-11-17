import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

const emptyToUndefined = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return typeof value === 'string' ? value.trim() || undefined : value;
};

const toOptionalNumber = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
};

export class CatalogQueryDto {
  @ApiPropertyOptional({
    description: 'Kata kunci pencarian (nama, SKU, deskripsi, kategori/tipe produk atau jasa)',
    example: 'payung',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Unit Usaha (dari Modul M2)',
    example: 1,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'unit_usaha_id harus berupa angka bulat' })
  unit_usaha_id?: number;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan kategori atau tipe (mis. PRODUCT, SERVICE, produk, jasa)',
    example: 'PRODUCT',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan tipe item dari M4 (PRODUCT atau SERVICE)',
    example: 'SERVICE',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Partner (UUID dari M3/M4)',
    example: '00000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  partner_id?: string;

  @ApiPropertyOptional({ description: 'Filter harga minimum (rupiah)', example: 10000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({}, { message: 'min_price harus berupa angka' })
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Filter harga maksimum (rupiah)', example: 200000 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({}, { message: 'max_price harus berupa angka' })
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    description: 'Urutan hasil (tanda minus berarti menurun, sesuai Panduan Bab 4)',
    enum: ['price', '-price', 'name', '-name', 'created_at', '-created_at'],
    example: '-created_at',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['price', '-price', 'name', '-name', 'created_at', '-created_at'], {
    message: 'sort harus salah satu dari: price, -price, name, -name, created_at, -created_at',
  })
  sort?: string;

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

