import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BusinessUnitDto {
  id: number;
  kode_unik?: string;
  name: string;
  nama?: string;
  category: string;
  division: string;
  description?: string;
  profil?: string;
  status?: string;
  is_active: boolean;
  kategori?: { id: number; nama: string };
  divisi?: { id: number; nama: string };
  [key: string]: any;
}

@Injectable()
export class M2Service {
  private readonly logger = new Logger(M2Service.name);
  private readonly baseUrl: string;
  private readonly cacheTtlMs = 60_000;
  private unitsCache: { data: BusinessUnitDto[]; expiresAt: number } | null = null;
  private inFlightUnits: Promise<BusinessUnitDto[]> | null = null;

  // Fallback mock data jika server M2 offline
  private readonly mockBusinessUnits: BusinessUnitDto[] = [
    {
      id: 1,
      kode_unik: 'UNIT-001',
      name: 'BPU Percetakan & Konveksi',
      nama: 'BPU Percetakan & Konveksi',
      category: 'Percetakan',
      division: 'Produksi',
      description: 'Layanan cetak dokumen, banner, merchandise, dan konveksi kaos/seragam',
      is_active: true,
    },
    {
      id: 2,
      kode_unik: 'UNIT-002',
      name: 'BPU Catering & Bakery',
      nama: 'BPU Catering & Bakery',
      category: 'Kuliner',
      division: 'Konsumsi',
      description: 'Penyedia catering acara, snack box, dan bakery harian',
      is_active: true,
    },
    {
      id: 3,
      kode_unik: 'UNIT-003',
      name: 'BPU IT Solution & Creative Hub',
      nama: 'BPU IT Solution & Creative Hub',
      category: 'Teknologi',
      division: 'Teknologi Informasi',
      description: 'Jasa pembuatan software, desain grafis, dan multimedia',
      is_active: true,
    },
    {
      id: 4,
      kode_unik: 'UNIT-004',
      name: 'BPU Transport & Logistik',
      nama: 'BPU Transport & Logistik',
      category: 'Jasa',
      division: 'Operasional',
      description: 'Rental kendaraan dinas, pariwisata, dan pengiriman barang',
      is_active: true,
    },
  ];

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('M2_BASE_URL') ||
      'https://pplmodul2-production.up.railway.app/api/v1';
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
          // Dukung path /unit-usaha (format aktual M2) maupun /business-units (format kontrak K-02)
          const cleanBase = this.baseUrl.replace(/\/+$/, '');
          const targetUrl =
            cleanBase.endsWith('/unit-usaha') || cleanBase.endsWith('/business-units')
              ? cleanBase
              : `${cleanBase}/unit-usaha`;

          let response = await fetch(targetUrl, {
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          });

          // Coba fallback ke /business-units jika /unit-usaha 404
          if (!response.ok && response.status === 404 && targetUrl.endsWith('/unit-usaha')) {
            const altUrl = `${cleanBase}/business-units`;
            response = await fetch(altUrl, {
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000),
            });
          }

          if (response.ok) {
            const result = await response.json();
            const rawItems: any[] = Array.isArray(result) ? result : result.data || [];
            const activeUnits: BusinessUnitDto[] = rawItems
              .filter((unit: any) => unit.status === 'aktif' || unit.is_active !== false)
              .map((unit: any) => ({
                id: Number(unit.id),
                kode_unik: unit.kode_unik || `UNIT-${String(unit.id).padStart(3, '0')}`,
                name: unit.nama || unit.name,
                nama: unit.nama || unit.name,
                category: unit.kategori?.nama || unit.category || 'Umum',
                division: unit.divisi?.nama || unit.division || 'Umum',
                description: unit.profil || unit.description || '',
                profil: unit.profil || unit.description || '',
                status: unit.status || 'aktif',
                is_active: unit.status === 'aktif' || unit.is_active !== false,
                kategori: unit.kategori,
                divisi: unit.divisi,
                created_at: unit.created_at,
                updated_at: unit.updated_at,
              }));

            this.unitsCache = {
              data: activeUnits,
              expiresAt: Date.now() + this.cacheTtlMs,
            };
            return activeUnits;
          } else {
            const errRes = await response.json().catch(() => null);
            this.logger.warn(
              `M2 API merespons status ${response.status}: ${errRes?.message || response.statusText}. Menggunakan fallback data.`,
            );
          }
        } catch (err: any) {
          this.logger.warn(
            `Gagal memanggil M2 API (${this.baseUrl}): ${err?.message || err}. Menggunakan fallback data.`,
          );
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
