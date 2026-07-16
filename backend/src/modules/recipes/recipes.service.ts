import { BadGatewayException, BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RecipeModerationStatus, RecipeReportStatus, RecipeStatus, UserRole } from '@prisma/client';
import { EnvironmentService } from '../../common/config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getPagination } from '../../common/dto/query.dto';
import { normalizeIngredientName, normalizeText, slugify, toTitleCase } from '../../common/utils/string.utils';
import { IngredientsService } from '../ingredients/ingredients.service';
import { CreateRecipeDto, ModerateRecipeDto, RecipeIngredientInputDto, RecipeQueryDto, ReportRecipeDto, ResolveRecipeReportDto, UpdateRecipeDto, UploadRecipeImageDto } from './dto/recipe.dto';
import { RequestUser } from '../../common/types/request-user';
import { convertIngredientQuantity } from '../../common/utils/unit.utils';
import { MeasurementProfilesService } from '../measurement-profiles/measurement-profiles.service';

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingredientsService: IngredientsService,
    private readonly config: EnvironmentService,
    private readonly measurementProfiles: MeasurementProfilesService,
  ) {}

  async create(userId: string, dto: CreateRecipeDto) {
    const tags = this.normalizeTags(dto.tags ?? []);
    const status = dto.status ?? RecipeStatus.DRAFT;
    const [ingredientRows, slug, savedTags] = await Promise.all([
      this.resolveRecipeIngredients(dto.ingredients ?? []),
      this.uniqueSlug(dto.name),
      this.ensureTags(tags),
    ]);
    const nutrition = ingredientRows.length
      ? await this.calculateNutrition(ingredientRows, dto.servings ?? 1, userId)
      : this.emptyNutrition();
    if (status === RecipeStatus.PUBLISHED && nutrition.caloriesPerServing <= 0) {
      throw new BadRequestException('Published recipes must have validated nutrition above zero calories.');
    }
    const recipe = await this.prisma.recipe.create({
      data: {
        name: dto.name,
        slug,
        createdByUserId: userId,
        description: dto.description,
        category: dto.category,
        region: dto.region,
        imageUrl: dto.imageUrl,
        servings: dto.servings ?? 1,
        prepTimeMinutes: dto.prepTimeMinutes ?? 0,
        cookTimeMinutes: dto.cookTimeMinutes ?? 0,
        difficulty: dto.difficulty,
        ...nutrition,
        status,
        isPublished: status === RecipeStatus.PUBLISHED,
        moderationStatus: RecipeModerationStatus.PENDING,
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
          create: savedTags.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: this.recipeInclude(),
    });
    return recipe;
  }

  async findAll(query: RecipeQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: any = {
      isPublished: true,
      status: RecipeStatus.PUBLISHED,
      moderationStatus: RecipeModerationStatus.APPROVED,
    };

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
        orderBy: [
          { imageUrl: { sort: 'desc', nulls: 'last' } },
          { name: 'asc' },
        ],
        select: this.recipeListSelect(),
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

  async findMine(userId: string) {
    return this.prisma.recipe.findMany({
      where: { createdByUserId: userId },
      orderBy: { updatedAt: 'desc' },
      include: { ...this.recipeInclude(), _count: { select: { reports: true } } },
    });
  }

  async update(user: RequestUser, id: string, dto: UpdateRecipeDto) {
    const current = await this.findOne(id);
    this.assertCanManage(user, current.createdByUserId);

    const tags = dto.tags ? this.normalizeTags(dto.tags) : undefined;
    const [ingredientRows, slug, savedTags] = await Promise.all([
      dto.ingredients ? this.resolveRecipeIngredients(dto.ingredients) : Promise.resolve(undefined),
      dto.name ? this.uniqueSlug(dto.name, id) : Promise.resolve(undefined),
      tags ? this.ensureTags(tags) : Promise.resolve(undefined),
    ]);
    const { ingredients, steps, tags: _tags, ...rest } = dto;
    const recipeData: any = { ...rest };
    const effectiveIngredientRows = ingredientRows ?? current.ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
      isOptional: item.isOptional,
      notes: item.notes ?? undefined,
    }));
    const shouldRecalculateNutrition = dto.ingredients !== undefined || dto.servings !== undefined;
    const nutrition = shouldRecalculateNutrition
      ? (effectiveIngredientRows.length
          ? await this.calculateNutrition(effectiveIngredientRows, dto.servings ?? current.servings, user.id)
          : this.emptyNutrition())
      : {
          caloriesPerServing: current.caloriesPerServing,
          proteinPerServing: current.proteinPerServing,
          carbsPerServing: current.carbsPerServing,
          fatPerServing: current.fatPerServing,
        };
    if (shouldRecalculateNutrition) Object.assign(recipeData, nutrition);

    if (dto.status) {
      recipeData.isPublished = dto.status === RecipeStatus.PUBLISHED;
      if (dto.status === RecipeStatus.PUBLISHED && current.moderationStatus === RecipeModerationStatus.REJECTED) {
        recipeData.moderationStatus = RecipeModerationStatus.PENDING;
        recipeData.moderationNote = null;
      }
    }

    if (slug) recipeData.slug = slug;

    if (dto.status === RecipeStatus.PUBLISHED && nutrition.caloriesPerServing <= 0) {
      throw new BadRequestException('Published recipes must have validated nutrition above zero calories.');
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

      if (savedTags) {
        await tx.recipeTag.deleteMany({ where: { recipeId: id } });
        if (savedTags.length) {
          await tx.recipeTag.createMany({ data: savedTags.map((tag) => ({ recipeId: id, tagId: tag.id })) });
        }
      }
    });

    const checked = await this.findOne(id);
    if (dto.status === RecipeStatus.PUBLISHED && checked.caloriesPerServing <= 0) {
      throw new BadRequestException('Published recipes must have validated nutrition above zero calories.');
    }
    return checked;
  }

  async remove(user: RequestUser, id: string) {
    const current = await this.findOne(id);
    this.assertCanManage(user, current.createdByUserId);
    return this.prisma.recipe.delete({ where: { id } });
  }

  async report(userId: string, recipeId: string, dto: ReportRecipeDto) {
    const recipe = await this.findOne(recipeId);
    if (recipe.createdByUserId === userId) throw new BadRequestException('You cannot report your own recipe.');
    try {
      return await this.prisma.recipeReport.create({ data: { userId, recipeId, reason: dto.reason.trim(), details: dto.details?.trim() } });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('You already reported this recipe.');
      throw error;
    }
  }

  moderationQueue() {
    return this.prisma.recipe.findMany({
      where: { OR: [{ moderationStatus: RecipeModerationStatus.PENDING }, { reports: { some: { status: RecipeReportStatus.OPEN } } }] },
      orderBy: { updatedAt: 'asc' },
      include: { ...this.recipeInclude(), reports: { where: { status: RecipeReportStatus.OPEN }, include: { user: { select: { id: true, email: true } } } } },
    });
  }

  async moderate(adminUserId: string, id: string, dto: ModerateRecipeDto) {
    await this.findOne(id);
    return this.prisma.recipe.update({
      where: { id },
      data: {
        moderationStatus: dto.moderationStatus,
        moderationNote: dto.moderationNote,
        moderatedAt: new Date(),
        moderatedByUserId: adminUserId,
        isPublished: dto.moderationStatus === RecipeModerationStatus.REJECTED ? false : undefined,
      },
      include: this.recipeInclude(),
    });
  }

  async resolveReport(reportId: string, dto: ResolveRecipeReportDto) {
    const report = await this.prisma.recipeReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Recipe report not found.');
    return this.prisma.recipeReport.update({
      where: { id: reportId },
      data: { status: dto.status, resolvedAt: dto.status === RecipeReportStatus.OPEN ? null : new Date() },
    });
  }

  async uploadImage(userId: string, dto: UploadRecipeImageDto, authorization?: string) {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(dto.contentType)) throw new BadRequestException('Recipe photos must be JPEG, PNG, or WebP.');
    const bytes = Buffer.from(dto.base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new BadRequestException('Recipe photos must be between 1 byte and 5 MB.');
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const publishableKey = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    const apiKey = serviceKey ?? publishableKey;
    const bearer = serviceKey ? `Bearer ${serviceKey}` : authorization ?? (publishableKey ? `Bearer ${publishableKey}` : undefined);
    if (!url || !apiKey || !bearer) throw new BadGatewayException('Recipe image storage is not configured.');
    const extension = dto.contentType === 'image/png' ? 'png' : dto.contentType === 'image/webp' ? 'webp' : 'jpg';
    const safeName = slugify(dto.fileName.replace(/\.[^.]+$/, '')) || 'recipe';
    const objectPath = `${userId}/${Date.now()}-${safeName}.${extension}`;
    const response = await fetch(`${url}/storage/v1/object/recipe-images/${objectPath}`, {
      method: 'POST',
      headers: {
        Authorization: bearer,
        apikey: apiKey,
        'Content-Type': dto.contentType,
        'Cache-Control': 'max-age=31536000',
        'x-upsert': 'false',
      },
      body: bytes,
    });
    const failureBody = response.ok ? '' : await response.text();
    if (!response.ok && (response.status === 401 || response.status === 403 || failureBody.includes('row-level security'))) {
      return { imageUrl: `data:${dto.contentType};base64,${bytes.toString('base64')}`, storage: 'inline' };
    }
    if (!response.ok) throw new BadGatewayException(`Could not upload recipe image: ${failureBody}`);
    return { imageUrl: `${url}/storage/v1/object/public/recipe-images/${objectPath}` };
  }

  private async calculateNutrition(
    rows: Array<{ ingredientId: string; quantity: number; unit: string }>,
    servings: number,
    userId: string,
  ) {
    const ingredientIds = [...new Set(rows.map((item) => item.ingredientId))];
    const [ingredients, profile] = await Promise.all([
      this.prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
        include: { nutrition: true, conversions: true },
      }),
      this.measurementProfiles.active(userId),
    ]);
    const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const invalid = ingredients.filter((ingredient) => !ingredient.nutrition || ingredient.nutrition.calories <= 0);
    if (invalid.length || ingredients.length !== ingredientIds.length) {
      const invalidNames = invalid.map((ingredient) => ingredient.name);
      const missingIds = ingredientIds.filter((ingredientId) => !byId.has(ingredientId));
      throw new BadRequestException(`Nutrition is missing for: ${[...invalidNames, ...missingIds].join(', ')}.`);
    }
    const totals = rows.reduce((sum, item) => {
      const ingredient = byId.get(item.ingredientId)!;
      const nutrition = ingredient.nutrition!;
      const conversions = this.measurementProfiles.applyProfile(item.ingredientId, ingredient.conversions, profile);
      const converted = convertIngredientQuantity(item.quantity, item.unit, nutrition.baseUnit, conversions);
      if (converted === null) throw new BadRequestException(`No ${item.unit} to ${nutrition.baseUnit} conversion exists for ${ingredient.name}.`);
      const scale = converted / nutrition.baseQuantity;
      return {
        calories: sum.calories + nutrition.calories * scale,
        protein: sum.protein + nutrition.protein * scale,
        carbs: sum.carbs + nutrition.carbs * scale,
        fat: sum.fat + nutrition.fat * scale,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const divisor = Math.max(1, servings);
    const data = {
      caloriesPerServing: totals.calories / divisor,
      proteinPerServing: totals.protein / divisor,
      carbsPerServing: totals.carbs / divisor,
      fatPerServing: totals.fat / divisor,
    };
    if (rows.length && data.caloriesPerServing <= 0) throw new BadRequestException('Calculated recipe calories must be greater than zero.');
    return data;
  }

  private emptyNutrition() {
    return {
      caloriesPerServing: 0,
      proteinPerServing: 0,
      carbsPerServing: 0,
      fatPerServing: 0,
    };
  }

  private assertCanManage(user: RequestUser, ownerId: string | null) {
    if (user.role === UserRole.ADMIN) return;
    if (!ownerId || ownerId !== user.id) throw new ForbiddenException('You can only edit recipes you created.');
  }

  private async uniqueSlug(name: string, excludingId?: string) {
    const base = slugify(name) || 'recipe';
    const matches = await this.prisma.recipe.findMany({
      where: {
        slug: { startsWith: base },
        ...(excludingId ? { id: { not: excludingId } } : {}),
      },
      select: { slug: true },
    });
    const used = new Set(matches.map((item) => item.slug));
    if (!used.has(base)) return base;
    let suffix = 2;
    while (used.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
  }

  private async resolveRecipeIngredients(items: RecipeIngredientInputDto[]) {
    for (const item of items) {
      if (!item.ingredientId && !item.name) {
        throw new BadRequestException('Each recipe ingredient must have ingredientId or name.');
      }
    }

    const ids = [...new Set(items.flatMap((item) => item.ingredientId ? [item.ingredientId] : []))];
    const idLookup: Promise<Array<{ id: string }>> = ids.length
      ? this.prisma.ingredient.findMany({ where: { id: { in: ids } }, select: { id: true } })
      : Promise.resolve([]);
    const [ingredientsById, ingredientsByName] = await Promise.all([
      idLookup,
      Promise.all(items.map((item) => item.name && !item.ingredientId
        ? this.ingredientsService.resolveOrCreate(item.name, item.unit)
        : Promise.resolve(null))),
    ]);
    const byId = new Map<string, { id: string }>(ingredientsById.map((ingredient) => [ingredient.id, ingredient]));

    return items.map((item, index) => {
      const ingredient = item.ingredientId ? byId.get(item.ingredientId) : ingredientsByName[index];
      if (!ingredient) throw new BadRequestException(`Ingredient not found: ${item.ingredientId ?? item.name}`);
      return {
        ingredientId: ingredient.id,
        quantity: item.quantity,
        unit: item.unit,
        isOptional: item.isOptional ?? false,
        notes: item.notes,
      };
    });
  }

  private ensureTags(tags: string[]) {
    return Promise.all(tags.map((tag) => this.prisma.tag.upsert({
      where: { slug: slugify(tag) },
      create: { name: toTitleCase(tag), slug: slugify(tag) },
      update: { name: toTitleCase(tag) },
    })));
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
      createdBy: { include: { profile: true } },
    };
  }

  private recipeListSelect() {
    return {
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
      catalogId: true,
      catalogBatch: true,
      catalogVersion: true,
    };
  }
}
