import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  per_page: number;

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 3 })
  total_pages: number;
}

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiPropertyOptional({ type: () => PaginationMetaDto })
  meta?: PaginationMetaDto;
}

export class ApiErrorDetailDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ example: 'Isian tidak lolos validasi' })
  message: string;

  @ApiPropertyOptional({ example: { field: 'Field tidak boleh kosong' } })
  fields?: Record<string, string>;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ type: () => ApiErrorDetailDto })
  error: ApiErrorDetailDto;
}
