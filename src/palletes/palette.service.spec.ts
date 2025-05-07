import { Test, TestingModule } from '@nestjs/testing';
import { PaletteService } from './palette.service';
import { PrismaService } from '../common/databases/prisma-module/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { StorageService } from 'src/common/databases/storage/storage.service';

describe('PaletteService', () => {
  let service: PaletteService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  const mockPalette = {
    id: 'palette-id',
    processId: 'process-id',
    filename: 'test.jpg',
    format: 'jpg',
    path: 'test/path.jpg',
    width: 800,
    height: 600,
    metadata: {},
    status: 'COMPLETED',
    eggsCount: 10,
    expectedEggs: 12,
    initialTimestamp: new Date(),
    finalTimestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaletteService,
        {
          provide: PrismaService,
          useValue: {
            palette: {
              findFirst: jest.fn().mockResolvedValue(mockPalette),
              findMany: jest.fn().mockResolvedValue([mockPalette]),
              delete: jest.fn().mockResolvedValue(mockPalette),
              update: jest.fn().mockResolvedValue(mockPalette),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            removeFile: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<PaletteService>(PaletteService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a palette if it exists', async () => {
      const result = await service.findOne('palette-id');
      expect(result).toEqual(mockPalette);
    });

    it('should throw NotFoundException if palette does not exist', async () => {
      jest
        .spyOn(prismaService.palette, 'findFirst')
        .mockResolvedValueOnce(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include related data when include parameter is provided', async () => {
      const include = { process: true };
      await service.findOne('palette-id', include);
      expect(prismaService.palette.findFirst).toHaveBeenCalledWith({
        where: { id: 'palette-id' },
        include,
      });
    });
  });

  describe('findByProcessId', () => {
    it('should return all palettes for a process', async () => {
      const result = await service.findByProcessId('process-id');
      expect(result).toEqual([mockPalette]);
      expect(prismaService.palette.findMany).toHaveBeenCalledWith({
        where: { processId: 'process-id' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a palette and its associated file', async () => {
      const result = await service.delete('palette-id');
      expect(result).toEqual({ message: 'Palette deleted successfully' });
      expect(storageService.removeFile).toHaveBeenCalledWith(mockPalette.path);
      expect(prismaService.palette.delete).toHaveBeenCalledWith({
        where: { id: 'palette-id' },
      });
    });

    it('should delete palette from database even if file deletion fails', async () => {
      jest
        .spyOn(storageService, 'removeFile')
        .mockRejectedValueOnce(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.delete('palette-id');

      expect(result).toEqual({ message: 'Palette deleted successfully' });
      expect(consoleSpy).toHaveBeenCalled();
      expect(prismaService.palette.delete).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should update a palette', async () => {
      const updateData = { eggsCount: 15 };
      const result = await service.update('palette-id', updateData);
      expect(result).toEqual(mockPalette);
      expect(prismaService.palette.update).toHaveBeenCalledWith({
        where: { id: 'palette-id' },
        data: updateData,
      });
    });

    it('should throw NotFoundException if palette to update does not exist', async () => {
      jest
        .spyOn(prismaService.palette, 'findFirst')
        .mockResolvedValueOnce(null);
      await expect(
        service.update('non-existent-id', { eggsCount: 15 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
