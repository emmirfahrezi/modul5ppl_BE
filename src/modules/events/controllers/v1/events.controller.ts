import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { EventsService } from '../../events.service';
import { InboundEventDto } from '../../dto/inbound-event.dto';

@ApiTags('Events')
@Controller({
  path: 'events',
  version: '1',
})
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menerima event antarmodul (Bab 5 Panduan Integrasi)',
    description:
      'Endpoint penerima event antarmodul dengan header X-Service-Key dan jaminan idempotensi event_id',
  })
  @ApiHeader({
    name: 'X-Service-Key',
    description: 'Kunci modul pengirim event',
    required: false,
  })
  @ApiOkResponse({ description: 'Event berhasil diterima oleh modul penerima' })
  async handleEvent(
    @Body() dto: InboundEventDto,
    @Headers('x-service-key') serviceKey?: string,
  ) {
    return this.eventsService.handleEvent(dto);
  }
}

