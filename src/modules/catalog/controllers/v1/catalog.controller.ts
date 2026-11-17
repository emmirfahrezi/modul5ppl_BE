import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
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
  @Header('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60')
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
  @Header('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60')
  @ApiOperation({
    summary: 'Daftar unit usaha BPU aktif (M5-US1)',
    description: 'Mengambil daftar unit usaha aktif yang tersedia untuk customer',
  })
  async getBusinessUnits() {
    return this.catalogService.getBusinessUnits();
  }

  @Public()
  @Get('filters')
  @Header('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60')
  @ApiOperation({
    summary: 'Daftar opsi filter katalog (M5-US5)',
    description:
      'Mengembalikan daftar kategori/tipe, unit usaha aktif, dan rentang harga secara dinamis untuk dropdown filter UI customer',
  })
  @ApiOkResponse({ description: 'Opsi filter katalog berhasil diambil' })
  async getFilters() {
    return this.catalogService.getFilters();
  }

  @Public()
  @Get('products')
  @Header('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60')
  @ApiOperation({
    summary: 'Pencarian & filter katalog produk/jasa (M5-US5)',
    description:
      'Menyaring katalog berdasarkan kata kunci (q), kategori/tipe (category/type), unit usaha (unit_usaha_id), partner (partner_id), rentang harga (min_price/max_price), pengurutan (sort), dan pagination',
  })
  async getProducts(@Query() query: CatalogQueryDto) {
    return this.catalogService.getProducts(query);
  }

  @Public()
  @Get('products/:id')
  @Header('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60')
  @ApiOperation({
    summary: 'Detail produk/jasa katalog',
    description: 'Mengambil detail satu produk/jasa untuk ditampilkan ke customer',
  })
  @ApiParam({ name: 'id', type: String, example: '91180a0e-7b74-4178-9c3b-2f8a63a16a52' })
  async getProductById(@Param('id') id: string) {
    return this.catalogService.getProductById(id);
  }
}

