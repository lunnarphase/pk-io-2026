import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { ExternalService } from './external.service';

const mockHttp = { get: jest.fn() };

const mockConfig = {
  get: jest.fn(),
};

describe('ExternalService', () => {
  let service: ExternalService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ExternalService,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(ExternalService);
  });

  describe('searchRecipes', () => {
    it('throws ServiceUnavailableException when API key missing', async () => {
      mockConfig.get.mockReturnValue(undefined);
      await expect(service.searchRecipes('pizza')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('returns normalized search page on success', async () => {
      mockConfig.get.mockReturnValue('test-key');
      mockHttp.get.mockReturnValue(
        of({
          data: {
            results: [{ id: 1, title: 'Pizza' }],
            offset: 0,
            number: 20,
            totalResults: 1,
          },
        }),
      );

      const page = await service.searchRecipes('pizza', 0);
      expect(page.results).toHaveLength(1);
      expect(page.totalResults).toBe(1);
    });

    it('throws ServiceUnavailableException when upstream fails', async () => {
      mockConfig.get.mockReturnValue('test-key');
      mockHttp.get.mockReturnValue(throwError(() => new Error('network')));

      await expect(service.searchRecipes('pizza')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('fetchRecipeDetail', () => {
    it('throws ServiceUnavailableException when API key missing', async () => {
      mockConfig.get.mockReturnValue(undefined);
      await expect(service.fetchRecipeDetail('42')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('returns recipe detail payload', async () => {
      mockConfig.get.mockReturnValue('test-key');
      mockHttp.get.mockReturnValue(
        of({ data: { id: 42, title: 'Pizza', extendedIngredients: [] } }),
      );

      const detail = await service.fetchRecipeDetail('42');
      expect(detail).toMatchObject({ id: 42, title: 'Pizza' });
    });
  });
});
