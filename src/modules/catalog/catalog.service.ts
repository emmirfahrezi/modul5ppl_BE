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

  private matchesCategory(product: ProductDto, rawCategory: string): boolean {
    const cat = rawCategory.trim().toLowerCase();
    if (!cat) return true;

    const typeAliases: Record<string, string> = {
      produk: 'product',
      barang: 'product',
      product: 'product',
      jasa: 'service',
      layanan: 'service',
      service: 'service',
    };

    const normalizedType = typeAliases[cat] || cat;
    const prodCategory = (product.category || '').toLowerCase();
    const prodType = (product.type || '').toLowerCase();

    return prodCategory === cat || prodType === normalizedType;
  }

  /**
   * M5-US5: Mengambil opsi filter dinamis (kategori, tipe, unit usaha, rentang harga)
   */
  async getFilters() {
    const [businessUnits, products] = await Promise.all([
      this.m2Service.getActiveBusinessUnits(),
      this.m4Service.getActiveProducts(),
    ]);

    const categorySet = new Set<string>();
    const typeSet = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const p of products) {
      if (p.category) categorySet.add(p.category);
      if (p.type) typeSet.add(p.type);
      const price = Number(p.price) || 0;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    }

    // Jika M4 belum menyediakan field category, gunakan daftar type sebagai kategori default
    const categories = categorySet.size > 0 ? Array.from(categorySet) : Array.from(typeSet);

    return {
      categories,
      types: Array.from(typeSet),
      business_units: businessUnits.map((u) => ({
        id: u.id,
        name: u.name,
        category: u.category,
      })),
      price_range: {
        min: products.length > 0 ? minPrice : 0,
        max: products.length > 0 ? maxPrice : 0,
      },
    };
  }

  /**
   * M5-US5: Mencari dan menyaring katalog berdasarkan kata kunci, kategori, atau unit usaha
   * AC 1: Hanya produk/jasa yang sesuai filter yang tampil
   * AC 2: Jika tidak ada hasil, tetap HTTP 200 dengan data [] dan pesan "tidak ditemukan"
   * AC 3: Kombinasi beberapa filter (q + category + unit_usaha_id + price + sort) bekerja presisi
   */
  async getProducts(query: CatalogQueryDto) {
    let products = await this.m4Service.getActiveProducts({
      q: query.q,
      unit_usaha_id: query.unit_usaha_id,
    });

    if (query.category) {
      products = products.filter((p) => this.matchesCategory(p, query.category!));
    }

    if (query.type) {
      products = products.filter((p) => this.matchesCategory(p, query.type!));
    }

    if (query.partner_id) {
      const targetPartner = query.partner_id.trim().toLowerCase();
      products = products.filter(
        (p) => p.partner_id && String(p.partner_id).toLowerCase() === targetPartner,
      );
    }

    if (query.min_price !== undefined) {
      products = products.filter((p) => (Number(p.price) || 0) >= Number(query.min_price));
    }

    if (query.max_price !== undefined) {
      products = products.filter((p) => (Number(p.price) || 0) <= Number(query.max_price));
    }

    // Pengurutan (sesuai Panduan API Bersama Bab 4: tanda minus berarti menurun)
    if (query.sort) {
      const desc = query.sort.startsWith('-');
      const field = desc ? query.sort.slice(1) : query.sort;
      const dir = desc ? -1 : 1;

      products = [...products].sort((a, b) => {
        if (field === 'price') {
          return ((Number(a.price) || 0) - (Number(b.price) || 0)) * dir;
        }
        if (field === 'name') {
          return String(a.name || '').localeCompare(String(b.name || ''), 'id') * dir;
        }
        if (field === 'created_at') {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return (timeA - timeB) * dir;
        }
        return 0;
      });
    }

    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const perPage = query.per_page && query.per_page > 0 ? Math.min(Number(query.per_page), 100) : 20;
    const total = products.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);

    const startIndex = (page - 1) * perPage;
    const paginatedItems = products.slice(startIndex, startIndex + perPage);

    return {
      ...(total === 0 ? { message: 'Produk atau jasa tidak ditemukan' } : {}),
      data: paginatedItems,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  async getProductById(id: string): Promise<ProductDto> {
    const product = await this.m4Service.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Produk dengan ID ${id} tidak ditemukan`);
    }
    return product;
  }
}

