import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeUnit } from '../../common/utils/unit.utils';
import { CreateMeasurementProfileDto, UpdateMeasurementProfileDto } from './dto/measurement-profile.dto';

type Conversion = { fromUnit: string; toUnit: string; multiplier: number; notes?: string | null };
type ProfileWithOverrides = Awaited<ReturnType<MeasurementProfilesService['active']>>;

const referenceMl: Record<string, number> = { cup: 250, tbsp: 15, tsp: 5, derica: 1000 };

@Injectable()
export class MeasurementProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.measurementProfile.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      include: { overrides: { include: { ingredient: true } } },
    });
  }

  async active(userId: string) {
    const profile = await this.prisma.measurementProfile.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      include: { overrides: true },
    });
    return profile ?? {
      id: 'nigerian-market-standard',
      userId,
      name: 'Nigerian market standard',
      isDefault: true,
      cupMl: 250,
      tablespoonMl: 15,
      teaspoonMl: 5,
      dericaMl: 1000,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      overrides: [],
    };
  }

  async create(userId: string, dto: CreateMeasurementProfileDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Profile name is required.');
    const shouldDefault = dto.isDefault || (await this.prisma.measurementProfile.count({ where: { userId } })) === 0;
    return this.prisma.$transaction(async (tx) => {
      if (shouldDefault) await tx.measurementProfile.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.measurementProfile.create({
        data: {
          userId,
          name,
          isDefault: shouldDefault,
          cupMl: dto.cupMl,
          tablespoonMl: dto.tablespoonMl,
          teaspoonMl: dto.teaspoonMl,
          dericaMl: dto.dericaMl,
          overrides: { create: (dto.overrides ?? []).map((item) => ({ ...item, fromUnit: normalizeUnit(item.fromUnit), toUnit: normalizeUnit(item.toUnit ?? 'g') })) },
        },
        include: { overrides: { include: { ingredient: true } } },
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateMeasurementProfileDto) {
    await this.assertOwned(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await tx.measurementProfile.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } });
      const { overrides, ...data } = dto;
      await tx.measurementProfile.update({ where: { id }, data: { ...data, name: data.name?.trim() } });
      if (overrides) {
        await tx.measurementOverride.deleteMany({ where: { profileId: id } });
        if (overrides.length) await tx.measurementOverride.createMany({ data: overrides.map((item) => ({ profileId: id, ...item, fromUnit: normalizeUnit(item.fromUnit), toUnit: normalizeUnit(item.toUnit ?? 'g') })) });
      }
      return tx.measurementProfile.findUnique({ where: { id }, include: { overrides: { include: { ingredient: true } } } });
    });
  }

  async remove(userId: string, id: string) {
    const profile = await this.assertOwned(userId, id);
    await this.prisma.measurementProfile.delete({ where: { id } });
    if (profile.isDefault) {
      const fallback = await this.prisma.measurementProfile.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } });
      if (fallback) await this.prisma.measurementProfile.update({ where: { id: fallback.id }, data: { isDefault: true } });
    }
    return { deleted: true };
  }

  applyProfile(ingredientId: string, conversions: Conversion[], profile: ProfileWithOverrides): Conversion[] {
    const adjusted = conversions.map((conversion) => {
      const unit = normalizeUnit(conversion.fromUnit);
      const configuredMl = unit === 'cup' ? profile.cupMl : unit === 'tbsp' ? profile.tablespoonMl : unit === 'tsp' ? profile.teaspoonMl : unit === 'derica' ? profile.dericaMl : null;
      return configuredMl && referenceMl[unit]
        ? { ...conversion, multiplier: conversion.multiplier * (configuredMl / referenceMl[unit]) }
        : conversion;
    });
    for (const override of profile.overrides.filter((item) => item.ingredientId === ingredientId)) {
      const index = adjusted.findIndex((item) => normalizeUnit(item.fromUnit) === normalizeUnit(override.fromUnit) && normalizeUnit(item.toUnit) === normalizeUnit(override.toUnit));
      const value = { fromUnit: override.fromUnit, toUnit: override.toUnit, multiplier: override.multiplier, notes: `Custom profile: ${profile.name}` };
      if (index >= 0) adjusted[index] = value;
      else adjusted.push(value);
    }
    return adjusted;
  }

  private async assertOwned(userId: string, id: string) {
    const profile = await this.prisma.measurementProfile.findFirst({ where: { id, userId } });
    if (!profile) throw new NotFoundException('Measurement profile not found.');
    return profile;
  }
}
