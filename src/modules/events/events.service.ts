import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { InboundEventDto } from './dto/inbound-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menangani event antarmodul dengan jaminan idempotency (Bab 5)
   * Mengabaikan event dengan event_id yang sama agar tidak diproses ganda.
   */
  async handleEvent(dto: InboundEventDto) {
    // 1. Cek apakah event_id sudah pernah diterima sebelumnya
    const existing = await this.prisma.processedEvent.findUnique({
      where: { event_id: dto.event_id },
    });

    if (existing) {
      this.logger.warn(
        `Event duplikat diabaikan: [${dto.event_id}] ${dto.event_type} dari ${dto.source_module}`,
      );
      return {
        received: true,
        duplicate: true,
        message: 'Event sudah pernah diterima sebelumnya (diabaikan)',
      };
    }

    // 2. Simpan event baru ke database
    await this.prisma.processedEvent.create({
      data: {
        event_id: dto.event_id,
        event_type: dto.event_type,
        source_module: dto.source_module,
        occurred_at: new Date(dto.occurred_at),
        recipient_role: dto.recipient_role || null,
        payload: dto.payload,
      },
    });

    this.logger.log(
      `Event baru berhasil diterima: [${dto.event_id}] ${dto.event_type} dari ${dto.source_module}`,
    );

    // 3. Eksekusi asynchronous pemrosesan spesifik event (jika ada)
    this.dispatchAsync(dto);

    return {
      received: true,
      duplicate: false,
      message: 'Event berhasil diterima',
    };
  }

  private dispatchAsync(dto: InboundEventDto) {
    // Logika pemrosesan background sesuai event_type
    setImmediate(async () => {
      try {
        if (dto.event_type === 'order.paid') {
          this.logger.log(`Memproses notifikasi pesanan lunas untuk payload:`, dto.payload);
        }
      } catch (err: any) {
        this.logger.error(`Gagal memproses background event: ${err?.message || err}`);
      }
    });
  }
}
