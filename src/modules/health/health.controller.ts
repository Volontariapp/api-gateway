import { Controller, Get } from '@nestjs/common';
import { Public } from '@volontariapp/auth';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  checkHealth() {
    return this.healthService.getHealth();
  }
}
