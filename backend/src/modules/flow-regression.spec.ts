import { BadRequestException } from '@nestjs/common';
import { RecipeModerationStatus, RecipeStatus, ShoppingItemSource, ShoppingItemStatus, ShoppingListStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RecipeMatcherService } from './recipe-matcher/recipe-matcher.service';
import { UsersService } from './users/users.service';
import { ShoppingListService } from './shopping-list/shopping-list.service';
import { CookingModeService } from './cooking-mode/cooking-mode.service';
import { RecipesService } from './recipes/recipes.service';

describe('signup-to-cooking service regressions', () => {
  it('separates ingredient presence from quantity-aware cookability', async () => {
    const prisma = { recipe: { findMany: vi.fn().mockResolvedValue([{ id: 'r1', name: 'Rice', category: 'Main', region: 'NG', imageUrl: null, servings: 2, cookTimeMinutes: 20, prepTimeMinutes: 5, caloriesPerServing: 1, proteinPerServing: 1, carbsPerServing: 1, fatPerServing: 1, tags: [], ingredients: [{ ingredientId: 'i1', quantity: 500, unit: 'g', isOptional: false, ingredient: { id: 'i1', name: 'Rice', aliases: [] } }] }]) } } as any;
    const service = new RecipeMatcherService(prisma);
    const [match] = await service.fromPantryItems([{ ingredientId: 'i1', quantity: 100, unit: 'g', ingredient: { id: 'i1', name: 'Rice', aliases: [] } }]);
    expect(match.ingredientPresencePercentage).toBe(100);
    expect(match.matchPercentage).toBe(0);
    expect(match.canCookNow).toBe(false);
    expect(match.insufficientIngredients).toHaveLength(1);
  });

  it('keeps pending community recipes out of public Explore results', async () => {
    const prisma = {
      recipe: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    } as any;
    const service = new RecipesService(prisma, {} as any, {} as any, {} as any);
    await service.findAll({ page: 1, limit: 20 } as any);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isPublished: true,
        status: RecipeStatus.PUBLISHED,
        moderationStatus: RecipeModerationStatus.APPROVED,
      }),
    }));
  });

  it('uses the active measurement profile when deciding whether a recipe is ready', async () => {
    const conversions = [{ fromUnit: 'cup', toUnit: 'g', multiplier: 200 }, { fromUnit: 'derica', toUnit: 'g', multiplier: 750 }];
    const recipe = { id: 'r-profile', name: 'Rice', category: 'Main', region: 'NG', imageUrl: null, servings: 1, cookTimeMinutes: 20, prepTimeMinutes: 5, caloriesPerServing: 300, proteinPerServing: 5, carbsPerServing: 60, fatPerServing: 2, tags: [], ingredients: [{ ingredientId: 'i1', quantity: 2, unit: 'cup', isOptional: false, ingredient: { id: 'i1', name: 'Rice', aliases: [], conversions } }] };
    const pantryItem = { ingredientId: 'i1', quantity: 0.55, unit: 'derica', ingredient: { id: 'i1', name: 'Rice', aliases: [], conversions } };
    const prisma = {
      pantryItem: { findMany: vi.fn().mockResolvedValue([pantryItem]) },
      recipe: { findMany: vi.fn().mockResolvedValue([recipe]) },
    } as any;
    const profile = { id: 'p1', name: '850 ml derica', dericaMl: 850, cupMl: 250, tablespoonMl: 15, teaspoonMl: 5, overrides: [] } as any;
    const measurementProfiles = {
      active: vi.fn().mockResolvedValue(profile),
      applyProfile: vi.fn().mockReturnValue([{ fromUnit: 'cup', toUnit: 'g', multiplier: 200 }, { fromUnit: 'derica', toUnit: 'g', multiplier: 637.5 }]),
    } as any;
    const [match] = await new RecipeMatcherService(prisma, measurementProfiles).fromPantry('u1');
    expect(measurementProfiles.active).toHaveBeenCalledWith('u1');
    expect(measurementProfiles.applyProfile).toHaveBeenCalledWith('i1', conversions, profile);
    expect(match.canCookNow).toBe(false);
    expect(match.missingIngredients[0].missingQuantity).toBeCloseTo(0.246875, 5);
  });

  it('updates the same pantry row with submitted quantity when onboarding is retried', async () => {
    const prisma = {
      ingredient: { findMany: vi.fn().mockResolvedValue([{ id: 'i1' }]) },
      pantryItem: { findMany: vi.fn().mockResolvedValue([{ id: 'p1', ingredientId: 'i1', unit: 'g', quantity: 1 }]), update: vi.fn().mockReturnValue(Promise.resolve({})), create: vi.fn() },
      userProfile: { upsert: vi.fn().mockReturnValue(Promise.resolve({})) },
      userPreference: { upsert: vi.fn().mockReturnValue(Promise.resolve({})) },
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1' }) },
      $transaction: vi.fn().mockResolvedValue([]),
    } as any;
    const dto = { displayName: 'Ada', allergyList: [], avoidedIngredients: [], preferNigerianMeals: true, pantryItems: [{ ingredientId: 'i1', quantity: 750, unit: 'g' }] } as any;
    const config = { get: vi.fn() } as any;
    await new UsersService(prisma, config).completeOnboarding('u1', dto);
    expect(prisma.pantryItem.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { quantity: 750, unit: 'g' } });
    expect(prisma.pantryItem.create).not.toHaveBeenCalled();
  });

  it('rejects unsupported onboarding ingredients', async () => {
    const prisma = { ingredient: { findMany: vi.fn().mockResolvedValue([]) } } as any;
    const config = { get: vi.fn() } as any;
    await expect(new UsersService(prisma, config).completeOnboarding('u1', { pantryItems: [{ ingredientId: 'bad', quantity: 1, unit: 'g' }] } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('preserves manual and bought generated grocery rows during refresh', async () => {
    const manual = { id: 'm1', source: ShoppingItemSource.MANUAL, ingredientId: null, unit: 'piece' };
    const bought = { id: 'g1', source: ShoppingItemSource.GENERATED, ingredientId: 'i1', unit: 'g', quantity: 500, status: ShoppingItemStatus.BOUGHT };
    const prisma = {
      pantryItem: { findMany: vi.fn().mockResolvedValue([]) },
      shoppingList: { findMany: vi.fn().mockResolvedValue([{ id: 'l1', title: 'List', status: ShoppingListStatus.ACTIVE, items: [manual, bought] }]), update: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn().mockResolvedValue({ id: 'l1', items: [manual, bought] }) },
      shoppingListItem: { update: vi.fn().mockReturnValue(Promise.resolve({})), deleteMany: vi.fn(), createMany: vi.fn() },
      $transaction: vi.fn().mockResolvedValue([]),
    } as any;
    await (new ShoppingListService(prisma) as any).refreshActiveList('u1', [{ ingredientId: 'i1', name: 'Rice', quantity: 400, unit: 'g' }], 'List');
    expect(prisma.shoppingListItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: ShoppingItemStatus.BOUGHT }) }));
  });

  it('subtracts compatible pantry units before creating grocery requirements', async () => {
    const generated = { id: 'g1', source: ShoppingItemSource.GENERATED, ingredientId: 'i1', unit: 'g', quantity: 400, status: ShoppingItemStatus.PENDING };
    const prisma = {
      pantryItem: { findMany: vi.fn().mockResolvedValue([{ ingredientId: 'i1', quantity: 1, unit: 'kg' }]) },
      shoppingList: { findMany: vi.fn().mockResolvedValue([{ id: 'l1', title: 'List', status: ShoppingListStatus.ACTIVE, items: [generated] }]), update: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn().mockResolvedValue({ id: 'l1', items: [] }) },
      shoppingListItem: { update: vi.fn(), deleteMany: vi.fn().mockResolvedValue({ count: 1 }), createMany: vi.fn() },
      $transaction: vi.fn().mockResolvedValue([]),
    } as any;
    await (new ShoppingListService(prisma) as any).refreshActiveList('u1', [{ ingredientId: 'i1', name: 'Rice', quantity: 400, unit: 'g' }], 'List');
    expect(prisma.shoppingListItem.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['g1'] } } });
    expect(prisma.shoppingListItem.createMany).not.toHaveBeenCalled();
  });

  it('deducts pantry stock and writes nutrition when cooking completes', async () => {
    const session = { id: 's1', recipeId: 'r1', servings: 1, currentStep: 1, steps: [{}], recipe: { id: 'r1', name: 'Rice', servings: 1, caloriesPerServing: 300, proteinPerServing: 5, carbsPerServing: 60, fatPerServing: 2, ingredients: [{ ingredientId: 'i1', quantity: 100, unit: 'g', ingredient: { name: 'Rice' } }] } };
    const prisma = {
      pantryItem: { findMany: vi.fn().mockResolvedValue([{ id: 'p1', ingredientId: 'i1', quantity: 0.25, unit: 'kg' }]), update: vi.fn().mockResolvedValue({}) },
      pantryItemLog: { create: vi.fn().mockResolvedValue({}) },
      cookingSessionStep: { updateMany: vi.fn().mockResolvedValue({}) },
      cookingSession: { findFirst: vi.fn().mockResolvedValue(session), update: vi.fn().mockResolvedValue({}) },
      nutritionLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn().mockResolvedValue([]),
    } as any;
    const service = new CookingModeService(prisma);
    vi.spyOn(service, 'getSession').mockResolvedValue({ ...session, status: 'COMPLETED' } as any);
    await service.complete('u1', 's1', { mealType: 'DINNER' } as any);
    expect(prisma.pantryItem.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { quantity: 0.15 } });
    expect(prisma.nutritionLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ calories: 300, source: 'cooking-mode' }) });
  });

  it('transfers the reviewed grocery quantity into a compatible pantry unit', async () => {
    const item = { id: 'g1', ingredientId: 'i1', name: 'Rice', quantity: 1, unit: 'kg', status: ShoppingItemStatus.BOUGHT, ingredient: { conversions: [] } };
    const list = { id: 'l1', title: 'Market list', status: ShoppingListStatus.ACTIVE, items: [item] };
    const prisma: any = {
      pantryItem: { findMany: vi.fn().mockResolvedValue([{ id: 'p1', ingredientId: 'i1', quantity: 1, unit: 'kg', storageLocation: 'PANTRY' }]), update: vi.fn().mockResolvedValue({ id: 'p1' }), create: vi.fn() },
      pantryItemLog: { create: vi.fn().mockResolvedValue({}) },
      shoppingListItem: { update: vi.fn().mockResolvedValue({}) },
      shoppingList: { update: vi.fn().mockResolvedValue({}) },
    };
    prisma.$transaction = vi.fn(async (callback: any) => callback(prisma));
    const service = new ShoppingListService(prisma);
    vi.spyOn(service, 'findOne').mockResolvedValue(list as any);
    await service.complete('u1', 'l1', { purchasedItems: [{ itemId: 'g1', storageLocation: 'PANTRY', purchasedQuantity: 500, purchasedUnit: 'g', totalCostNaira: 1200 }] } as any);
    expect(prisma.pantryItem.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: expect.objectContaining({ quantity: { increment: 0.5 } }) });
    expect(prisma.pantryItemLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ quantity: 500, unit: 'g', estimatedCostNaira: 1200 }) });
    expect(prisma.shoppingListItem.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: expect.objectContaining({ quantity: 500, unit: 'g', totalCostNaira: 1200 }) });
  });

  it('deducts two cups from two derica of rice using ingredient conversions', async () => {
    const conversions = [{ fromUnit: 'cup', toUnit: 'g', multiplier: 200 }, { fromUnit: 'derica', toUnit: 'g', multiplier: 750 }];
    const session = { id: 's2', recipeId: 'r2', servings: 1, currentStep: 1, steps: [{}], recipe: { id: 'r2', name: 'Rice', servings: 1, caloriesPerServing: 300, proteinPerServing: 5, carbsPerServing: 60, fatPerServing: 2, ingredients: [{ ingredientId: 'i1', quantity: 2, unit: 'cup', ingredient: { name: 'Rice', conversions } }] } };
    const prisma = {
      pantryItem: { findMany: vi.fn().mockResolvedValue([{ id: 'p2', ingredientId: 'i1', quantity: 2, unit: 'derica' }]), update: vi.fn().mockResolvedValue({}) },
      pantryItemLog: { create: vi.fn().mockResolvedValue({}) }, cookingSessionStep: { updateMany: vi.fn().mockResolvedValue({}) },
      cookingSession: { findFirst: vi.fn().mockResolvedValue(session), update: vi.fn().mockResolvedValue({}) }, nutritionLog: { create: vi.fn().mockResolvedValue({}) }, $transaction: vi.fn().mockResolvedValue([]),
    } as any;
    const service = new CookingModeService(prisma);
    vi.spyOn(service, 'getSession').mockResolvedValue({ ...session, status: 'COMPLETED' } as any);
    await service.complete('u1', 's2', {} as any);
    expect(prisma.pantryItem.update).toHaveBeenCalledWith({ where: { id: 'p2' }, data: { quantity: 1.466667 } });
    expect(prisma.pantryItemLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ quantity: expect.closeTo(0.533333, 5), unit: 'derica' }) });
  });
});
