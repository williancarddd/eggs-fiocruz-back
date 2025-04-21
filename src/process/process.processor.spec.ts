import { Test, TestingModule } from '@nestjs/testing';
import { ProcessProcessor } from './process.processor';
import { PrismaService } from '../common/databases/prisma-module/prisma.service';
import { SupabaseService } from '../common/databases/supabase/supabase.service';
import { Job } from 'bull';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProcessProcessor', () => {
  let processor: ProcessProcessor;
  let prismaService: PrismaService;
  let supabaseService: SupabaseService;

  const mockPalette = {
    id: 'palette-id',
    processId: 'process-id',
    process: {
      id: 'process-id',
      userId: 'user-id',
    },
  };

  const mockJob = {
    data: {
      paletteId: 'palette-id',
      buffer: Buffer.from('test-image'),
      filename: 'test.jpg',
    },
  } as Job;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessProcessor,
        {
          provide: PrismaService,
          useValue: {
            palette: {
              update: jest.fn().mockResolvedValue({}),
              findUnique: jest.fn().mockResolvedValue(mockPalette),
            },
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            uploadImage: jest.fn().mockResolvedValue({
              publicUrl: 'https://test.com/image.jpg',
            }),
          },
        },
      ],
    }).compile();

    processor = module.get<ProcessProcessor>(ProcessProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleImageProcessing', () => {
    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({
        data: {
          eggsCount: 10,
          metadata: { confidence: 0.95 },
          width: 800,
          height: 600,
        },
      });
    });

    it('should process image successfully', async () => {
      await processor.handleImageProcessing(mockJob);

      expect(prismaService.palette.update).toHaveBeenCalledWith({
        where: { id: 'palette-id' },
        data: expect.objectContaining({
          status: 'IN_PROGRESS',
          initialTimestamp: expect.any(Date),
        }),
      });

      expect(supabaseService.uploadImage).toHaveBeenCalledWith({
        file: expect.objectContaining({
          buffer: mockJob.data.buffer,
          originalname: mockJob.data.filename,
        }),
        userId: mockPalette.process.userId,
        processExecutionId: mockPalette.id,
      });

      expect(prismaService.palette.update).toHaveBeenCalledWith({
        where: { id: 'palette-id' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          eggsCount: 10,
          path: 'https://test.com/image.jpg',
          metadata: { confidence: 0.95 },
          width: 800,
          height: 600,
        }),
      });
    });

    it('should handle processing failure', async () => {
      const error = new Error('AI processing failed');
      mockedAxios.post.mockRejectedValue(error);

      // Verify initial status update
      await processor.handleImageProcessing(mockJob);

      // Verify the first update sets status to IN_PROGRESS
      expect(prismaService.palette.update).toHaveBeenCalledWith({
        where: { id: 'palette-id' },
        data: expect.objectContaining({
          status: 'IN_PROGRESS',
          initialTimestamp: expect.any(Date),
        }),
      });

      // Verify the final update sets status to FAILED with error details
      expect(prismaService.palette.update).toHaveBeenLastCalledWith({
        where: { id: 'palette-id' },
        data: expect.objectContaining({
          status: 'FAILED',
          finalTimestamp: expect.any(Date),
        }),
      });

      // Verify the number of calls
      expect(prismaService.palette.update).toHaveBeenCalledTimes(2);
    });

    it('should handle palette not found', async () => {
      jest
        .spyOn(prismaService.palette, 'findUnique')
        .mockResolvedValueOnce(null);

      await processor.handleImageProcessing(mockJob);

      expect(prismaService.palette.update).toHaveBeenLastCalledWith({
        where: { id: 'palette-id' },
        data: expect.objectContaining({
          status: 'FAILED',
          metadata: expect.objectContaining({
            error: expect.stringContaining('not found'),
          }),
        }),
      });
    });
  });
});
