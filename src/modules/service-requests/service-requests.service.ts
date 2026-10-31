import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { M2Service } from '../integrations/m2.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly m2Service: M2Service,
  ) {}

  /**
   * M5-US2: Mengisi formulir permintaan layanan dan meneruskannya ke unit usaha
   */
  async create(dto: CreateServiceRequestDto, customerId?: number) {
    // Verifikasi ketersediaan unit usaha di M2
    const businessUnits = await this.m2Service.getActiveBusinessUnits();
    const targetUnit = businessUnits.find((u) => u.id === dto.unit_usaha_id);

    // Simpan ke database lokal M5
    const request = await this.prisma.serviceRequest.create({
      data: {
        customer_id: customerId || null,
        unit_usaha_id: dto.unit_usaha_id,
        service_id: dto.service_id || null,
        customer_name: dto.customer_name,
        customer_email: dto.customer_email,
        customer_phone: dto.customer_phone,
        title: dto.title,
        description: dto.description,
        status: 'diteruskan', // status langsung "diteruskan" ke unit usaha sesuai AC M5-US2
      },
    });

    this.logger.log(
      `Permintaan layanan #${request.id} berhasil diteruskan ke unit usaha: ${targetUnit ? targetUnit.name : dto.unit_usaha_id}`,
    );

    return {
      ...request,
      unit_usaha_name: targetUnit ? targetUnit.name : `Unit Usaha #${dto.unit_usaha_id}`,
    };
  }

  async findByCustomer(customerId: number) {
    return this.prisma.serviceRequest.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: number) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Permintaan layanan #${id} tidak ditemukan`);
    }
    return request;
  }

  async findByUnitUsaha(unitUsahaId: number) {
    return this.prisma.serviceRequest.findMany({
      where: { unit_usaha_id: unitUsahaId },
      orderBy: { created_at: 'desc' },
    });
  }
}

