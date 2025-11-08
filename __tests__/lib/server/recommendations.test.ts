import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildOutfitFromBase,
  generateCompleteOutfit,
  type OutfitRecommendation,
} from '@/app/lib/server/recommendations';
import type { ClothingItem } from '@/app/types/clothing';

// Mock server-only module
vi.mock('server-only', () => ({}));

describe('recommendations', () => {
  let mockSupabase: SupabaseClient;
  const mockUserId = 'user-123';
  const mockBaseItemId = 'item-base-123';

  // Helper function to create base item query mock
  const createBaseItemMock = (baseItem: ClothingItem & { v_image?: number[] }) => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: baseItem,
      error: null,
    });

    const mockEq2 = vi.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockEq1 = vi.fn().mockReturnValue({
      eq: mockEq2,
    });

    return {
      select: vi.fn().mockReturnValue({
        eq: mockEq1,
      }),
    };
  };

  // Helper function to create all items query mock
  const createAllItemsMock = (items: (ClothingItem & { v_image?: number[] })[]) => {
    const mockNot = vi.fn().mockResolvedValue({
      data: items,
      error: null,
    });

    const mockEq = vi.fn().mockReturnValue({
      not: mockNot,
    });

    return {
      select: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock Supabase client
    mockSupabase = {
      from: vi.fn(),
      auth: {} as any,
    } as any;
  });

  describe('buildOutfitFromBase', () => {
    it('should throw error when base item is not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Item not found' },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(
        buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId)
      ).rejects.toThrow('Base item not found');
    });

    it('should throw error when base item has no embedding', async () => {
      const mockBaseItem: ClothingItem = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        // No v_image
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockBaseItem,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(
        buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId)
      ).rejects.toThrow('Base item has no embedding');
    });

    it('should throw error when fetching all items fails', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockBaseItem,
        error: null,
      });

      const mockEq2Base = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1Base = vi.fn().mockReturnValue({
        eq: mockEq2Base,
      });

      const mockSelectBase = vi.fn().mockReturnValue({
        eq: mockEq1Base,
      });

      const mockNot = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockEqAll = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelectAll = vi.fn().mockReturnValue({
        eq: mockEqAll,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: mockSelectBase,
        } as any)
        .mockReturnValueOnce({
          select: mockSelectAll,
        } as any);

      await expect(
        buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId)
      ).rejects.toThrow('Failed to fetch items');
    });

    it('should return recommendations for tops category', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'T-Shirt',
          category: 'tops',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-2',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-3',
          user_id: mockUserId,
          name: 'Sneakers',
          category: 'shoes',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId);

      expect(result.baseItem).toEqual(mockBaseItem);
      expect(result.recommendations).toHaveLength(3); // tops, bottoms, shoes
      
      const bottomsRec = result.recommendations.find((r) => r.category === 'bottoms');
      expect(bottomsRec).toBeDefined();
      expect(bottomsRec?.items).toHaveLength(1); // Only one bottoms item in mock data
      expect(bottomsRec?.items[0].id).toBe('item-2');
    });

    it('should exclude specified item IDs', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-excluded',
          user_id: mockUserId,
          name: 'Excluded Pants',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(
        mockSupabase,
        mockUserId,
        mockBaseItemId,
        ['item-excluded']
      );

      const bottomsRec = result.recommendations.find((r) => r.category === 'bottoms');
      expect(bottomsRec).toBeDefined();
      expect(bottomsRec?.items).toHaveLength(1);
      expect(bottomsRec?.items[0].id).toBe('item-1');
      expect(bottomsRec?.items.some((item) => item.id === 'item-excluded')).toBe(false);
    });

    it('should limit recommendations to top 3 items per category', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      // Create 5 items in bottoms category with different similarities
      // Use vectors with different directions to create different similarity scores
      // Base item has all 0.1, so we'll create vectors that vary to get different cosine similarities
      const mockBottoms: (ClothingItem & { v_image?: number[] })[] = Array.from(
        { length: 5 },
        (_, i) => {
          // Create a vector that's more similar to base (all 0.1) as i increases
          // item-4: all 0.1 (identical to base, similarity = 1.0)
          // item-3: mostly 0.1 with some 0.11 (high similarity)
          // item-2: mix of 0.1 and 0.12 (medium similarity)
          // item-1: mix of 0.1 and 0.15 (lower similarity)
          // item-0: mix of 0.1 and 0.2 (lowest similarity)
          const similarityFactor = (4 - i) / 4; // 1.0 for item-4, 0.0 for item-0
          const baseValue = 0.1;
          const variation = 0.1 * (1 - similarityFactor);
          return {
            id: `item-${i}`,
            user_id: mockUserId,
            name: `Item ${i}`,
            category: 'bottoms' as const,
            is_favorite: false,
            wear_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            // Create vector with varying values to get different cosine similarities
            v_image: Array(768).fill(0).map((_, idx) => 
              idx % 2 === 0 ? baseValue : baseValue + variation
            ),
          };
        }
      );

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockBottoms]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId);

      const bottomsRec = result.recommendations.find((r) => r.category === 'bottoms');
      expect(bottomsRec).toBeDefined();
      expect(bottomsRec?.items).toHaveLength(3); // Should be limited to top 3
      // Should be sorted by similarity (highest first)
      expect(bottomsRec?.items[0].similarity).toBeGreaterThanOrEqual(bottomsRec?.items[1].similarity!);
      expect(bottomsRec?.items[1].similarity).toBeGreaterThanOrEqual(bottomsRec?.items[2].similarity!);
      // Verify all items have similarity scores (allow slight floating point errors)
      bottomsRec?.items.forEach(item => {
        expect(item.similarity).toBeGreaterThanOrEqual(0);
        expect(item.similarity).toBeLessThanOrEqual(1.0001); // Allow floating point precision errors
      });
    });

    it('should skip categories with no items', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      // No items in any category
      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId);

      expect(result.baseItem).toEqual(mockBaseItem);
      expect(result.recommendations).toHaveLength(0); // No items in any category
    });

    it('should filter out items without embeddings', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-2',
          user_id: mockUserId,
          name: 'Pants',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          // No v_image - should be filtered out
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId);

      const bottomsRec = result.recommendations.find((r) => r.category === 'bottoms');
      expect(bottomsRec).toBeDefined();
      expect(bottomsRec?.items).toHaveLength(1);
      expect(bottomsRec?.items[0].id).toBe('item-1');
    });

    it('should handle different base categories correctly', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'T-Shirt',
        category: 'tops',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-2',
          user_id: mockUserId,
          name: 'Sneakers',
          category: 'shoes',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId);

      // Tops should recommend bottoms and shoes
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations.some((r) => r.category === 'bottoms')).toBe(true);
      expect(result.recommendations.some((r) => r.category === 'shoes')).toBe(true);
    });

    it('should handle undergarments category (no recommendations)', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Undershirt',
        category: 'undergarments',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await buildOutfitFromBase(mockSupabase, mockUserId, mockBaseItemId);

      // Undergarments has no complementary categories
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('generateCompleteOutfit', () => {
    it('should generate complete outfit with base item and top recommendations', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-2',
          user_id: mockUserId,
          name: 'Sneakers',
          category: 'shoes',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await generateCompleteOutfit(mockSupabase, mockUserId, mockBaseItemId);

      expect(result).toHaveLength(3); // Base item + 2 recommendations
      expect(result[0]).toEqual(mockBaseItem);
      expect(result[1].id).toBe('item-1'); // Top bottoms item
      expect(result[2].id).toBe('item-2'); // Top shoes item
    });

    it('should return only base item when no recommendations available', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await generateCompleteOutfit(mockSupabase, mockUserId, mockBaseItemId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockBaseItem);
    });

    it('should respect excludeIds parameter', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
        {
          id: 'item-excluded',
          user_id: mockUserId,
          name: 'Excluded Pants',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.3),
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await generateCompleteOutfit(
        mockSupabase,
        mockUserId,
        mockBaseItemId,
        ['item-excluded']
      );

      expect(result).toHaveLength(2); // Base + 1 recommendation (excluded one filtered out)
      expect(result[0]).toEqual(mockBaseItem);
      expect(result[1].id).toBe('item-1');
      expect(result.some((item) => item.id === 'item-excluded')).toBe(false);
    });

    it('should handle categories with empty recommendations', async () => {
      const mockBaseItem: ClothingItem & { v_image?: number[] } = {
        id: mockBaseItemId,
        user_id: mockUserId,
        name: 'Blue Jacket',
        category: 'outerwear',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        v_image: Array(768).fill(0.1),
      };

      // Only one item in bottoms, none in tops or shoes
      const mockItems: (ClothingItem & { v_image?: number[] })[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Jeans',
          category: 'bottoms',
          is_favorite: false,
          wear_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          v_image: Array(768).fill(0.2),
        },
      ];

      const mockSelectBase = createBaseItemMock(mockBaseItem);
      const mockSelectAll = createAllItemsMock([mockBaseItem, ...mockItems]);

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockSelectBase as any)
        .mockReturnValueOnce(mockSelectAll as any);

      const result = await generateCompleteOutfit(mockSupabase, mockUserId, mockBaseItemId);

      // Should only include base item + items from categories that have recommendations
      expect(result).toHaveLength(2); // Base + 1 bottoms item
      expect(result[0]).toEqual(mockBaseItem);
      expect(result[1].id).toBe('item-1');
    });
  });
});

