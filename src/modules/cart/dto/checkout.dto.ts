import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Sumber pesanan', example: 'website', default: 'website' })
  @IsOptional()
  @IsString()
  source?: string = 'website';
}

