import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { CatalogService } from '../../catalog.service';
import { CatalogQueryDto } from '../../dto/catalog-query.dto';

@ApiTags('Catalog')
@Controller({
  path: 'catalog',
  version: '1',
})
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('overview')
  @ApiOperation({
    summary: 'Melihat profil & katalog seluruh unit usaha BPU (M5-US1)',
    description: 'Menampilkan seluruh unit usaha aktif dan katalog produk dalam satu tampilan beranda customer',
  })
  @ApiOkResponse({ description: 'Data unit usaha dan katalog berhasil diambil' })
  async getOverview() {
    return this.catalogService.getOverview();
  }

  @Public()
  @Get('business-units')
  @ApiOperation({
    summary: 'Daftar unit usaha BPU aktif (M5-US1)',
    description: 'Mengambil daftar unit usaha aktif yang tersedia untuk customer',
  })
  async getBusinessUnits() {
    return this.catalogService.getBusinessUnits();
  }

  @Public()
  @Get('products')
  @ApiOperation({
    summary: 'Pencarian & filter katalog produk/jasa (M5-US5)',
    description: 'Menyaring katalog berdasarkan kata kunci, kategori, atau unit usaha dengan pagination',
  })
  async getProducts(@Query() query: CatalogQueryDto) {
    return this.catalogService.getProducts(query);
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({
    summary: 'Detail produk/jasa katalog',
    description: 'Mengambil detail satu produk/jasa untuk ditampilkan ke customer',
  })
  @ApiParam({ name: 'id', type: Number, example: 31 })
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.getProductById(id);
  }
}

