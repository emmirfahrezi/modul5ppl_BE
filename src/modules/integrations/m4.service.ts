import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/exceptions/business.exception';

export interface ProductDto {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  unit?: string;
  stock?: number;
  price: number | string;
  tax_rate_id?: string;
  tax_rate?: number;
  tax_rates?: {
    id: string;
    name: string;
    rate: string;
  };
  unit_usaha_id?: number;
  partner_id?: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreateOrderPayload {
  customer_id: number;
  source: string;
  items: { product_id: string; qty: number }[];
}

export interface OrderResponseDto {
  id: number | string;
  order_no: string;
  status: string;
  total_amount: number;
}

@Injectable()
export class M4Service {
  private readonly logger = new Logger(M4Service.name);
  private readonly baseUrl: string;
  private readonly serviceKey: string;

  // Fallback mock products jika server M4 belum online
  private readonly mockProducts: ProductDto[] = [
    {
      id: '31',
      sku: 'PRD-BNNR-031',
      name: 'Cetak Banner Vinyl Frontlite 280gr',
      type: 'PRODUCT',
      category: 'Percetakan',
      unit_usaha_id: 1,
      unit: 'Meter',
      stock: 100,
      price: 25000,
      tax_rate: 11,
      description: 'Cetak banner spanduk per meter persegi outdoor',
      is_active: true,
    },
    {
      id: '32',
      sku: 'PRD-KAOS-032',
      name: 'Kaos Sablon DTF Katun Combed 30s',
      type: 'PRODUCT',
      category: 'Konveksi',
      unit_usaha_id: 1,
      unit: 'Pcs',
      stock: 50,
      price: 65000,
      tax_rate: 11,
      description: 'Kaos custom sablon full colour bahan adem',
      is_active: true,
    },
    {
      id: '40',
      sku: 'PRD-CATR-040',
      name: 'Paket Nasi Kotak Ayam Bakar Madu',
      type: 'PRODUCT',
      category: 'Catering',
      unit_usaha_id: 2,
      unit: 'Box',
      stock: 200,
      price: 30000,
      tax_rate: 11,
      description: 'Nasi kotak lengkap dengan lalapan, sambal, dan buah',
      is_active: true,
    },
    {
      id: '41',
      sku: 'PRD-BAKR-041',
      name: 'Roti Manis Aneka Rasa (Box isi 6)',
      type: 'PRODUCT',
      category: 'Bakery',
      unit_usaha_id: 2,
      unit: 'Box',
      stock: 80,
      price: 45000,
      tax_rate: 11,
      description: 'Roti cokelat, keju, srikaya, dan abon sapi',
      is_active: true,
    },
    {
      id: '50',
      sku: 'SRV-WEB-050',
      name: 'Jasa Pembuatan Landing Page Company Profile',
      type: 'SERVICE',
      category: 'IT Service',
      unit_usaha_id: 3,
      unit: 'Paket',
      price: 1500000,
      tax_rate: 11,
      description: 'Website responsif modern include hosting & domain 1 tahun',
      is_active: true,
    },
    {
      id: '60',
      sku: 'AST-TRNS-060',
      name: 'Sewa Mobil HiAce Commuter 15 Seat + Driver',
      type: 'SERVICE',
      category: 'Transport',
      unit_usaha_id: 4,
      unit: 'Hari',
      price: 1200000,
      tax_rate: 11,
      description: 'Sewa kendaraan harian include sopir dalam kota',
      is_active: true,
    },
  ];

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('M4_BASE_URL') ||
      'https://araya-business-hub-m4.vercel.app/api/m4/v1';
    this.serviceKey =
      this.configService.get<string>('M4_SERVICE_KEY') || 'araya-m4-service-key-2026';
  }

