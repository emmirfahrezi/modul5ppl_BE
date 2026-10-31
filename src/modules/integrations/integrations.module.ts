import { Module, Global } from '@nestjs/common';
import { M2Service } from './m2.service';
import { M4Service } from './m4.service';

@Global()
@Module({
  providers: [M2Service, M4Service],
  exports: [M2Service, M4Service],
})
export class IntegrationsModule {}

