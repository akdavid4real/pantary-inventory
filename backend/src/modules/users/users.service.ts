import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteOnboardingDto, UpdatePreferencesDto, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
      },
    });
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        phone: dto.phone,
      },
      update: dto,
    });
  }

  updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const data = {
      dietaryPreference: dto.dietaryPreference,
      allergies: dto.allergyList,
      avoidedIngredients: dto.avoidedIngredients,
      calorieGoal: dto.calorieGoal,
      proteinGoal: dto.proteinGoal,
      carbsGoal: dto.carbsGoal,
      fatGoal: dto.fatGoal,
      maxCookingMinutes: dto.maxCookingMinutes,
      preferNigerianMeals: dto.preferNigerianMeals,
      cookingComfort: dto.cookingComfort,
      defaultServings: dto.defaultServings,
    };

    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const ingredientIds = dto.pantryItems.map((item) => item.ingredientId);
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true },
    });
    if (ingredients.length !== new Set(ingredientIds).size) {
      throw new BadRequestException('One or more pantry ingredients are not supported.');
    }

    const existingItems = await this.prisma.pantryItem.findMany({
      where: { userId, ingredientId: { in: ingredientIds } },
      orderBy: { createdAt: 'asc' },
    });
    const existingByKey = new Map(
      existingItems.map((item) => [
        `${item.ingredientId}:${item.unit.trim().toLowerCase()}`,
        item,
      ]),
    );

    const operations = [
      this.prisma.userProfile.upsert({
        where: { userId },
        create: { userId, displayName: dto.displayName },
        update: { displayName: dto.displayName },
      }),
      this.prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          dietaryPreference: dto.dietaryPreference,
          allergies: dto.allergyList ?? [],
          avoidedIngredients: dto.avoidedIngredients ?? [],
          calorieGoal: dto.calorieGoal,
          proteinGoal: dto.proteinGoal,
          carbsGoal: dto.carbsGoal,
          fatGoal: dto.fatGoal,
          maxCookingMinutes: dto.maxCookingMinutes,
          preferNigerianMeals: dto.preferNigerianMeals ?? true,
          cookingComfort: dto.cookingComfort,
          defaultServings: dto.defaultServings,
        },
        update: {
          dietaryPreference: dto.dietaryPreference,
          allergies: dto.allergyList,
          avoidedIngredients: dto.avoidedIngredients,
          calorieGoal: dto.calorieGoal,
          proteinGoal: dto.proteinGoal,
          carbsGoal: dto.carbsGoal,
          fatGoal: dto.fatGoal,
          maxCookingMinutes: dto.maxCookingMinutes,
          preferNigerianMeals: dto.preferNigerianMeals,
          cookingComfort: dto.cookingComfort,
          defaultServings: dto.defaultServings,
        },
      }),
      ...dto.pantryItems.map((item) => {
        const unit = item.unit.trim();
        const existing = existingByKey.get(`${item.ingredientId}:${unit.toLowerCase()}`);
        return existing
          ? this.prisma.pantryItem.update({
              where: { id: existing.id },
              data: { quantity: item.quantity, unit },
            })
          : this.prisma.pantryItem.create({
              data: {
                userId,
                ingredientId: item.ingredientId,
                quantity: item.quantity,
                unit,
              },
            });
      }),
    ];

    await this.prisma.$transaction(operations);

    return this.getMe(userId);
  }
}
