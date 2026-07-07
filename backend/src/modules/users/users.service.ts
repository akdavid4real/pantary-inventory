import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePreferencesDto, UpdateProfileDto } from './dto/user.dto';

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
}
