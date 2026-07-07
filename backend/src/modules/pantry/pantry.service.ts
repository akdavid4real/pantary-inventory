import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PantryAdjustmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays } from '../../common/utils/date.utils';
import { IngredientsService } from '../ingredients/ingredients.service';
import { AdjustPantryItemDto, CreatePantryItemDto, UpdatePantryItemDto } from './dto/pantry.dto';

@Injectable()
export class PantryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingredientsService: IngredientsService,
  ) {}

  async create(userId: string, dto: CreatePantryItemDto) {
    if (!dto.ingredientId && !dto.name) {
      throw new BadRequestException('Pantry item requires ingredientId or name.');
    }

    const ingredient = dto.ingredientId
      ? await this.prisma.ingredient.findUnique({ where: { id: dto.ingredientId } })
      : await this.ingredientsService.resolveOrCreate(dto.name!, dto.unit);

    if (!ingredient) throw new BadRequestException('Ingredient not found.');

    const item = await this.prisma.pantryItem.create({
      data: {
        userId,
        ingredientId: ingredient.id,
        quantity: dto.quantity,
        unit: dto.unit,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        storageLocation: dto.storageLocation ?? ingredient.storageLocation,
        lowStockThreshold: dto.lowStockThreshold,
        notes: dto.notes,
      },
      include: { ingredient: true },
    });

    await this.createLog(userId, item.id, item.ingredientId, PantryAdjustmentType.ADDED, dto.quantity, dto.unit, 'Initial pantry entry');
    return item;
  }

  findAll(userId: string) {
    return this.prisma.pantryItem.findMany({
      where: { userId },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
      include: { ingredient: { include: { nutrition: true, aliases: true } } },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.pantryItem.findFirst({
      where: { id, userId },
      include: { ingredient: { include: { nutrition: true, aliases: true } }, logs: true },
    });
    if (!item) throw new NotFoundException('Pantry item not found.');
    return item;
  }

  async update(userId: string, id: string, dto: UpdatePantryItemDto) {
    await this.findOne(userId, id);
    return this.prisma.pantryItem.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        unit: dto.unit,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        storageLocation: dto.storageLocation,
        lowStockThreshold: dto.lowStockThreshold,
        notes: dto.notes,
      },
      include: { ingredient: true },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.findOne(userId, id);
    await this.createLog(userId, item.id, item.ingredientId, PantryAdjustmentType.REMOVED, item.quantity, item.unit, 'Pantry item removed');
    return this.prisma.pantryItem.delete({ where: { id } });
  }

  async adjust(userId: string, id: string, dto: AdjustPantryItemDto) {
    const item = await this.findOne(userId, id);
    let nextQuantity = item.quantity;

    if (dto.type === PantryAdjustmentType.ADDED || dto.type === PantryAdjustmentType.BOUGHT) {
      nextQuantity += dto.quantity;
    } else if (dto.type === PantryAdjustmentType.CORRECTED) {
      nextQuantity = dto.quantity;
    } else {
      nextQuantity = Math.max(0, nextQuantity - dto.quantity);
    }

    const updated = await this.prisma.pantryItem.update({
      where: { id },
      data: { quantity: nextQuantity, unit: dto.unit ?? item.unit },
      include: { ingredient: true },
    });

    await this.createLog(userId, id, item.ingredientId, dto.type, dto.quantity, dto.unit, dto.reason);
    return updated;
  }

  expiringSoon(userId: string, days = 7) {
    const now = new Date();
    return this.prisma.pantryItem.findMany({
      where: {
        userId,
        expiryDate: {
          gte: now,
          lte: addDays(now, days),
        },
      },
      orderBy: { expiryDate: 'asc' },
      include: { ingredient: true },
    });
  }

  async lowStock(userId: string) {
    const items = await this.prisma.pantryItem.findMany({
      where: { userId, lowStockThreshold: { not: null } },
      include: { ingredient: true },
    });
    return items.filter((item) => item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold);
  }

  async getPantryMap(userId: string) {
    const items = await this.prisma.pantryItem.findMany({
      where: { userId, quantity: { gt: 0 } },
      include: { ingredient: { include: { aliases: true } } },
    });

    const byIngredientId = new Map<string, typeof items>();
    const byName = new Map<string, typeof items>();

    for (const item of items) {
      byIngredientId.set(item.ingredientId, [...(byIngredientId.get(item.ingredientId) ?? []), item]);
      byName.set(item.ingredient.name, [...(byName.get(item.ingredient.name) ?? []), item]);
      for (const alias of item.ingredient.aliases) {
        byName.set(alias.normalized, [...(byName.get(alias.normalized) ?? []), item]);
      }
    }

    return { items, byIngredientId, byName };
  }

  private createLog(
    userId: string,
    pantryItemId: string | null,
    ingredientId: string | null,
    type: PantryAdjustmentType,
    quantity: number,
    unit: string,
    reason?: string,
  ) {
    return this.prisma.pantryItemLog.create({
      data: { userId, pantryItemId, ingredientId, type, quantity, unit, reason },
    });
  }
}
