import { SupabaseClient } from '@supabase/supabase-js';
import { ClothingItem, ClothingCategory } from '../types/clothing';

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Define what categories complement each base category
 */
const OUTFIT_RULES: Record<ClothingCategory, ClothingCategory[]> = {
  tops: ['bottoms', 'shoes'],
  bottoms: ['tops', 'shoes'],
  dresses: ['shoes', 'accessories'],
  outerwear: ['tops', 'bottoms', 'shoes'],
  shoes: ['tops', 'bottoms'],
  accessories: ['tops', 'bottoms', 'shoes'],
  undergarments: [],
  activewear: ['shoes'],
};

/**
 * Extended ClothingItem with similarity score
 */
interface ScoredItem extends ClothingItem {
  similarity: number;
}

/**
 * Outfit recommendation result
 */
export interface OutfitRecommendation {
  baseItem: ClothingItem;
  recommendations: {
    category: ClothingCategory;
    items: ScoredItem[];
  }[];
}

/**
 * Build outfit recommendations from a base item
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID (for validation)
 * @param baseItemId - Base clothing item ID
 * @param excludeIds - Item IDs to exclude from recommendations
 */
export async function buildOutfitFromBase(
  supabase: SupabaseClient,
  userId: string,
  baseItemId: string,
  excludeIds: string[] = []
): Promise<OutfitRecommendation> {
  // 1. Get base item with its embedding
  const { data: baseItem, error: baseError } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('id', baseItemId)
    .eq('user_id', userId)
    .single();

  if (baseError || !baseItem) {
    throw new Error('Base item not found');
  }

  if (!baseItem.v_image) {
    throw new Error('Base item has no embedding. Please wait for processing or re-upload the image.');
  }

  // 2. Get all user's items with embeddings
  const { data: allItems, error: itemsError } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .not('v_image', 'is', null);

  if (itemsError || !allItems) {
    throw new Error('Failed to fetch items');
  }

  // 3. Determine needed categories based on base item
  const neededCategories = OUTFIT_RULES[baseItem.category as ClothingCategory] || [];

  // 4. Find best matches for each category
  const recommendations: { category: ClothingCategory; items: ScoredItem[] }[] = [];

  for (const category of neededCategories) {
    // Filter items by category
    const categoryItems = allItems.filter(
      (item) =>
        item.category === category &&
        item.id !== baseItemId &&
        !excludeIds.includes(item.id) &&
        item.v_image
    );

    if (categoryItems.length === 0) {
      continue; // Skip if no items in this category
    }

    // Calculate similarity scores
    const scoredItems: ScoredItem[] = categoryItems.map((item) => ({
      ...item,
      similarity: cosineSimilarity(baseItem.v_image, item.v_image),
    }));

    // Sort by similarity (highest first) and take top 3
    const topItems = scoredItems
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    recommendations.push({
      category,
      items: topItems,
    });
  }

  return {
    baseItem,
    recommendations,
  };
}

/**
 * Generate a complete outfit by selecting the best item from each category
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID
 * @param baseItemId - Base clothing item ID
 * @param excludeIds - Item IDs to exclude
 */
export async function generateCompleteOutfit(
  supabase: SupabaseClient,
  userId: string,
  baseItemId: string,
  excludeIds: string[] = []
): Promise<ClothingItem[]> {
  const result = await buildOutfitFromBase(supabase, userId, baseItemId, excludeIds);
  
  // Start with base item
  const outfit: ClothingItem[] = [result.baseItem];
  
  // Take the first (best) item from each category
  result.recommendations.forEach((rec) => {
    if (rec.items.length > 0) {
      outfit.push(rec.items[0]);
    }
  });
  
  return outfit;
}

