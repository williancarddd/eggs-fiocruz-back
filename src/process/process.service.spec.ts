import { Test, TestingModule } from '@nestjs/testing';
import { ProcessService } from './process.service';
import { PrismaService } from '../common/databases/prisma-module/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { FileUploadService } from './services/file-upload.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PassThrough } from 'stream';

describe('ProcessService', () => {
  let service: ProcessService;
  let prismaService: PrismaService;
  let tenantService: TenantService;
  let fileUploadService: FileUploadService;

  const mockProcess = {
    id: 'test-id',
    userId: 'test-user-id',
    description: 'Test process',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessService,
        {
          provide: PrismaService,
          useValue: {
            process: {
              create: jest.fn().mockResolvedValue(mockProcess),
              findFirst: jest.fn().mockResolvedValue(mockProcess),
              update: jest.fn().mockResolvedValue(mockProcess),
              delete: jest.fn().mockResolvedValue(mockProcess),
            },
            palette: {
              count: jest.fn().mockResolvedValue(0),
            },
          },
        },
        {
          provide: TenantService,
          useValue: {
            userId: 'test-user-id',
          },
        },
        {
          provide: FileUploadService,
          useValue: {
            handleFileUploads: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<ProcessService>(ProcessService);
    prismaService = module.get<PrismaService>(PrismaService);
    tenantService = module.get<TenantService>(TenantService);
    fileUploadService = module.get<FileUploadService>(FileUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a process without files', async () => {
      const createDto = { description: 'Test process' };
      const result = await service.create(createDto);
      expect(result).toEqual(mockProcess);
      expect(prismaService.process.create).toHaveBeenCalledWith({
        data: {
          userId: tenantService.userId,
          description: createDto.description,
        },
      });
    });

    it('should create a process with files', async () => {
      const mockFile = {
        fieldname: 'files',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      };
      const createDto = {
        description: 'Test process',
        files: [mockFile],
      };

      const result = await service.create(createDto);
      expect(result).toEqual(mockProcess);
      expect(fileUploadService.handleFileUploads).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a process if it exists', async () => {
      const result = await service.findOne('test-id');
      expect(result).toEqual(mockProcess);
    });

    it('should throw NotFoundException if process does not exist', async () => {
      jest
        .spyOn(prismaService.process, 'findFirst')
        .mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a process', async () => {
      const updateDto = { description: 'Updated description' };
      const result = await service.update('test-id', updateDto);
      expect(result).toEqual(mockProcess);
      expect(prismaService.process.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a process if it has no palettes', async () => {
      const result = await service.remove('test-id');
      expect(result).toEqual({ message: 'Process deleted successfully' });
    });

    it('should throw BadRequestException if process has palettes', async () => {
      jest.spyOn(prismaService.palette, 'count').mockResolvedValueOnce(1);
      await expect(service.remove('test-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addImages', () => {
    it('should add images to an existing process', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from('test'),
          stream: new PassThrough(),
          destination: '/tmp',
          filename: 'test.jpg',
          path: '/tmp/test.jpg',
        },
      ] as Express.Multer.File[];

      const result = await service.addImages('test-id', mockFiles);
      expect(result).toEqual(mockProcess);
      expect(fileUploadService.handleFileUploads).toHaveBeenCalledWith(
        'test-id',
        mockFiles,
      );
    });
  });
});
