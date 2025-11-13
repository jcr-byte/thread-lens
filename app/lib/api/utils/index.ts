/**
 * Barrel export for API utilities
 * Provides a clean import path for all utility functions
 */

// Types
export type { ApiResult, ApiSuccess } from './types';

// Query operations (read)
export { getUserItems } from './queries';

// Mutation operations (write)
export { toggleFavorite, deleteItem } from './mutations';

// Outfit signature utilities
export { generateOutfitSignature, isValidOutfitSignature } from './outfitSignature';