  private applyFilters(
    items: ProductDto[],
    query?: { q?: string; unit_usaha_id?: number },
  ): ProductDto[] {
    let results = items.filter((p) => p.is_active !== false);

    if (query?.unit_usaha_id) {
      results = results.filter(
        (p) => p.unit_usaha_id === undefined || Number(p.unit_usaha_id) === Number(query.unit_usaha_id),
      );
    }

    if (query?.q) {
      const keyword = query.q.toLowerCase();
      results = results.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(keyword)) ||
          (p.category && p.category.toLowerCase().includes(keyword)) ||
          (p.sku && p.sku.toLowerCase().includes(keyword)) ||
          (p.type && p.type.toLowerCase().includes(keyword)) ||
          (p.description && p.description.toLowerCase().includes(keyword)),
      );
    }

    return results;
  }

  async getActiveProducts(query?: { q?: string; unit_usaha_id?: number }): Promise<ProductDto[]> {
    if (this.baseUrl) {
      try {
        const url = new URL(`${this.baseUrl}/products`);
        url.searchParams.set('limit', '100');
        if (query?.q) url.searchParams.set('q', query.q);
        if (query?.unit_usaha_id) url.searchParams.set('unit_usaha_id', String(query.unit_usaha_id));

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.serviceKey) {
          headers['X-Service-Key'] = this.serviceKey;
        }

        const response = await fetch(url.toString(), {
          headers,
        });

        if (response.ok) {
          const result = await response.json();
          const rawItems: ProductDto[] = Array.isArray(result) ? result : result.data || [];
          return this.applyFilters(rawItems, query);
        } else {
          const errRes = await response.json().catch(() => null);
          this.logger.warn(
            `M4 API merespons status ${response.status}: ${errRes?.error?.message || response.statusText}. Menggunakan fallback data.`,
          );
        }
      } catch (err: any) {
        this.logger.warn(`Gagal memanggil M4 API (${this.baseUrl}): ${err?.message || err}. Menggunakan mock data.`);
      }
    }

    return this.applyFilters(this.mockProducts, query);
  }

  async getProductById(productId: string): Promise<ProductDto | null> {
    const products = await this.getActiveProducts();
    return products.find((p) => String(p.id) === String(productId)) || null;
  }

  /**
   * Kontrak K-04: Membuat Order dari keranjang (M5 -> M4)
   * POST /api/m4/v1/orders
   */
  async createOrderFromCart(
    payload: CreateOrderPayload,
    authHeader?: string,
  ): Promise<OrderResponseDto> {
    if (!payload.items || payload.items.length === 0) {
      throw new BusinessException('ITEMS_EMPTY', 'items kosong', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (this.baseUrl) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (authHeader) {
          headers['Authorization'] = authHeader;
        } else if (this.serviceKey) {
          headers['X-Service-Key'] = this.serviceKey;
        }

        const response = await fetch(`${this.baseUrl}/orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const resData = await response.json();

        if (!response.ok) {
          const errCode = resData?.error?.code || 'ORDER_CREATION_FAILED';
          const errMsg = resData?.error?.message || 'Gagal membuat pesanan di Modul M4';
          throw new BusinessException(errCode, errMsg, response.status);
        }

        return resData.data;
      } catch (err: any) {
        if (err instanceof BusinessException) throw err;
        this.logger.warn(`Koneksi M4 gagal, membuat order mock lokal: ${err?.message || err}`);
      }
    }

    // Fallback simulasi respons sukses K-04 jika M4 POST /orders belum aktif/offline
    const availableProducts = await this.getActiveProducts();
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = payload.items.reduce((acc, item) => {
      const prod = availableProducts.find((p) => String(p.id) === String(item.product_id));
      return acc + (prod ? Number(prod.price) * item.qty : 50000 * item.qty);
    }, 0);

    return {
      id: Math.floor(100 + Math.random() * 900),
      order_no: orderNumber,
      status: 'baru',
      total_amount: totalAmount,
    };
  }

  /**
   * Mengambil status/detail order dari M4 berdasarkan order_no atau id
   */
  async getOrderByNumber(orderNo: string): Promise<any | null> {
    if (this.baseUrl) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (this.serviceKey) {
          headers['X-Service-Key'] = this.serviceKey;
        }

        const response = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(orderNo)}`, {
          headers,
        });

        if (response.ok) {
          const res = await response.json();
          return res.data || res;
        }
      } catch (err: any) {
        this.logger.warn(`Gagal mengambil order ${orderNo} dari M4: ${err?.message || err}`);
      }
    }
    return null;
  }
}
