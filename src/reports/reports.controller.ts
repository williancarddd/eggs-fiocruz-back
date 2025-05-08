import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ResponseDashboardDto } from './dto/reponse-dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get overall system metrics for dashboard' })
  @ApiResponse({
    description: 'Returns consolidated metrics for the dashboard',
    type: ResponseDashboardDto,
  })
  async getDashboard() {
    return this.reportsService.getDashboard();
  }
}
