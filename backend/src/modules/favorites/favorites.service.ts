import { Injectable, NotFoundException } from '@nestjs/common';
import { RecipeModerationStatus, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const favorites = await this.prisma.recipeFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        recipe: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: true,
            region: true,
            servings: true,
            prepTimeMinutes: true,
            cookTimeMinutes: true,
            difficulty: true,
            caloriesPerServing: true,
            proteinPerServing: true,
            carbsPerServing: true,
            fatPerServing: true,
          },
        },
      },
    });

    return favorites.sort((left, right) =>
      Number(Boolean(right.recipe.imageUrl)) - Number(Boolean(left.recipe.imageUrl)) ||
      right.createdAt.getTime() - left.createdAt.getTime(),
    ).map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt,
      recipe: favorite.recipe,
    }));
  }

  async add(userId: string, recipeId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: recipeId,
        isPublished: true,
        status: RecipeStatus.PUBLISHED,
        moderationStatus: RecipeModerationStatus.APPROVED,
      },
      select: { id: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found.');

    return this.prisma.recipeFavorite.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      create: { userId, recipeId },
      update: {},
    });
  }

  async remove(userId: string, recipeId: string) {
    await this.prisma.recipeFavorite.deleteMany({
      where: { userId, recipeId },
    });
    return { removed: true };
  }
}
