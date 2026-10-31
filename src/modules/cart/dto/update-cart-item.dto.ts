import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Jumlah kuantitas baru', example: 3 })
  @IsNotEmpty({ message: 'qty wajib diisi' })
  @Type(() => Number)
  @IsInt({ message: 'qty harus berupa angka bulat' })
  @Min(1, { message: 'qty minimal 1' })
  qty: number;
}

