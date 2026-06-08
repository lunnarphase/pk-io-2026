export interface IdBody {
  id: string;
}

export interface RecipeBody extends IdBody {
  lifecycleStatus: string;
  title?: string;
  servings?: number;
}

export interface PantryItemBody {
  quantity: number;
  unit: string;
  ingredientId?: string;
}

export interface SuggestionsBody {
  available: IdBody[];
  almostAvailable: IdBody[];
  needsMore: IdBody[];
}

export interface AuthTokensResponse {
  accessToken: string;
}

export function asBody<T>(body: unknown): T {
  return body as T;
}
