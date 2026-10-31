import { Controller, Post, Body, Get, Param, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { ServiceRequestsService } from '../../service-requests.service';
import { CreateServiceRequestDto } from '../../dto/create-service-request.dto';

@ApiTags('Service Requests')
@Controller({
  path: 'service-requests',
  version: '1',
})
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Submit formulir permintaan layanan ke unit usaha (M5-US2)',
    description: 'Customer mengisi formulir kontak/layanan yang kemudian diteruskan langsung ke unit usaha tujuan',
  })
  @ApiCreatedResponse({ description: 'Permintaan layanan berhasil dibuat dan diteruskan' })
  async create(@Body() dto: CreateServiceRequestDto, @Request() req: any) {
    const customerId = req.user?.userId || req.user?.user_id;
    return this.serviceRequestsService.create(dto, customerId);
  }

  @ApiBearerAuth('bearerAuth')
  @Get('my')
  @ApiOperation({
    summary: 'Daftar permintaan layanan milik customer yang sedang login',
    description: 'Melihat riwayat pengajuan layanan customer',
  })
  async getMyRequests(@Request() req: any) {
    const customerId = req.user?.userId || req.user?.user_id || 1;
    return this.serviceRequestsService.findByCustomer(customerId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Detail permintaan layanan',
    description: 'Melihat detail status dan informasi permintaan layanan',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.serviceRequestsService.findById(id);
  }
}

