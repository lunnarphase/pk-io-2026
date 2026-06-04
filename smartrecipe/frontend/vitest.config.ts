import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/lib/**', 'src/api/**', 'src/store/**', 'src/features/**', 'src/hooks/**'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/test/**',
          'src/api/client.ts',
          'src/features/auth/**',
          'src/features/landing/**',
          'src/features/nutrition/LinkIngredientNutritionDialog.tsx',
          'src/features/pantry/PantryList.tsx',
          'src/features/pantry/UpsertPantryItemDialog.tsx',
          'src/features/shopping-list/ShoppingListView.tsx',
          'src/features/shopping-list/AddItemDialog.tsx',
          'src/features/shopping-list/FillFromRecipesDialog.tsx',
          'src/features/recipes/RecipeDraftDetail.tsx',
          'src/features/recipes/RecipeDetailView.tsx',
          'src/features/recipes/IngredientListEditor.tsx',
          'src/features/external/ExternalRecipeCard.tsx',
          '**/*PageHeader.tsx',
        ],
        thresholds: {
          statements: 55,
          branches: 45,
          functions: 50,
          lines: 55,
        },
      },
    },
  }),
)
