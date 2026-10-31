import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class InboundEventDto {
  @ApiProperty({
    description: 'UUID unik untuk setiap event (idempotency)',
    example: '6f1c2b9e-0d4a-4f7b-9a51-1e2c3d4f5a6b',
  })
  @IsNotEmpty({ message: 'event_id wajib diisi' })
  @IsUUID('4', { message: 'event_id harus berupa UUID v4' })
  event_id: string;

  @ApiProperty({
    description: 'Format data.kejadian huruf kecil lampau',
    example: 'sale.paid',
  })
  @IsNotEmpty({ message: 'event_type wajib diisi' })
  @IsString()
  event_type: string;

  @ApiProperty({
    description: 'Modul pengirim event',
    example: 'M4',
  })
  @IsNotEmpty({ message: 'source_module wajib diisi' })
  @IsString()
  source_module: string;

  @ApiProperty({
    description: 'Waktu kejadian di modul pengirim (ISO 8601 dengan timezone)',
    example: '2026-10-28T10:05:12+07:00',
  })
  @IsNotEmpty({ message: 'occurred_at wajib diisi' })
  @IsString()
  occurred_at: string;

  @ApiPropertyOptional({
    description: 'Peran penerima notifikasi spesifik atau null',
    example: null,
  })
  @IsOptional()
  recipient_role?: string | null;

  @ApiProperty({
    description: 'Data payload event',
    example: { order_id: 125, status: 'lunas' },
  })
  @IsNotEmpty({ message: 'payload wajib diisi' })
  payload: any;
}

