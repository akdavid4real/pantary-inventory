import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeMatcherService } from '../recipe-matcher/recipe-matcher.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeMatcherService: RecipeMatcherService,
  ) {}

  fromPantry(userId: string) {
    return this.recipeMatcherService.fromPantry(userId);
  }

  expiringItems(userId: string) {
    return this.recipeMatcherService.expiringFirst(userId);
  }

  lowBudget() {
    return this.prisma.recipe.findMany({
      where: {
        isPublished: true,
        OR: [
          { tags: { some: { tag: { slug: 'low-budget' } } } },
          { tags: { some: { tag: { slug: 'student-friendly' } } } },
        ],
      },
      include: { tags: { include: { tag: true } } },
      take: 20,
    });
  }

  highProtein() {
    return this.prisma.recipe.findMany({
      where: { isPublished: true },
      orderBy: { proteinPerServing: 'desc' },
      include: { tags: { include: { tag: true } } },
      take: 20,
    });
  }

  async quickMeals(maxMinutes = 35) {
    const recipes = await this.prisma.recipe.findMany({
      where: { isPublished: true },
      include: { tags: { include: { tag: true } } },
    });

    return recipes
      .filter((recipe) => recipe.prepTimeMinutes + recipe.cookTimeMinutes <= maxMinutes)
      .sort((a, b) => a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes))
      .slice(0, 20);
  }
}
