import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpException,
  HttpStatus,
  Query,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiOkResponse,
  ApiResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProcessService } from './process.service';
import { CreateProcessDto, CreateProcessSchema } from './dto/create-process.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProcessExecutionService } from './process-execution.service';
import { SupabaseService } from 'src/common/databases/supabase/supabase.service';
import { Readable } from 'stream';
import { EggsCountService } from 'src/eggs-count/eggs-count.service';
import { ResponseCreatedProcessDto } from './dto/response-create-process.dto';
import { CreateProcessExecutionDto, CreateProcessExecutionSchema } from './dto/create-process-execution.dto';
import { FindAllQueryDto } from './dto/findall-query.dto';
import { ProcessDto } from './entities/process.entity';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator';
import { ProcessExecutionsSchema } from './entities/process-executions.entity';
import { Algorithms } from 'src/utils/algorithms';

@ApiTags('process')
@Controller('fiocruz/process')
export class ProcessController {
  constructor(
    private readonly processService: ProcessService,
    private readonly processExecution: ProcessExecutionService,
    private readonly supabaseService: SupabaseService,
    private readonly eggsCountService: EggsCountService,
  ) { }

  @ApiOperation({ summary: 'Create a new process with execution', operationId: 'createProcess' })
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Description of the process' },
        userId: { type: 'string', format: 'uuid', description: 'ID of the user initiating the process' },
        image: { type: 'string', format: 'binary', description: 'The image file to be uploaded' },
        algorithm: { type: 'string', enum: Object.values(Algorithms), description: 'Algorithm to be used' },
        expectedEggs: { type: 'number', description: 'Expected egg count' },

      },
    },
    description: 'Process data',
  })
  @UseInterceptors(FileInterceptor('image'))
  @ApiCreatedResponse({
    type: ResponseCreatedProcessDto,
    description: 'Process created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid or missing data' })
  async create(
    @Body() createProcessDto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    createProcessDto.processExecution = {
      algorithm: createProcessDto.algorithm,
    };

    delete createProcessDto.algorithm;


    // Validate using Zod
    const parsedCreateProcessDto = CreateProcessSchema.parse({ ...createProcessDto, resultPath: '' });

    // Upload the image to Supabase
    const uploadedImage = await this.supabaseService.uploadImage(
      file,
      parsedCreateProcessDto.userId,
      'process-images',
    );

    if (!uploadedImage || !uploadedImage.publicUrl) {
      throw new HttpException('Failed to upload image to Supabase', HttpStatus.BAD_GATEWAY);
    }

    // Add the uploaded image path to the parsed DTO
    parsedCreateProcessDto.resultPath = uploadedImage.publicUrl;

    // Save the process and associated execution in the database
    const process = await this.processService.createProcess(parsedCreateProcessDto);

    // Analyze the uploaded image for egg count
    const imageStream = Readable.from(file.buffer);
    const eggsCountResponse = await this.eggsCountService.create({ image: imageStream, algorithm: parsedCreateProcessDto.processExecution.algorithm });

    // Update the process execution with the results
    const latestExecutionId = process.results[0]?.id; // Assuming the first result is the latest
    if (latestExecutionId) {
      await this.processExecution.updateExecution(latestExecutionId, {
        status: 'COMPLETED',
        eggsCount: eggsCountResponse!.total_eggs,
      });
    }

    // Retrieve the process with its updated executions
    const updatedProcess = await this.processService.findOne(process.id, 1);

    return {
      process: updatedProcess,
      eggsCountResponseAI: eggsCountResponse,
    };

  }



  @Post("/process-execution")
  @ApiOperation({ summary: 'Re-calculate a process', operationId: 'createProcessExecution' })
  @ApiBody({ type: CreateProcessExecutionDto })
  @ApiBadRequestResponse({ description: 'Invalid or missing data' })
  async createProcessExecution(
    @Body() createProcessExecutionDto: CreateProcessExecutionDto,
  ) {
    // Validate using Zod
    const parsedCreateProcessExecutionDto = CreateProcessExecutionSchema.parse(createProcessExecutionDto);

    const process = await this.processService.findOne(parsedCreateProcessExecutionDto.processId);

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    const urlWithImage = process.resultPath;

    // download image from url
    const imageDownloaded = await this.supabaseService.downloadImage(urlWithImage!);

    // Analyze the uploaded image for egg count
    const imageStream = Readable.from(Buffer.from(await imageDownloaded.arrayBuffer()));
    const eggsCountResponse = await this.eggsCountService.create({ image: imageStream, algorithm: parsedCreateProcessExecutionDto.algorithm });

    // Save the process execution in the database
    const processExecution = await this.processExecution.createExecution(parsedCreateProcessExecutionDto);
    const updatedProcess = await this.processService.findOne(process.id, 1);
    return {
      process: updatedProcess,
      eggsCountResponseAI: eggsCountResponse,
    };

  }

  @Get()
  @ApiOperation({ summary: 'List all processes', operationId: 'findAllProcesses' })
  @ApiPaginatedResponse(ProcessDto)
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false })
  @ApiQuery({ name: 'userId', type: 'string', required: false })
  @ApiBadRequestResponse({ description: 'Parâmetros de paginação inválidos' })
  findAll(@Query() query: FindAllQueryDto) {
    return this.processService.findAll(query);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Find a process by ID', operationId: 'findProcessById' })
  @ApiParam({
    name: 'id',
    description: 'ID of the process to be retrieved',
    type: String,
  })
  @ApiOkResponse({ type: ProcessDto })
  @ApiNotFoundResponse({ description: 'Processo não encontrado' })
  findOne(@Param('id') id: string) {
    return this.processService.findOne(id);
  }

}
