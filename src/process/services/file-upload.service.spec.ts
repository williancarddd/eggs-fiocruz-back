import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import { PrismaService } from '../../common/databases/prisma-module/prisma.service';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let prismaService: PrismaService;
  let imageProcessingQueue: Queue;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: Readable.from(Buffer.from('test')),
    destination: '',
    filename: 'test.jpg',
    path: '',
  };

  const mockPalette = {
    id: 'palette-id',
    processId: 'process-id',
    filename: 'test.jpg',
    format: 'jpg',
    status: 'PENDING',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: PrismaService,
          useValue: {
            palette: {
              create: jest.fn().mockResolvedValue(mockPalette),
            },
          },
        },
        {
          provide: getQueueToken('image-processing'),
          useValue: {
            add: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    prismaService = module.get<PrismaService>(PrismaService);
    imageProcessingQueue = module.get<Queue>(getQueueToken('image-processing'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleFileUploads', () => {
    it('should process multiple files successfully', async () => {
      const files = [mockFile, { ...mockFile, originalname: 'test2.jpg' }];
      const processId = 'process-id';

      await service.handleFileUploads(processId, files);

      expect(prismaService.palette.create).toHaveBeenCalledTimes(2);
      expect(imageProcessingQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should create palette records with correct data', async () => {
      await service.handleFileUploads('process-id', [mockFile]);

      expect(prismaService.palette.create).toHaveBeenCalledWith({
        data: {
          processId: 'process-id',
          filename: 'test.jpg',
          format: 'image/jpeg',
          status: 'PENDING',
          path: '',
        },
      });
    });

    it('should add files to image processing queue', async () => {
      await service.handleFileUploads('process-id', [mockFile]);

      expect(imageProcessingQueue.add).toHaveBeenCalledWith(
        'process-image',
        expect.objectContaining({
          paletteId: mockPalette.id,
          buffer: mockFile.buffer,
          filename: mockFile.originalname,
        }),
      );
    });

    it('should throw BadRequestException for unsupported file types', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
        originalname: 'test.pdf',
      };

      await expect(
        service.handleFileUploads('process-id', [invalidFile]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle empty file array', async () => {
      const result = await service.handleFileUploads('process-id', []);
      expect(result).toEqual([]);
      expect(prismaService.palette.create).not.toHaveBeenCalled();
      expect(imageProcessingQueue.add).not.toHaveBeenCalled();
    });

    it('should extract format from filename correctly', async () => {
      const pngFile = {
        ...mockFile,
        originalname: 'test.png',
        mimetype: 'image/png',
      };
      await service.handleFileUploads('process-id', [pngFile]);

      expect(prismaService.palette.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            format: 'image/png',
          }),
        }),
      );
    });
  });
});
