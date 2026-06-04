import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { ExternalRecipesPage } from '@/pages/ExternalRecipesPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { PantryPage } from '@/pages/PantryPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { RecipeNewPage } from '@/pages/RecipeNewPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ShoppingListPage } from '@/pages/ShoppingListPage'
import { SuggestionsPage } from '@/pages/SuggestionsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/suggestions', element: <SuggestionsPage /> },
          { path: '/pantry', element: <PantryPage /> },
          { path: '/recipes', element: <RecipesPage /> },
          { path: '/recipes/new', element: <RecipeNewPage /> },
          { path: '/recipes/:id', element: <RecipeDetailPage /> },
          { path: '/shopping-list', element: <ShoppingListPage /> },
          { path: '/external', element: <ExternalRecipesPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
