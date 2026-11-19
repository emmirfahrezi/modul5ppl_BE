import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PartnerDto {
  id: number;
  partner_id: string;
  unit_usaha_id?: number | null;
  user_id?: number | null;
  nama_usaha: string;
  name?: string;
  kategori_usaha: string;
  category?: string;
  deskripsi_usaha?: string;
  description?: string;
  alamat_usaha?: string;
  address?: string;
  nomor_telepon_usaha?: string;
  phone?: string;
  email_usaha?: string;
  email?: string;
  profil_usaha?: string;
  image_url?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

@Injectable()
export class M3Service {
  private readonly logger = new Logger(M3Service.name);
  private readonly baseUrl: string;
  private readonly cacheTtlMs = 60_000;
  private partnersCache: { data: PartnerDto[]; expiresAt: number } | null = null;
  private inFlightPartners: Promise<PartnerDto[]> | null = null;

  // Fallback mock data mitra terverifikasi jika server M3 offline/cold-start
  private readonly mockPartners: PartnerDto[] = [
    {
      id: 1,
      partner_id: 'PRT-20261108-A9F2',
      unit_usaha_id: 1,
      user_id: 41,
      nama_usaha: 'CV Media Grafika Pasundan',
      name: 'CV Media Grafika Pasundan',
      kategori_usaha: 'Jasa',
      category: 'Jasa',
      deskripsi_usaha: 'Mitra percetakan buku, kalender, dan seminar kit resmi BPU',
      description: 'Mitra percetakan buku, kalender, dan seminar kit resmi BPU',
      alamat_usaha: 'Jl. Tamansari No. 6-8, Bandung',
      address: 'Jl. Tamansari No. 6-8, Bandung',
      nomor_telepon_usaha: '081223344556',
      phone: '081223344556',
      email_usaha: 'mediagrafika@unpas.ac.id',
      email: 'mediagrafika@unpas.ac.id',
      profil_usaha: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300',
      status: 'terverifikasi',
      created_at: '2026-11-08T10:00:00+07:00',
      updated_at: '2026-11-08T10:00:00+07:00',
    },
    {
      id: 2,
      partner_id: 'PRT-20261108-B3C1',
      unit_usaha_id: 1,
      user_id: 42,
      nama_usaha: 'Konveksi Pasundan Apparel',
      name: 'Konveksi Pasundan Apparel',
      kategori_usaha: 'Produk',
      category: 'Produk',
      deskripsi_usaha: 'Produsen jaket almamater, toga wisuda, dan kaos promosi',
      description: 'Produsen jaket almamater, toga wisuda, dan kaos promosi',
      alamat_usaha: 'Jl. Lengkong Besar No. 45, Bandung',
      address: 'Jl. Lengkong Besar No. 45, Bandung',
      nomor_telepon_usaha: '081399887766',
      phone: '081399887766',
      email_usaha: 'apparel@unpas.ac.id',
      email: 'apparel@unpas.ac.id',
      profil_usaha: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300',
      status: 'terverifikasi',
      created_at: '2026-11-08T11:00:00+07:00',
      updated_at: '2026-11-08T11:00:00+07:00',
    },
    {
      id: 3,
      partner_id: 'PRT-20261109-C7E4',
      unit_usaha_id: 2,
      user_id: 43,
      nama_usaha: 'Dapur Berkah Katering',
      name: 'Dapur Berkah Katering',
      kategori_usaha: 'Produk',
      category: 'Produk',
      deskripsi_usaha: 'Penyedia prasmanan dan nasi kotak halal untuk seminar & rapat',
      description: 'Penyedia prasmanan dan nasi kotak halal untuk seminar & rapat',
      alamat_usaha: 'Jl. Dr. Setiabudi No. 193, Bandung',
      address: 'Jl. Dr. Setiabudi No. 193, Bandung',
      nomor_telepon_usaha: '085711223344',
      phone: '085711223344',
      email_usaha: 'dapurberkah@gmail.com',
      email: 'dapurberkah@gmail.com',
      profil_usaha: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300',
      status: 'terverifikasi',
      created_at: '2026-11-09T09:00:00+07:00',
      updated_at: '2026-11-09T09:00:00+07:00',
    },
    {
      id: 4,
      partner_id: 'PRT-20261110-D2F8',
      unit_usaha_id: 3,
      user_id: 44,
      nama_usaha: 'Pasundan Creative & IT Lab',
      name: 'Pasundan Creative & IT Lab',
      kategori_usaha: 'Jasa',
      category: 'Jasa',
      deskripsi_usaha: 'Jasa audit siber, sertifikasi digital marketing, dan desain visual',
      description: 'Jasa audit siber, sertifikasi digital marketing, dan desain visual',
      alamat_usaha: 'Jl. Wartawan No. 12, Bandung',
      address: 'Jl. Wartawan No. 12, Bandung',
      nomor_telepon_usaha: '087812345678',
      phone: '087812345678',
      email_usaha: 'creativelab@unpas.ac.id',
      email: 'creativelab@unpas.ac.id',
      profil_usaha: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300',
      status: 'terverifikasi',
      created_at: '2026-11-10T14:00:00+07:00',
      updated_at: '2026-11-10T14:00:00+07:00',
    },
  ];

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('M3_BASE_URL') ||
      'https://mochammadharifitrian.pythonanywhere.com/api/m3/v1';
  }

  private applyFilters(
    items: PartnerDto[],
    query?: { q?: string; unit_usaha_id?: number; category?: string },
  ): PartnerDto[] {
    let results = items.filter((p) => p.status === 'terverifikasi');

    if (query?.unit_usaha_id !== undefined && query?.unit_usaha_id !== null) {
      results = results.filter(
        (p) =>
          p.unit_usaha_id !== undefined &&
          p.unit_usaha_id !== null &&
          Number(p.unit_usaha_id) === Number(query.unit_usaha_id),
      );
    }

    if (query?.category) {
      const cat = query.category.trim().toLowerCase();
      results = results.filter(
        (p) =>
          (p.kategori_usaha && p.kategori_usaha.toLowerCase() === cat) ||
          (p.category && p.category.toLowerCase() === cat),
      );
    }

    if (query?.q && query.q.trim() !== '') {
      const keyword = query.q.trim().toLowerCase();
      results = results.filter(
        (p) =>
          (p.nama_usaha && p.nama_usaha.toLowerCase().includes(keyword)) ||
          (p.name && p.name.toLowerCase().includes(keyword)) ||
          (p.kategori_usaha && p.kategori_usaha.toLowerCase().includes(keyword)) ||
          (p.deskripsi_usaha && p.deskripsi_usaha.toLowerCase().includes(keyword)) ||
          (p.alamat_usaha && p.alamat_usaha.toLowerCase().includes(keyword)) ||
          (p.partner_id && p.partner_id.toLowerCase().includes(keyword)),
      );
    }

    return results;
  }

  /**
   * Mengambil daftar partner/mitra terverifikasi (Kontrak K-06 M3 -> M5)
   * GET /api/m3/v1/partners?status=terverifikasi
   */
  async getVerifiedPartners(query?: {
    q?: string;
    unit_usaha_id?: number;
    category?: string;
  }): Promise<PartnerDto[]> {
    const now = Date.now();
    if (this.partnersCache && this.partnersCache.expiresAt > now) {
      return this.applyFilters(this.partnersCache.data, query);
    }

    if (this.inFlightPartners) {
      const all = await this.inFlightPartners;
      return this.applyFilters(all, query);
    }

    this.inFlightPartners = (async () => {
      if (this.baseUrl) {
        try {
          const cleanBase = this.baseUrl.replace(/\/+$/, '');
          const url = new URL(
            cleanBase.endsWith('/partners') ? cleanBase : `${cleanBase}/partners`,
          );
          url.searchParams.set('status', 'terverifikasi');
          url.searchParams.set('per_page', '100');

          const response = await fetch(url.toString(), {
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            const result = await response.json();
            const rawItems: any[] = Array.isArray(result) ? result : result.data || [];
            const mapped: PartnerDto[] = rawItems
              .filter((p: any) => p.status === 'terverifikasi')
              .map((p: any) => ({
                id: Number(p.id),
                partner_id: String(p.partner_id || `PRT-${p.id}`),
                unit_usaha_id: p.unit_usaha_id ? Number(p.unit_usaha_id) : null,
                user_id: p.user_id ? Number(p.user_id) : null,
                nama_usaha: p.nama_usaha || p.name || 'Mitra BPU',
                name: p.nama_usaha || p.name || 'Mitra BPU',
                kategori_usaha: p.kategori_usaha || p.category || 'Produk',
                category: p.kategori_usaha || p.category || 'Produk',
                deskripsi_usaha: p.deskripsi_usaha || p.description || '',
                description: p.deskripsi_usaha || p.description || '',
                alamat_usaha: p.alamat_usaha || p.address || '',
                address: p.alamat_usaha || p.address || '',
                nomor_telepon_usaha: p.nomor_telepon_usaha || p.phone || '',
                phone: p.nomor_telepon_usaha || p.phone || '',
                email_usaha: p.email_usaha || p.email || '',
                email: p.email_usaha || p.email || '',
                profil_usaha: p.profil_usaha || p.image_url || '',
                image_url: p.profil_usaha || p.image_url || '',
                status: p.status || 'terverifikasi',
                created_at: p.created_at,
                updated_at: p.updated_at,
              }));

            this.partnersCache = {
              data: mapped,
              expiresAt: Date.now() + this.cacheTtlMs,
            };
            return mapped;
          } else {
            const errRes = await response.json().catch(() => null);
            this.logger.warn(
              `M3 API merespons status ${response.status}: ${errRes?.message || response.statusText}. Menggunakan fallback data.`,
            );
          }
        } catch (err: any) {
          this.logger.warn(
            `Gagal memanggil M3 API (${this.baseUrl}): ${err?.message || err}. Menggunakan fallback data.`,
          );
        }
      }

      if (this.partnersCache) {
        return this.partnersCache.data;
      }

      return this.mockPartners;
    })();

    try {
      const all = await this.inFlightPartners;
      return this.applyFilters(all, query);
    } finally {
      this.inFlightPartners = null;
    }
  }

  async getPartnerById(idOrPartnerId: string | number): Promise<PartnerDto | null> {
    const all = await this.getVerifiedPartners();
    const str = String(idOrPartnerId).trim().toLowerCase();
    return (
      all.find(
        (p) =>
          String(p.id) === str ||
          String(p.partner_id).toLowerCase() === str,
      ) || null
    );
  }
}
