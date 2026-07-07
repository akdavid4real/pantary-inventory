import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPagination } from '../../common/dto/query.dto';
import { normalizeIngredientName, normalizeText, slugify, toTitleCase } from '../../common/utils/string.utils';
import { IngredientsService } from '../ingredients/ingredients.service';
import { CreateRecipeDto, RecipeIngredientInputDto, RecipeQueryDto, UpdateRecipeDto } from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingredientsService: IngredientsService,
  ) {}

  async create(dto: CreateRecipeDto) {
    const ingredientRows = await this.resolveRecipeIngredients(dto.ingredients ?? []);
    const tags = this.normalizeTags(dto.tags ?? []);

    return this.prisma.recipe.create({
      data: {
        name: dto.name,
        slug: slugify(dto.name),
        description: dto.description,
        category: dto.category,
        region: dto.region,
        imageUrl: dto.imageUrl,
        servings: dto.servings ?? 1,
        prepTimeMinutes: dto.prepTimeMinutes ?? 0,
        cookTimeMinutes: dto.cookTimeMinutes ?? 0,
        difficulty: dto.difficulty,
        caloriesPerServing: dto.caloriesPerServing ?? 0,
        proteinPerServing: dto.proteinPerServing ?? 0,
        carbsPerServing: dto.carbsPerServing ?? 0,
        fatPerServing: dto.fatPerServing ?? 0,
        ingredients: { create: ingredientRows },
        steps: {
          create: (dto.steps ?? [])
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((step) => ({
              stepNumber: step.stepNumber,
              instruction: step.instruction,
              durationMinutes: step.durationMinutes,
            })),
        },
        tags: {
          create: tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                where: { slug: slugify(tag) },
                create: { name: toTitleCase(tag), slug: slugify(tag) },
              },
            },
          })),
        },
      },
      include: this.recipeInclude(),
    });
  }

  async findAll(query: RecipeQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Record<string, unknown> = { isPublished: true };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: query.q, mode: 'insensitive' } } } } },
      ];
    }

    if (query.category) where.category = query.category;
    if (query.region) where.region = { contains: query.region, mode: 'insensitive' };

    if (query.ingredient) {
      const ingredient = normalizeIngredientName(query.ingredient);
      where.ingredients = {
        some: {
          ingredient: {
            OR: [
              { name: { contains: ingredient, mode: 'insensitive' } },
              { aliases: { some: { alias: { contains: ingredient, mode: 'insensitive' } } } },
            ],
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: this.recipeInclude(),
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: this.recipeInclude(),
    });
    if (!recipe) throw new NotFoundException('Recipe not found.');
    return recipe;
  }

  async update(id: string, dto: UpdateRecipeDto) {
    await this.findOne(id);

    const ingredientRows = dto.ingredients ? await this.resolveRecipeIngredients(dto.ingredients) : undefined;
    const tags = dto.tags ? this.normalizeTags(dto.tags) : undefined;
    const { ingredients, steps, tags: _tags, ...recipeData } = dto;

    if (recipeData.name) {
      Object.assign(recipeData, { slug: slugify(recipeData.name) });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id },
        data: recipeData,
      });

      if (ingredientRows) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        if (ingredientRows.length) {
          await tx.recipeIngredient.createMany({
            data: ingredientRows.map((row) => ({ recipeId: id, ...row })),
          });
        }
      }

      if (steps) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
        if (steps.length) {
          await tx.recipeStep.createMany({
            data: steps
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step) => ({
                recipeId: id,
                stepNumber: step.stepNumber,
                instruction: step.instruction,
                durationMinutes: step.durationMinutes,
              })),
          });
        }
      }

      if (tags) {
        await tx.recipeTag.deleteMany({ where: { recipeId: id } });
        for (const tag of tags) {
          const savedTag = await tx.tag.upsert({
            where: { slug: slugify(tag) },
            create: { name: toTitleCase(tag), slug: slugify(tag) },
            update: { name: toTitleCase(tag) },
          });
          await tx.recipeTag.create({ data: { recipeId: id, tagId: savedTag.id } });
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.recipe.delete({ where: { id } });
  }

  private async resolveRecipeIngredients(items: RecipeIngredientInputDto[]) {
    const rows = [] as Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
      isOptional: boolean;
      notes?: string;
    }>;

    for (const item of items) {
      if (!item.ingredientId && !item.name) {
        throw new BadRequestException('Each recipe ingredient must have ingredientId or name.');
      }

      const ingredient = item.ingredientId
        ? await this.prisma.ingredient.findUnique({ where: { id: item.ingredientId } })
        : await this.ingredientsService.resolveOrCreate(item.name!, item.unit);

      if (!ingredient) throw new BadRequestException(`Ingredient not found: ${item.ingredientId ?? item.name}`);

      rows.push({
        ingredientId: ingredient.id,
        quantity: item.quantity,
        unit: item.unit,
        isOptional: item.isOptional ?? false,
        notes: item.notes,
      });
    }

    return rows;
  }

  private normalizeTags(tags: string[]) {
    const seen = new Set<string>();
    return tags
      .map((tag) => normalizeText(tag))
      .filter(Boolean)
      .filter((tag) => {
        if (seen.has(tag)) return false;
        seen.add(tag);
        return true;
      });
  }

  private recipeInclude() {
    return {
      ingredients: {
        include: {
          ingredient: {
            include: { aliases: true, nutrition: true },
          },
        },
      },
      steps: { orderBy: { stepNumber: 'asc' as const } },
      tags: { include: { tag: true } },
    };
  }
}
