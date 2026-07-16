import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPagination, PaginationQueryDto } from '../../common/dto/query.dto';
import { normalizeIngredientName, normalizeText, slugify } from '../../common/utils/string.utils';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIngredientDto) {
    if (!dto.nutrition || !dto.nutrition.calories || dto.nutrition.calories <= 0) {
      throw new BadRequestException('Catalog ingredients require validated nutrition with calories greater than zero.');
    }
    const name = normalizeIngredientName(dto.name);
    const slug = slugify(name);
    const aliases = this.uniqueAliases([dto.name, name, ...(dto.aliases ?? [])]);

    return this.prisma.ingredient.create({
      data: {
        name,
        slug,
        description: dto.description,
        category: dto.category,
        defaultUnit: dto.defaultUnit,
        storageLocation: dto.storageLocation,
        shelfLifeDays: dto.shelfLifeDays,
        averageCostNaira: dto.averageCostNaira,
        aliases: {
          create: aliases.map((alias) => ({
            alias,
            normalized: normalizeText(alias),
          })),
        },
        ...(dto.nutrition
          ? {
              nutrition: {
                create: {
                  baseQuantity: dto.nutrition.baseQuantity ?? 100,
                  baseUnit: dto.nutrition.baseUnit ?? 'g',
                  calories: dto.nutrition.calories ?? 0,
                  protein: dto.nutrition.protein ?? 0,
                  carbs: dto.nutrition.carbs ?? 0,
                  fat: dto.nutrition.fat ?? 0,
                  source: dto.nutrition.source,
                },
              },
            }
          : {}),
      },
      include: { aliases: true, nutrition: true, conversions: true },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const q = query.q?.trim();
    const where: any = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { aliases: { some: { alias: { contains: q, mode: 'insensitive' as const } } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take,
        orderBy: [
          { imageUrl: { sort: 'desc', nulls: 'last' } },
          { name: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          defaultUnit: true,
          storageLocation: true,
          averageCostNaira: true,
          conversions: {
            select: { id: true, fromUnit: true, toUnit: true, multiplier: true, notes: true },
          },
        },
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: { aliases: true, nutrition: true, conversions: true },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found.');
    return ingredient;
  }

  async findByNameOrAlias(name: string) {
    const normalized = normalizeText(normalizeIngredientName(name));
    return this.prisma.ingredient.findFirst({
      where: {
        OR: [
          { slug: slugify(normalized) },
          { name: { equals: normalized, mode: 'insensitive' } },
          { aliases: { some: { normalized } } },
        ],
      },
      include: { nutrition: true, aliases: true, conversions: true },
    });
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    delete data.aliases;
    delete data.nutrition;

    if (dto.name) {
      const normalizedName = normalizeIngredientName(dto.name);
      data.name = normalizedName;
      data.slug = slugify(normalizedName);
    }

    return this.prisma.ingredient.update({
      where: { id },
      data: {
        ...data,
        ...(dto.nutrition
          ? {
              nutrition: {
                upsert: {
                  create: {
                    baseQuantity: dto.nutrition.baseQuantity ?? 100,
                    baseUnit: dto.nutrition.baseUnit ?? 'g',
                    calories: dto.nutrition.calories ?? 0,
                    protein: dto.nutrition.protein ?? 0,
                    carbs: dto.nutrition.carbs ?? 0,
                    fat: dto.nutrition.fat ?? 0,
                    source: dto.nutrition.source,
                  },
                  update: dto.nutrition,
                },
              },
            }
          : {}),
      },
      include: { aliases: true, nutrition: true, conversions: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ingredient.delete({ where: { id } });
  }

  async resolveOrCreate(name: string, defaultUnit = 'g') {
    const existing = await this.findByNameOrAlias(name);
    if (existing) return existing;

    throw new BadRequestException(`${name} is not in the validated ingredient catalog. Add its nutrition before using it.`);
  }

  private uniqueAliases(values: string[]) {
    const seen = new Set<string>();
    return values
      .map((value) => normalizeIngredientName(value))
      .filter(Boolean)
      .filter((value) => {
        const key = normalizeText(value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }
}
