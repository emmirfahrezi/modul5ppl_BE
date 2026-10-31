import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'ID Unit Usaha tujuan (dari M2)', example: 1 })
  @IsNotEmpty({ message: 'unit_usaha_id wajib diisi' })
  @Type(() => Number)
  @IsInt({ message: 'unit_usaha_id harus berupa angka bulat' })
  unit_usaha_id: number;

  @ApiPropertyOptional({ description: 'ID Layanan spesifik (jika ada)', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'service_id harus berupa angka bulat' })
  service_id?: number;

  @ApiProperty({ description: 'Nama lengkap customer pemohon', example: 'Budi Santoso' })
  @IsNotEmpty({ message: 'Nama customer wajib diisi' })
  @IsString({ message: 'Nama customer harus berupa teks' })
  customer_name: string;

  @ApiProperty({ description: 'Email customer untuk korespondensi', example: 'budi@example.com' })
  @IsNotEmpty({ message: 'Email customer wajib diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  customer_email: string;

  @ApiProperty({ description: 'Nomor telepon/WhatsApp customer', example: '081234567890' })
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @MinLength(8, { message: 'Nomor telepon minimal 8 digit' })
  customer_phone: string;

  @ApiProperty({ description: 'Judul atau perihal permintaan layanan', example: 'Permintaan Penawaran Cetak Majalah Kampus' })
  @IsNotEmpty({ message: 'Judul permintaan wajib diisi' })
  @IsString({ message: 'Judul permintaan harus berupa teks' })
  title: string;

  @ApiProperty({
    description: 'Deskripsi detail kebutuhan layanan atau spesifikasi',
    example: 'Kami membutuhkan cetak majalah 500 eksemplar, full colour art paper 150gr, ukuran A4, 48 halaman.',
  })
  @IsNotEmpty({ message: 'Deskripsi permintaan wajib diisi' })
  @IsString({ message: 'Deskripsi permintaan harus berupa teks' })
  description: string;
}

