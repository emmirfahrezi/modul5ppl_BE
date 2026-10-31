import { Injectable, NotFoundException } from '@nestjs/common';
import { M2Service, BusinessUnitDto } from '../integrations/m2.service';
import { M4Service, ProductDto } from '../integrations/m4.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';

export interface CatalogOverviewDto {
  business_units: BusinessUnitDto[];
  products: ProductDto[];
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly m2Service: M2Service,
    private readonly m4Service: M4Service,
  ) {}

  /**
   * M5-US1: Menampilkan profil seluruh unit usaha BPU yang aktif
   */
  async getBusinessUnits(): Promise<BusinessUnitDto[]> {
    return this.m2Service.getActiveBusinessUnits();
  }

  /**
   * M5-US1: Menampilkan seluruh katalog dan unit usaha dalam 1 respons terpadu
   */
  async getOverview(): Promise<CatalogOverviewDto> {
    const [businessUnits, products] = await Promise.all([
      this.m2Service.getActiveBusinessUnits(),
      this.m4Service.getActiveProducts(),
    ]);

    return {
      business_units: businessUnits,
      products: products,
    };
  }

  /**
   * M5-US5: Mencari dan menyaring katalog berdasarkan kata kunci, kategori, atau unit usaha
   */
  async getProducts(query: CatalogQueryDto) {
    let products = await this.m4Service.getActiveProducts({
      q: query.q,
      unit_usaha_id: query.unit_usaha_id,
    });

    if (query.category) {
      products = products.filter(
        (p) => p.category.toLowerCase() === query.category!.toLowerCase(),
      );
    }

    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const perPage = query.per_page && query.per_page > 0 ? Math.min(Number(query.per_page), 100) : 20;
    const total = products.length;
    const totalPages = Math.ceil(total / perPage) || 1;

    const startIndex = (page - 1) * perPage;
    const paginatedItems = products.slice(startIndex, startIndex + perPage);

    return {
      data: paginatedItems,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  async getProductById(id: number): Promise<ProductDto> {
    const product = await this.m4Service.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Produk dengan ID ${id} tidak ditemukan`);
    }
    return product;
  }
}

