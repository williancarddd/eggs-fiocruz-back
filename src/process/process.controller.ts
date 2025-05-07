import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ZodResponseInterceptor } from 'src/common/interceptors/zod-response.interceptor';
import {
  ResponsePaginatedProcessDto,
  ResponsePaginatedProcessSchema,
} from './dto/response-paginated-process.dto';
import {
  ResponseProcessDto,
  ResponseProcessSchema,
} from './dto/response-process.dto';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

@ApiTags('Process')
@Controller('process')
@ApiBearerAuth('JWT-auth')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new process with optional images',
    description:
      'Creates a new process and optionally uploads associated images. Images will be processed for egg counting.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Optional description of the process',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Image files to be processed (max 100 files, 200MB each)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Process created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        description: { type: 'string', nullable: true },
        userId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or file too large',
  })
  @ApiResponse({
    status: 422,
    description: 'File validation failed - size exceeds 200MB',
  })
  @UseInterceptors(FilesInterceptor('files', 100))
  @UseInterceptors(new ZodResponseInterceptor(ResponseProcessSchema))
  async create(
    @Body() createProcessDto: CreateProcessDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_FILE_SIZE,
          message: 'File size must be less than 200MB',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Express.Multer.File[],
  ) {
    return this.processService.create({
      ...createProcessDto,
      files: files.map((file) => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        buffer: Buffer.from(file.buffer),
      })),
    });
  }

  @Post(':id/images')
  @ApiOperation({
    summary: 'Add images to an existing process',
    description:
      'Upload additional images to be processed for an existing process. Images will be analyzed for egg counting.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Image files to be processed (max 100 files, 200MB each)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Images added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        description: { type: 'string', nullable: true },
        userId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or file too large',
  })
  @ApiResponse({
    status: 422,
    description: 'File validation failed - size exceeds 200MB',
  })
  @UseInterceptors(FilesInterceptor('files', 100))
  async addImages(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_FILE_SIZE,
          message: 'File size must be less than 200MB',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Express.Multer.File[],
  ) {
    return this.processService.addImages(id, files);
  }

  @Get()
  @ApiOperation({ summary: 'List all processes with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of processes',
    type: ResponsePaginatedProcessDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: 'string',
    description: 'Filter by process description',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    description: 'Filter by creation date (start)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    description: 'Filter by creation date (end)',
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponsePaginatedProcessSchema))
  findAll(@Query() filters: any) {
    return this.processService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a process by ID' })
  @ApiResponse({
    status: 200,
    description: 'Process details',
    type: ResponseProcessDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Process details',
    type: ResponseProcessDto,
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponseProcessSchema))
  findOne(@Param('id') id: string) {
    return this.processService.findOne(id, {
      palettes: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a process' })
  @UseInterceptors(new ZodResponseInterceptor(ResponseProcessSchema))
  update(@Param('id') id: string, @Body() updateProcessDto: UpdateProcessDto) {
    return this.processService.update(id, updateProcessDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a process' })
  @ApiResponse({
    status: 400,
    description: 'Process has palettes that need to be deleted first',
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponseProcessSchema))
  remove(@Param('id') id: string) {
    return this.processService.remove(id);
  }
}
