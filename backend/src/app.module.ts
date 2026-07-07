import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CookingModeModule } from './modules/cooking-mode/cooking-mode.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { MealPlannerModule } from './modules/meal-planner/meal-planner.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { PantryModule } from './modules/pantry/pantry.module';
import { RecipeMatcherModule } from './modules/recipe-matcher/recipe-matcher.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ShoppingListModule } from './modules/shopping-list/shopping-list.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    IngredientsModule,
    RecipesModule,
    PantryModule,
    RecipeMatcherModule,
    MealPlannerModule,
    ShoppingListModule,
    NutritionModule,
    CookingModeModule,
    DashboardModule,
    RecommendationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
