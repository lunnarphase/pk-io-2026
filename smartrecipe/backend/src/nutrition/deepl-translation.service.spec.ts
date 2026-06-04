import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { DeeplTranslationService } from './deepl-translation.service';

const mockHttp = { post: jest.fn() };
const mockConfig = { get: jest.fn() };

describe('DeeplTranslationService', () => {
  let service: DeeplTranslationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'DEEPL_API_KEY') return 'test-key:fx';
      return undefined;
    });
    const module = await Test.createTestingModule({
      providers: [
        DeeplTranslationService,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(DeeplTranslationService);
  });

  it('translates PL to EN via DeepL free API', async () => {
    mockHttp.post.mockReturnValue(
      of({
        data: {
          translations: [
            { text: 'wheat flour', detected_source_language: 'PL' },
          ],
        },
      }),
    );

    const result = await service.translatePlToEn('mąka');
    expect(result).toBe('wheat flour');
    expect(mockHttp.post).toHaveBeenCalledWith(
      'https://api-free.deepl.com/v2/translate',
      { text: ['mąka'], source_lang: 'PL', target_lang: 'EN' },
      expect.any(Object),
    );
    const [, , config] = mockHttp.post.mock.calls[0] as [
      string,
      { text: string[]; source_lang: string; target_lang: string },
      { headers: { Authorization: string } },
    ];
    expect(config.headers.Authorization).toBe('DeepL-Auth-Key test-key:fx');
  });

  it('returns null when API key is missing', async () => {
    mockConfig.get.mockImplementation((key: string) =>
      key === 'DEEPL_API_KEY' ? '' : undefined,
    );
    const result = await service.translatePlToEn('mąka');
    expect(result).toBeNull();
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('returns null on API error', async () => {
    mockHttp.post.mockReturnValue(throwError(() => new Error('quota')));
    const result = await service.translatePlToEn('bazylia');
    expect(result).toBeNull();
  });

  it('caches repeated translations', async () => {
    mockHttp.post.mockReturnValue(
      of({ data: { translations: [{ text: 'basil' }] } }),
    );
    await service.translatePlToEn('bazylia');
    await service.translatePlToEn('bazylia');
    expect(mockHttp.post).toHaveBeenCalledTimes(1);
  });
});
