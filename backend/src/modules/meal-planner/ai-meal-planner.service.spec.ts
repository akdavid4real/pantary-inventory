import { BadRequestException } from '@nestjs/common';
import { MealType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AiMealPlannerService } from './ai-meal-planner.service';

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    recipeId: '11111111-1111-4111-8111-111111111111',
    recipeName: 'Jollof rice',
    category: 'RICE_MEAL',
    region: 'Nigeria',
    imageUrl: 'https://example.com/jollof.jpg',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    matchPercentage: 80,
    ingredientPresencePercentage: 90,
    canCookNow: false,
    missingIngredients: [{ name: 'Tomato' }],
    presentIngredients: [{ name: 'Rice' }, { name: 'Pepper' }],
    nutrition: {
      caloriesPerServing: 520,
      proteinPerServing: 14,
      carbsPerServing: 82,
      fatPerServing: 15,
    },
    ...overrides,
  };
}

function createService(options: {
  matches?: ReturnType<typeof candidate>[];
  preferences?: Record<string, unknown> | null;
  existing?: Array<{ plannedDate: Date; mealType: MealType }>;
  expiring?: string[];
  recipeIngredients?: Record<string, Array<{ name: string; allergens?: string[] }>>;
  apiKey?: string;
} = {}) {
  const prisma = {
    userPreference: { findUnique: vi.fn().mockResolvedValue(options.preferences ?? null) },
    pantryItem: {
      findMany: vi.fn().mockResolvedValue((options.expiring ?? []).map((name) => ({ ingredient: { name } }))),
    },
    mealPlanEntry: {
      findMany: vi.fn().mockResolvedValue(options.existing ?? []),
      create: vi.fn(),
    },
    recipe: {
      findMany: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(
        Object.entries(options.recipeIngredients ?? {})
          .filter(([id]) => !where?.id?.in || where.id.in.includes(id))
          .map(([id, ingredients]) => ({
            id,
            ingredients: ingredients.map((ingredient) => ({
              ingredient: { name: ingredient.name, allergens: ingredient.allergens ?? [] },
            })),
          })),
      )),
    },
    $transaction: vi.fn(),
  } as any;
  const matcher = {
    fromPantry: vi.fn().mockResolvedValue(options.matches ?? [candidate()]),
  } as any;
  const config = {
    get: vi.fn((key: string) => key === 'GEMINI_API_KEY' ? options.apiKey : undefined),
  } as any;
  return { service: new AiMealPlannerService(prisma, matcher, config), prisma, matcher, config };
}

describe('AiMealPlannerService', () => {
  it('builds a usable PlateSense plan when Gemini is not configured', async () => {
    const { service } = createService();

    const preview = await service.preview('user-1', { weekDate: '2026-07-13', mealCount: 3 });

    expect(preview.source).toBe('PLATESENSE_FALLBACK');
    expect(preview.model).toBeNull();
    expect(preview.entries).toHaveLength(3);
    expect(preview.entries.every((entry) => entry.recipeId === candidate().recipeId)).toBe(true);
    expect(new Set(preview.entries.map((entry) => `${entry.plannedDate}:${entry.mealType}`)).size).toBe(3);
  });

  it('removes allergy matches before a recipe can reach Gemini or the fallback', async () => {
    const unsafe = candidate({
      recipeId: '22222222-2222-4222-8222-222222222222',
      recipeName: 'Groundnut stew',
      presentIngredients: [{ name: 'Rice' }],
      missingIngredients: [],
    });
    const safe = candidate();
    const { service } = createService({
      matches: [unsafe, safe],
      preferences: { allergies: ['groundnut'], avoidedIngredients: [], defaultServings: 4 },
      recipeIngredients: {
        [unsafe.recipeId]: [{ name: 'Rice' }, { name: 'Groundnut oil' }],
        [safe.recipeId]: [{ name: 'Rice' }, { name: 'Pepper' }],
      },
    });

    const preview = await service.preview('user-1', { weekDate: '2026-07-13', mealCount: 1 });

    expect(preview.entries[0].recipeId).toBe(safe.recipeId);
    expect(preview.entries[0].servings).toBe(4);
  });

  it('rejects applying a preview when a meal slot has since been occupied', async () => {
    const plannedDate = '2026-07-13T12:00:00.000Z';
    const { service, prisma } = createService({
      existing: [{ plannedDate: new Date(plannedDate), mealType: MealType.DINNER }],
    });
    prisma.recipe.findMany.mockResolvedValue([{ id: candidate().recipeId }]);

    await expect(service.apply('user-1', {
      entries: [{
        recipeId: candidate().recipeId,
        plannedDate,
        mealType: MealType.DINNER,
        servings: 2,
        reason: 'Strong pantry match.',
      }],
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
