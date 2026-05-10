import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'nexahub-api',
      timestamp: new Date().toISOString()
    };
  }
}
