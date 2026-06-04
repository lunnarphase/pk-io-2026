import { Global, Module } from '@nestjs/common';
import { UnitNormalizationService } from './unit-normalization.service';

@Global()
@Module({
  providers: [UnitNormalizationService],
  exports: [UnitNormalizationService],
})
export class SharedModule {}
