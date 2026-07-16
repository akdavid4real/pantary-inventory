import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { EnvironmentModule } from './common/config/environment.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CookingModeModule } from './modules/cooking-mode/cooking-mode.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { FoodAnalysisModule } from './modules/food-analysis/food-analysis.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { MealPlannerModule } from './modules/meal-planner/meal-planner.module';
import { MeasurementProfilesModule } from './modules/measurement-profiles/measurement-profiles.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { PantryModule } from './modules/pantry/pantry.module';
import { RecipeMatcherModule } from './modules/recipe-matcher/recipe-matcher.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ShoppingListModule } from './modules/shopping-list/shopping-list.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    EnvironmentModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    IngredientsModule,
    RecipesModule,
    PantryModule,
    RecipeMatcherModule,
    MealPlannerModule,
    MeasurementProfilesModule,
    ShoppingListModule,
    NutritionModule,
    CookingModeModule,
    DashboardModule,
    FavoritesModule,
    FoodAnalysisModule,
    RecommendationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
