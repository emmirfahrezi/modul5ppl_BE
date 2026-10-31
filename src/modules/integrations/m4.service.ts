import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/exceptions/business.exception';

export interface ProductDto {
  id: number;
  name: string;
  category: string;
  unit_usaha_id: number;
  price: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface CreateOrderPayload {
  customer_id: number;
  source: string;
  items: { product_id: number; qty: number }[];
}

export interface OrderResponseDto {
  id: number;
  order_no: string;
  status: string;
  total_amount: number;
}

@Injectable()
export class M4Service {
  private readonly logger = new Logger(M4Service.name);
  private readonly baseUrl: string;

  // Fallback mock products jika server M4 belum online
  private readonly mockProducts: ProductDto[] = [
    {
      id: 31,
      name: 'Cetak Banner Vinyl Frontlite 280gr',
      category: 'Percetakan',
      unit_usaha_id: 1,
      price: 25000,
      description: 'Cetak banner spanduk per meter persegi outdoor',
      is_active: true,
    },
    {
      id: 32,
      name: 'Kaos Sablon DTF Katun Combed 30s',
      category: 'Konveksi',
      unit_usaha_id: 1,
      price: 65000,
      description: 'Kaos custom sablon full colour bahan adem',
      is_active: true,
    },
    {
      id: 40,
      name: 'Paket Nasi Kotak Ayam Bakar Madu',
      category: 'Catering',
      unit_usaha_id: 2,
      price: 30000,
      description: 'Nasi kotak lengkap dengan lalapan, sambal, dan buah',
      is_active: true,
    },
    {
      id: 41,
      name: 'Roti Manis Aneka Rasa (Box isi 6)',
      category: 'Bakery',
      unit_usaha_id: 2,
      price: 45000,
      description: 'Roti cokelat, keju, srikaya, dan abon sapi',
      is_active: true,
    },
    {
      id: 50,
      name: 'Jasa Pembuatan Landing Page Company Profile',
      category: 'IT Service',
      unit_usaha_id: 3,
      price: 1500000,
      description: 'Website responsif modern include hosting & domain 1 tahun',
      is_active: true,
    },
    {
      id: 60,
      name: 'Sewa Mobil HiAce Commuter 15 Seat + Driver',
      category: 'Transport',
      unit_usaha_id: 4,
      price: 1200000,
      description: 'Sewa kendaraan harian include sopir dalam kota',
      is_active: true,
    },
  ];

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('M4_BASE_URL') || '';
  }

  async getActiveProducts(query?: { q?: string; unit_usaha_id?: number }): Promise<ProductDto[]> {
    if (this.baseUrl) {
      try {
        const url = new URL(`${this.baseUrl}/products`);
        if (query?.q) url.searchParams.set('q', query.q);
        if (query?.unit_usaha_id) url.searchParams.set('unit_usaha_id', String(query.unit_usaha_id));

        const response = await fetch(url.toString(), {
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const result = await response.json();
          const items = Array.isArray(result) ? result : result.data || [];
          return items.filter((p: ProductDto) => p.is_active !== false);
        }
      } catch (err: any) {
        this.logger.warn(`Gagal memanggil M4 API (${this.baseUrl}): ${err?.message || err}. Menggunakan mock data.`);
      }
    }

    let results = this.mockProducts.filter((p) => p.is_active);

    if (query?.unit_usaha_id) {
      results = results.filter((p) => p.unit_usaha_id === Number(query.unit_usaha_id));
    }

    if (query?.q) {
      const keyword = query.q.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.category.toLowerCase().includes(keyword) ||
          (p.description && p.description.toLowerCase().includes(keyword)),
      );
    }

    return results;
  }

  async getProductById(productId: number): Promise<ProductDto | null> {
    const products = await this.getActiveProducts();
    return products.find((p) => p.id === productId) || null;
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

    // Fallback simulasi respons sukses K-04 jika M4 offline
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = payload.items.reduce((acc, item) => {
      const prod = this.mockProducts.find((p) => p.id === item.product_id);
      return acc + (prod ? prod.price * item.qty : 50000 * item.qty);
    }, 0);

    return {
      id: Math.floor(100 + Math.random() * 900),
      order_no: orderNumber,
      status: 'baru',
      total_amount: totalAmount,
    };
  }
}
