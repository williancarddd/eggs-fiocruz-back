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
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProcessService } from './process.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProcessExecutionService } from './process-execution.service';
import { SupabaseService } from 'src/common/databases/supabase/supabase.service';
import { EggsCountService } from 'src/eggs-count/eggs-count.service';
import { FindAllQueryDto } from './dto/findall-query.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator';
import { Algorithms } from 'src/utils/algorithms';
import { ProcessDto } from './dto/process.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateProcessWithProcessExecutionDto } from './dto/response-api-ai.dto';
import { CreateProcessExecutionDto, ProcessExecutionsDto } from './dto/process-execution.dto';

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
        processId: { type: 'string', format: 'uuid', description: 'ID of the process to be re-calculated' },
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
    type: CreateProcessWithProcessExecutionDto,
    description: 'Process created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid or missing data' })
  async create(
    @Body() receivedApiDataDto: {
      processId: string;
      description: string;
      userId: string;
      algorithm: Algorithms;
      expectedEggs: number;
    },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreateProcessWithProcessExecutionDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }



    // Analyze the uploaded image for egg count

    const eggsCountResponse = await this.eggsCountService.create({
      image: file.buffer,
      algorithm: receivedApiDataDto.algorithm,
    });

    // Upload the image to Supabase
    const processId = receivedApiDataDto.processId ? receivedApiDataDto.processId : uuidv4();
    const processExecutionId = uuidv4();

    const uploadedImage = await this.supabaseService.uploadImage(
      file,
      receivedApiDataDto.userId,
      processExecutionId,
    );

    if (!uploadedImage || !uploadedImage.publicUrl) {
      throw new HttpException(
        'Failed to upload image to Supabase',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // If image analysis is successful, proceed with process creation
    const createdProcess = await this.processService.createProcess(
      {
        id: processId,
        description: 'Podem ser submetidas várias execuções para mesma imagem nesse processo',
        userId: receivedApiDataDto.userId,
        processExecution:
        {
          id: processExecutionId,
          expectedEggs: Number(receivedApiDataDto.expectedEggs) || 0,
          algorithm: receivedApiDataDto.algorithm,
          description: receivedApiDataDto.description,
        },
      }
    );



    const updatedProcessExecution = await this.processExecution.updateExecution(processExecutionId, {
      resultPath: uploadedImage.publicUrl,
      metadata: JSON.stringify(eggsCountResponse, null, 2),
      eggsCount: eggsCountResponse!.total_objects,
      status: 'COMPLETED',
      initialTimestamp: new Date(eggsCountResponse!.initial_time * 1000).toISOString(),
      finalTimestamp: new Date(eggsCountResponse!.final_time * 1000).toISOString(),
    });

    // @ts-ignore
    delete createdProcess.processExecution;

    return {
      process: {
        description: createdProcess.process.description || '',
        id: createdProcess.process.id,
        userId: createdProcess.process.userId,
        createdAt: new Date(createdProcess.process.createdAt).toISOString(),
        updatedAt: new Date(createdProcess.process.updatedAt).toISOString(),
      },
      processExecution: {
        description: updatedProcessExecution.description || '',
        id: updatedProcessExecution.id,
        processId: updatedProcessExecution.processId,
        resultPath: updatedProcessExecution.resultPath,
        status: updatedProcessExecution.status,
        eggsCount: updatedProcessExecution.eggsCount,
        initialTimestamp: updatedProcessExecution.initialTimestamp,
        finalTimestamp: updatedProcessExecution.finalTimestamp,
      },
      metadata: {
        total_objects: eggsCountResponse!.total_objects,
        processed_squares: eggsCountResponse!.processed_squares,
        image_dimensions: eggsCountResponse!.image_dimensions,
        used_square_size: eggsCountResponse!.used_square_size,
        initial_time: eggsCountResponse!.initial_time,
        final_time: eggsCountResponse!.final_time,
      }
    };


  }


  @Get()
  @ApiOperation({ summary: 'List all processes', operationId: 'findAllProcesses' })
  @ApiPaginatedResponse(ProcessDto)
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'perPage', type: 'number', required: false })
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


  @Get('/submission/:id')
  @ApiOperation({ summary: 'Find a process execution by ID', operationId: 'findProcessExecutionById' })
  @ApiParam({
    name: 'id',
    description: 'ID of the process to be retrieved',
    type: String,
  })
  @ApiOkResponse({ type: ProcessExecutionsDto })
  @ApiNotFoundResponse({ description: 'Processo não encontrado' })
  findProcessExecution(@Param('id') id: string) {
    return this.processExecution.getExecution(id);
  }

}
