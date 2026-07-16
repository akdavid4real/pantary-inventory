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
      if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
      return undefined;
    }),
  } as any;
  return { service: new FoodAnalysisService(prisma, config), prisma, config };
}

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
    vi.spyOn(service as any, 'analyzeWithGemini').mockResolvedValue({
      isFood: true,
      dishName: 'Jollof rice',
      confidence: 'HIGH',
      description: 'A red rice dish with visible vegetables.',
      likelyIngredients: ['Rice', 'Tomato', 'Pepper'],
      servingDescription: 'One plate',
      estimatedNutrition: { calories: 650.26, proteinGrams: 18.04, carbsGrams: 105.8, fatGrams: 17.2 },
      allergenWarnings: [],
      observations: ['Portion size is estimated from the photo.'],
      answer: 'This is likely Nigerian jollof rice.',
    });

    const result = await service.analyze('user-1', {
      contentType: 'image/jpeg',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64'),
      question: 'What is this?',
    });

    expect(result.dishName).toBe('Jollof rice');
    expect(result.estimatedNutrition.calories).toBe(650.3);
    expect(result.disclaimer).toContain('estimates');
  });
});
