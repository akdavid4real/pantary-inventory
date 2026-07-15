import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { EnvironmentService } from '../../common/config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteOnboardingDto, UpdatePreferencesDto, UpdateProfileDto, UploadProfileImageDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: EnvironmentService,
  ) {}

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
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
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
      emailNotifications: dto.emailNotifications,
      pushNotifications: dto.pushNotifications,
      mealPlanReminders: dto.mealPlanReminders,
      groceryReminders: dto.groceryReminders,
      expiryAlerts: dto.expiryAlerts,
      lowStockAlerts: dto.lowStockAlerts,
      weeklyInsights: dto.weeklyInsights,
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

  async uploadAvatar(userId: string, dto: UploadProfileImageDto, authorization?: string) {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(dto.contentType)) {
      throw new BadRequestException('Profile photos must be JPEG, PNG, or WebP.');
    }

    const bytes = Buffer.from(dto.base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (!bytes.length || bytes.length > 3 * 1024 * 1024) {
      throw new BadRequestException('Profile photos must be between 1 byte and 3 MB.');
    }

    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const publishableKey = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    const apiKey = serviceKey ?? publishableKey;
    const bearer = serviceKey
      ? `Bearer ${serviceKey}`
      : authorization ?? (publishableKey ? `Bearer ${publishableKey}` : undefined);

    if (!supabaseUrl || !apiKey || !bearer) {
      throw new BadGatewayException('Profile image storage is not configured.');
    }

    const extension = dto.contentType === 'image/png'
      ? 'png'
      : dto.contentType === 'image/webp'
        ? 'webp'
        : 'jpg';
    const objectPath = `${userId}/profile/${Date.now()}-avatar.${extension}`;
    const response = await fetch(`${supabaseUrl}/storage/v1/object/recipe-images/${objectPath}`, {
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

    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException(`Could not upload profile photo: ${detail}`);
    }

    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/recipe-images/${objectPath}`;
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, avatarUrl },
      update: { avatarUrl },
    });

    return { avatarUrl };
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
