import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FoodAnalysisService } from './food-analysis.service';

function createService(apiKey?: string) {
  const prisma = {
    userPreference: { findUnique: vi.fn().mockResolvedValue(null) },
  } as any;
  const config = {
    get: vi.fn((key: string) => {
      if (key === 'GEMINI_API_KEY') return apiKey;
      if (key === 'GEMINI_MODEL') return 'gemini-3.5-flash';
      return undefined;
    }),
  } as any;
  return { service: new FoodAnalysisService(prisma, config), prisma, config };
}

const sampleAnalysis = {
  isFood: true,
  dishName: 'Jollof rice',
  confidence: 'HIGH' as const,
  description: 'A red rice dish with visible vegetables.',
  likelyIngredients: ['Rice', 'Tomato', 'Pepper'],
  servingDescription: 'One plate',
  estimatedNutrition: { calories: 650.26, proteinGrams: 18.04, carbsGrams: 105.8, fatGrams: 17.2 },
  allergenWarnings: [] as string[],
  observations: ['Portion size is estimated from the photo.'],
  answer: 'This is likely Nigerian jollof rice.',
};

describe('FoodAnalysisService', () => {
  it('returns a clear configuration error without exposing a fake analysis', async () => {
    const { service } = createService();
    await expect(service.analyze('user-1', {
      contentType: 'image/jpeg',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64'),
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects bytes that do not match the declared image type', async () => {
    const { service } = createService('test-key');
    await expect(service.analyze('user-1', {
      contentType: 'image/png',
      base64: Buffer.from('not-a-png').toString('base64'),
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes Gemini nutrition values and includes the estimate disclaimer', async () => {
    const { service } = createService('test-key');
    vi.spyOn(service as any, 'analyzeWithGemini').mockResolvedValue(sampleAnalysis);

    const result = await service.analyze('user-1', {
      contentType: 'image/jpeg',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64'),
      question: 'What is this?',
    });

    expect(result.dishName).toBe('Jollof rice');
    expect(result.estimatedNutrition.calories).toBe(650.3);
    expect(result.model).toBe('gemini-3.5-flash');
    expect(result.disclaimer).toContain('estimates');
  });

  it('falls back to a lighter model when the primary model fails', async () => {
    const { service } = createService('test-key');
    const analyze = vi.spyOn(service as any, 'analyzeWithGemini')
      .mockRejectedValueOnce(new Error('primary timed out'))
      .mockResolvedValueOnce(sampleAnalysis);

    const result = await service.analyze('user-1', {
      contentType: 'image/jpeg',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64'),
    });

    expect(analyze).toHaveBeenCalledTimes(2);
    expect(analyze.mock.calls[0][0].model).toBe('gemini-3.5-flash');
    expect(analyze.mock.calls[1][0].model).toBe('gemini-3.1-flash-lite');
    expect(result.model).toBe('gemini-3.1-flash-lite');
    expect(result.dishName).toBe('Jollof rice');
  });
});
