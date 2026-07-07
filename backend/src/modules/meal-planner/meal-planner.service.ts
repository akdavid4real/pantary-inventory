import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from '../../common/utils/date.utils';
import { CreateMealPlanEntryDto, UpdateMealPlanEntryDto } from './dto/meal-planner.dto';

@Injectable()
export class MealPlannerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMealPlanEntryDto) {
    if (!dto.recipeId && !dto.externalRecipeId) {
      throw new BadRequestException('Meal plan entry requires recipeId or externalRecipeId.');
    }

    if (dto.recipeId) {
      const recipe = await this.prisma.recipe.findUnique({ where: { id: dto.recipeId } });
      if (!recipe) throw new NotFoundException('Recipe not found.');
    }

    return this.prisma.mealPlanEntry.create({
      data: {
        userId,
        recipeId: dto.recipeId,
        recipeSource: dto.recipeSource,
        externalRecipeId: dto.externalRecipeId,
        externalTitle: dto.externalTitle,
        externalImageUrl: dto.externalImageUrl,
        plannedDate: new Date(dto.plannedDate),
        mealType: dto.mealType,
        servings: dto.servings ?? 1,
        notes: dto.notes,
      },
      include: { recipe: true },
    });
  }

  findWeek(userId: string, date?: string) {
    const selectedDate = date ? new Date(date) : new Date();
    return this.prisma.mealPlanEntry.findMany({
      where: {
        userId,
        plannedDate: {
          gte: startOfWeek(selectedDate),
          lte: endOfWeek(selectedDate),
        },
      },
      orderBy: [{ plannedDate: 'asc' }, { mealType: 'asc' }],
      include: { recipe: { include: { tags: { include: { tag: true } } } } },
    });
  }

  findDay(userId: string, date: string) {
    const selectedDate = new Date(date);
    return this.prisma.mealPlanEntry.findMany({
      where: {
        userId,
        plannedDate: {
          gte: startOfDay(selectedDate),
          lte: endOfDay(selectedDate),
        },
      },
      orderBy: { mealType: 'asc' },
      include: { recipe: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateMealPlanEntryDto) {
    await this.findOne(userId, id);
    return this.prisma.mealPlanEntry.update({
      where: { id },
      data: {
        recipeId: dto.recipeId,
        recipeSource: dto.recipeSource,
        externalRecipeId: dto.externalRecipeId,
        externalTitle: dto.externalTitle,
        externalImageUrl: dto.externalImageUrl,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        mealType: dto.mealType,
        servings: dto.servings,
        notes: dto.notes,
      },
      include: { recipe: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.mealPlanEntry.delete({ where: { id } });
  }

  async findOne(userId: string, id: string) {
    const entry = await this.prisma.mealPlanEntry.findFirst({
      where: { id, userId },
      include: { recipe: true },
    });
    if (!entry) throw new NotFoundException('Meal plan entry not found.');
    return entry;
  }
}
