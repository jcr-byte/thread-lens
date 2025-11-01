import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClothingItem, getUserClothingItems } from '@/app/lib/api/clothing';
import type { CreateClothingItemData, ClothingItem } from '@/app/types/clothing';

// Mock the Supabase client
vi.mock('@/app/lib/api/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock the uploadImage module
vi.mock('@/app/lib/api/uploadImage', () => ({
  uploadClothingImage: vi.fn(),
}));

describe('clothing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClothingItem', () => {
    const mockUserId = 'user-123';
    const mockClothingData: CreateClothingItemData = {
      name: 'Blue Denim Jacket',
      category: 'outerwear',
      subcategory: 'jacket',
      brand: 'Levi\'s',
      color: 'blue',
      size: 'M',
      material: 'denim',
      purchase_date: '2024-01-15',
      price: 89.99,
      tags: ['casual', 'winter'],
      notes: 'Perfect for layering',
    };

    it('should successfully create a clothing item with an image', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

      const mockFile = new File(['image'], 'jacket.jpg', { type: 'image/jpeg' });
      const mockUploadResult = {
        path: 'users/user-123/clothing/jacket.jpg',
        publicUrl: 'https://example.com/jacket.jpg',
        signedUrl: 'https://example.com/signed/jacket.jpg',
      };
      const mockClothingItem = {
        id: 'item-123',
        user_id: mockUserId,
        ...mockClothingData,
        image_path: mockUploadResult.path,
        image_url: mockUploadResult.publicUrl,
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      vi.mocked(uploadClothingImage).mockResolvedValue(mockUploadResult);

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockClothingItem,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createClothingItem(mockUserId, {
        ...mockClothingData,
        image: mockFile,
      });

      expect(result.data).toEqual(mockClothingItem);
      expect(result.error).toBeNull();

      expect(uploadClothingImage).toHaveBeenCalledWith(mockFile, mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('clothing_items');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: mockClothingData.name,
        category: mockClothingData.category,
        subcategory: mockClothingData.subcategory,
        brand: mockClothingData.brand,
        color: mockClothingData.color,
        size: mockClothingData.size,
        material: mockClothingData.material,
        image_path: mockUploadResult.path,
        image_url: mockUploadResult.publicUrl,
        purchase_date: mockClothingData.purchase_date,
        price: mockClothingData.price,
        tags: mockClothingData.tags,
        notes: mockClothingData.notes,
      });
    });

    it('should successfully create a clothing item without an image', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

      const mockClothingItem = {
        id: 'item-456',
        user_id: mockUserId,
        ...mockClothingData,
        image_path: '',
        image_url: '',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockClothingItem,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createClothingItem(mockUserId, mockClothingData);

      expect(result.data).toEqual(mockClothingItem);
      expect(result.error).toBeNull();

      expect(uploadClothingImage).not.toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          name: mockClothingData.name,
          image_path: '',
          image_url: '',
        })
      );
    });

    it('should return error when image upload fails', async () => {
      const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

      const mockFile = new File(['image'], 'jacket.jpg', { type: 'image/jpeg' });
      const mockUploadError = 'Failed to upload image';

      vi.mocked(uploadClothingImage).mockResolvedValue({
        path: '',
        publicUrl: '',
        signedUrl: '',
        error: mockUploadError,
      });

      const result = await createClothingItem(mockUserId, {
        ...mockClothingData,
        image: mockFile,
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockUploadError);
    });

    it('should return error when database insertion fails', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const mockError = { message: 'Database error' };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createClothingItem(mockUserId, mockClothingData);

      expect(result.data).toBeNull();
      expect(result.error).toBe(mockError.message);
    });

    it('should handle exceptions and return unknown error', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await createClothingItem(mockUserId, mockClothingData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Unexpected error');
    });

    it('should handle non-Error exceptions', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      vi.mocked(supabase.from).mockImplementation(() => {
        throw 'String error';
      });

      const result = await createClothingItem(mockUserId, mockClothingData);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Unknown error');
    });

    it('should create clothing item with minimal required fields', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const minimalData: CreateClothingItemData = {
        name: 'Simple T-Shirt',
        category: 'tops',
      };

      const mockClothingItem = {
        id: 'item-789',
        user_id: mockUserId,
        name: minimalData.name,
        category: minimalData.category,
        image_path: '',
        image_url: '',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockClothingItem,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createClothingItem(mockUserId, minimalData);

      expect(result.data).toEqual(mockClothingItem);
      expect(result.error).toBeNull();

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: minimalData.name,
        category: minimalData.category,
        subcategory: undefined,
        brand: undefined,
        color: undefined,
        size: undefined,
        material: undefined,
        image_path: '',
        image_url: '',
        purchase_date: undefined,
        price: undefined,
        tags: undefined,
        notes: undefined,
      });
    });

    it('should preserve all optional fields when provided', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const fullData: CreateClothingItemData = {
        name: 'Premium Wool Coat',
        category: 'outerwear',
        subcategory: 'coat',
        brand: 'Canada Goose',
        color: 'black',
        size: 'L',
        material: 'wool',
        purchase_date: '2024-02-01',
        price: 799.99,
        tags: ['formal', 'winter', 'luxury'],
        notes: 'Requires dry cleaning only',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'item-999', ...fullData },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await createClothingItem(mockUserId, fullData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          name: fullData.name,
          category: fullData.category,
          subcategory: fullData.subcategory,
          brand: fullData.brand,
          color: fullData.color,
          size: fullData.size,
          material: fullData.material,
          purchase_date: fullData.purchase_date,
          price: fullData.price,
          tags: fullData.tags,
          notes: fullData.notes,
        })
      );
    });
  });

  describe('getUserClothingItems', () => {
    const mockUserId = 'user-123';

    it('should return array of clothing items when query succeeds', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const mockClothingItems: ClothingItem[] = [
        {
          id: 'item-1',
          user_id: mockUserId,
          name: 'Blue Denim Jacket',
          category: 'outerwear',
          subcategory: 'jacket',
          brand: 'Levi\'s',
          color: 'blue',
          size: 'M',
          material: 'denim',
          image_url: 'https://example.com/jacket.jpg',
          image_path: 'users/user-123/clothing/jacket.jpg',
          purchase_date: '2024-01-15',
          price: 89.99,
          tags: ['casual', 'winter'],
          notes: 'Perfect for layering',
          is_favorite: false,
          wear_count: 5,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 'item-2',
          user_id: mockUserId,
          name: 'White Cotton T-Shirt',
          category: 'tops',
          color: 'white',
          size: 'L',
          material: 'cotton',
          is_favorite: true,
          wear_count: 12,
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockClothingItems,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getUserClothingItems(mockUserId);

      expect(result.data).toEqual(mockClothingItems);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('clothing_items');
    });

    it('should return empty array when user has no clothing items', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getUserClothingItems(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should return error when query fails', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const mockError = { message: 'Database connection failed' };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getUserClothingItems(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database connection failed');
    });

    it('should filter by user_id correctly', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await getUserClothingItems('specific-user-id');

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'specific-user-id');
    });

    it('should order results by created_at descending', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');

      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await getUserClothingItems(mockUserId);

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });
});

