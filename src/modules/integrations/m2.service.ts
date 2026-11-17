import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BusinessUnitDto {
  id: number;
  name: string;
  category: string;
  division: string;
  description?: string;
  is_active: boolean;
}

@Injectable()
export class M2Service {
  private readonly logger = new Logger(M2Service.name);
  private readonly baseUrl: string;
  private readonly cacheTtlMs = 60_000;
  private unitsCache: { data: BusinessUnitDto[]; expiresAt: number } | null = null;
  private inFlightUnits: Promise<BusinessUnitDto[]> | null = null;

  // Fallback mock data jika server M2 belum online / sedang development mandiri
  private readonly mockBusinessUnits: BusinessUnitDto[] = [
    {
      id: 1,
      name: 'BPU Percetakan & Konveksi',
      category: 'Percetakan',
      division: 'Produksi',
      description: 'Layanan cetak dokumen, banner, merchandise, dan konveksi kaos/seragam',
      is_active: true,
    },
    {
      id: 2,
      name: 'BPU Catering & Bakery',
      category: 'Kuliner',
      division: 'Konsumsi',
      description: 'Penyedia catering acara, snack box, dan bakery harian',
      is_active: true,
    },
    {
      id: 3,
      name: 'BPU IT Solution & Creative Hub',
      category: 'Teknologi',
      division: 'Teknologi Informasi',
      description: 'Jasa pembuatan software, desain grafis, dan multimedia',
      is_active: true,
    },
    {
      id: 4,
      name: 'BPU Transport & Logistik',
      category: 'Jasa',
      division: 'Operasional',
      description: 'Rental kendaraan dinas, pariwisata, dan pengiriman barang',
      is_active: true,
    },
  ];

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('M2_BASE_URL') || '';
  }

  async getActiveBusinessUnits(): Promise<BusinessUnitDto[]> {
    const now = Date.now();
    if (this.unitsCache && this.unitsCache.expiresAt > now) {
      return this.unitsCache.data;
    }

    if (this.inFlightUnits) {
      return this.inFlightUnits;
    }

    this.inFlightUnits = (async () => {
      if (this.baseUrl) {
        try {
          const response = await fetch(`${this.baseUrl}/business-units`, {
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            const result = await response.json();
            const items = Array.isArray(result) ? result : result.data || [];
            const activeUnits = items.filter((unit: BusinessUnitDto) => unit.is_active !== false);
            this.unitsCache = {
              data: activeUnits,
              expiresAt: Date.now() + this.cacheTtlMs,
            };
            return activeUnits;
          }
        } catch (err: any) {
          this.logger.warn(`Gagal memanggil M2 API (${this.baseUrl}): ${err?.message || err}. Menggunakan fallback data.`);
        }
      }

      if (this.unitsCache) {
        return this.unitsCache.data;
      }

      return this.mockBusinessUnits.filter((unit) => unit.is_active);
    })();

    try {
      return await this.inFlightUnits;
    } finally {
      this.inFlightUnits = null;
    }
  }
}
