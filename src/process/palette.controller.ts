import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PaletteService } from './palette.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProcessStatus } from '@prisma/client';
import { ZodResponseInterceptor } from 'src/common/interceptors/zod-response.interceptor';
import { ResponsePaginatedPaletteSchema } from './dto/response-paginated-palette.dto';
import { ResponsePaletteSchema } from './dto/response-palette.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator';
import { ResponsePaletteDto } from './dto/response-palette.dto';

@ApiTags('Palettes')
@Controller('palettes')
@ApiBearerAuth('JWT-auth')
export class PaletteController {
  constructor(private readonly paletteService: PaletteService) {}

  @Get()
  @ApiOperation({ summary: 'List all palettes with optional filters' })
  @ApiPaginatedResponse(ResponsePaletteDto)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProcessStatus,
    description: 'Filter by process status',
  })
  @ApiQuery({
    name: 'processId',
    required: false,
    type: String,
    description: 'Filter by process ID',
  })
  @ApiQuery({
    name: 'filename',
    required: false,
    type: String,
    description: 'Filter by filename',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by creation date (start)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by creation date (end)',
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponsePaginatedPaletteSchema))
  findAll(@Query() query: any) {
    return this.paletteService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a palette by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the palette',
    type: ResponsePaletteDto,
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponsePaletteSchema))
  findOne(@Param('id') id: string) {
    return this.paletteService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a palette' })
  @ApiResponse({
    status: 200,
    description: 'Palette deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.paletteService.delete(id);
  }
}
