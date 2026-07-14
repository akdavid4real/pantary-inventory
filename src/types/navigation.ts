export type ScreenProps = { onNavigate: (page: string) => void };

export const routes = {
  recipe: (recipeId: string) => `/recipes/${recipeId}`,
  mealWeek: (date: string) => `/meals/week/${date}`,
  shoppingList: (listId: string) => `/grocery/lists/${listId}`,
  cookingSession: (sessionId: string) => `/cooking/${sessionId}`,
  newRecipe: "/my-recipes/new",
  editRecipe: (recipeId: string) => `/my-recipes/${recipeId}/edit`,
} as const;
