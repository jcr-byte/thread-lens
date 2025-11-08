import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClothingItem, getClothingItemsByIds, updateClothingItem, type UpdateClothingItemData } from '@/app/lib/api/clothing';
import type { CreateClothingItemData } from '@/app/types/clothing';

// Mock the Supabase client
vi.mock('@/app/lib/api/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

// Mock the uploadImage module
vi.mock('@/app/lib/api/uploadImage', () => ({
  uploadClothingImage: vi.fn(),
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

describe('getClothingItemsByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when itemIds array is empty', async () => {
    const result = await getClothingItemsByIds([]);
    
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('should successfully fetch clothing items by IDs', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    
    const mockItemIds = ['item-1', 'item-2', 'item-3'];
    const mockItems = [
      {
        id: 'item-1',
        user_id: 'user-123',
        name: 'Blue Jeans',
        category: 'bottoms',
        is_favorite: false,
        wear_count: 0,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'item-2',
        user_id: 'user-123',
        name: 'White Shirt',
        category: 'tops',
        is_favorite: true,
        wear_count: 5,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-12T00:00:00Z',
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({
        data: mockItems,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await getClothingItemsByIds(mockItemIds);

    expect(result.data).toEqual(mockItems);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('clothing_items');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockSelect().in).toHaveBeenCalledWith('id', mockItemIds);
  });

  it('should return empty array when Supabase returns null data', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    
    const mockItemIds = ['item-1'];

    const mockSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await getClothingItemsByIds(mockItemIds);

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('should return error when database query fails', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    
    const mockItemIds = ['item-1'];
    const mockError = { message: 'Database query failed' };

    const mockSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await getClothingItemsByIds(mockItemIds);

    expect(result.data).toBeNull();
    expect(result.error).toBe(mockError.message);
  });

  it('should handle exceptions and return error', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    
    const mockItemIds = ['item-1'];

    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = await getClothingItemsByIds(mockItemIds);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unexpected error');
  });

  it('should handle non-Error exceptions', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    
    const mockItemIds = ['item-1'];

    vi.mocked(supabase.from).mockImplementation(() => {
      throw 'String error';
    });

    const result = await getClothingItemsByIds(mockItemIds);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unknown error');
  });

  it('should handle single item ID', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    
    const mockItemIds = ['item-1'];
    const mockItem = {
      id: 'item-1',
      user_id: 'user-123',
      name: 'Red Jacket',
      category: 'outerwear',
    };

    const mockSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({
        data: [mockItem],
        error: null,
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await getClothingItemsByIds(mockItemIds);

    expect(result.data).toEqual([mockItem]);
    expect(result.error).toBeNull();
  });
});

describe('updateClothingItem', () => {
  const mockUserId = 'user-123';
  const mockItemId = 'item-123';
  const mockOldImagePath = 'users/user-123/clothing/old-image.jpg';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update clothing item name', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Jacket Name',
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      name: 'Updated Jacket Name',
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('clothing_items');
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Jacket Name' });
  });

  it('should successfully update multiple fields', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
      brand: 'New Brand',
      color: 'red',
      size: 'L',
      material: 'cotton',
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      ...updateData,
      category: 'tops',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Updated Name',
      brand: 'New Brand',
      color: 'red',
      size: 'L',
      material: 'cotton',
    });
  });

  it('should upload new image and delete old image from storage', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'new-jacket.jpg', { type: 'image/jpeg' });
    const mockUploadResult = {
      path: 'users/user-123/clothing/new-jacket.jpg',
      publicUrl: 'https://example.com/new-jacket.jpg',
      signedUrl: 'https://example.com/signed/new-jacket.jpg',
    };

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
      image: mockFile,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      name: 'Updated Name',
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockRemove = vi.fn().mockResolvedValue({ error: null });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(uploadClothingImage).mockResolvedValue(mockUploadResult);
    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
    } as any);
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(uploadClothingImage).toHaveBeenCalledWith(mockFile, mockUserId);
    expect(supabase.storage.from).toHaveBeenCalledWith('clothing-images');
    expect(mockRemove).toHaveBeenCalledWith([mockOldImagePath]);
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Updated Name',
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
    });
  });

  it('should upload new image when no old image exists', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'new-jacket.jpg', { type: 'image/jpeg' });
    const mockUploadResult = {
      path: 'users/user-123/clothing/new-jacket.jpg',
      publicUrl: 'https://example.com/new-jacket.jpg',
      signedUrl: 'https://example.com/signed/new-jacket.jpg',
    };

    const updateData: UpdateClothingItemData = {
      image: mockFile,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(uploadClothingImage).mockResolvedValue(mockUploadResult);
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(uploadClothingImage).toHaveBeenCalledWith(mockFile, mockUserId);
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('should remove image from storage and set DB fields to null', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
      removeImage: true,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      name: 'Updated Name',
      image_path: null,
      image_url: null,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockRemove = vi.fn().mockResolvedValue({ error: null });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
    } as any);
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(supabase.storage.from).toHaveBeenCalledWith('clothing-images');
    expect(mockRemove).toHaveBeenCalledWith([mockOldImagePath]);
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Updated Name',
      image_path: null,
      image_url: null,
    });
  });

  it('should handle image removal when no old image exists', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      removeImage: true,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      image_path: null,
      image_url: null,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(supabase.storage.from).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      image_path: null,
      image_url: null,
    });
  });

  it('should prioritize new image upload over removeImage flag', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'new-jacket.jpg', { type: 'image/jpeg' });
    const mockUploadResult = {
      path: 'users/user-123/clothing/new-jacket.jpg',
      publicUrl: 'https://example.com/new-jacket.jpg',
      signedUrl: 'https://example.com/signed/new-jacket.jpg',
    };

    const updateData: UpdateClothingItemData = {
      image: mockFile,
      removeImage: true, // Should be ignored
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockRemove = vi.fn().mockResolvedValue({ error: null });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(uploadClothingImage).mockResolvedValue(mockUploadResult);
    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
    } as any);
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(uploadClothingImage).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([mockOldImagePath]);
    expect(mockUpdate).toHaveBeenCalledWith({
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
    });
  });

  it('should return error when image upload fails', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'new-jacket.jpg', { type: 'image/jpeg' });
    const mockUploadError = 'Failed to upload image';

    const updateData: UpdateClothingItemData = {
      image: mockFile,
    };

    const mockRemove = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(uploadClothingImage).mockResolvedValue({
      path: '',
      publicUrl: '',
      signedUrl: '',
      error: mockUploadError,
    });
    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toBeNull();
    expect(result.error).toBe(mockUploadError);
  });

  it('should return error when database update fails', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
    };

    const mockError = { message: 'Database update failed' };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toBeNull();
    expect(result.error).toBe(mockError.message);
  });

  it('should continue when storage deletion fails during image replacement', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadClothingImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'new-jacket.jpg', { type: 'image/jpeg' });
    const mockUploadResult = {
      path: 'users/user-123/clothing/new-jacket.jpg',
      publicUrl: 'https://example.com/new-jacket.jpg',
      signedUrl: 'https://example.com/signed/new-jacket.jpg',
    };

    const updateData: UpdateClothingItemData = {
      image: mockFile,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockRemove = vi.fn().mockResolvedValue({ 
      error: { message: 'Storage deletion failed' } 
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(uploadClothingImage).mockResolvedValue(mockUploadResult);
    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
    } as any);
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to delete old image:',
      expect.objectContaining({ message: 'Storage deletion failed' })
    );

    consoleWarnSpy.mockRestore();
  });

  it('should continue when storage deletion fails during image removal', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      removeImage: true,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      image_path: null,
      image_url: null,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockRemove = vi.fn().mockResolvedValue({ 
      error: { message: 'Storage deletion failed' } 
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockRemove,
    } as any);
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to delete image from storage:',
      expect.objectContaining({ message: 'Storage deletion failed' })
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle clearing optional fields with null', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    // Note: To clear fields, we need to explicitly pass null, not undefined
    // The code only includes fields that are explicitly set (not undefined)
    const updateData: UpdateClothingItemData = {
      subcategory: null,
      brand: null,
      color: null,
      notes: null,
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      subcategory: null,
      brand: null,
      color: null,
      notes: null,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      subcategory: null,
      brand: null,
      color: null,
      notes: null,
    });
  });

  it('should handle empty tags array by setting to null', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      tags: [],
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      tags: null,
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      tags: null,
    });
  });

  it('should handle tags array with values', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      tags: ['casual', 'summer', 'vintage'],
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      tags: ['casual', 'summer', 'vintage'],
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      tags: ['casual', 'summer', 'vintage'],
    });
  });

  it('should handle exceptions and return error', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
    };

    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unexpected error');
  });

  it('should handle non-Error exceptions', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
    };

    vi.mocked(supabase.from).mockImplementation(() => {
      throw 'String error';
    });

    const result = await updateClothingItem(mockItemId, mockUserId, updateData);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unknown error');
  });

  it('should not update image fields when neither new image nor removeImage is provided', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const updateData: UpdateClothingItemData = {
      name: 'Updated Name',
      brand: 'New Brand',
    };

    const mockUpdatedItem = {
      id: mockItemId,
      user_id: mockUserId,
      name: 'Updated Name',
      brand: 'New Brand',
      image_path: mockOldImagePath,
      image_url: 'https://example.com/old-image.jpg',
      category: 'outerwear',
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedItem,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    const result = await updateClothingItem(mockItemId, mockUserId, updateData, mockOldImagePath);

    expect(result.data).toEqual(mockUpdatedItem);
    expect(result.error).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Updated Name',
      brand: 'New Brand',
    });
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        image_path: expect.anything(),
        image_url: expect.anything(),
      })
    );
  });
});
