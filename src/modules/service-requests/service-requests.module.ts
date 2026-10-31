import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './controllers/v1/service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}

