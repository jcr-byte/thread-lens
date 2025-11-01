import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOutfit } from '@/app/lib/api/outfits';
import type { CreateOutfitData } from '@/app/types/outfit';

// Mock the Supabase client
vi.mock('@/app/lib/api/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock the uploadImage module
vi.mock('@/app/lib/api/uploadImage', () => ({
  uploadOutfitImage: vi.fn(),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(),
});

describe('createOutfit', () => {
  const mockUserId = 'user-123';
  const mockOutfitData: CreateOutfitData = {
    name: 'Summer Beach Outfit',
    description: 'Perfect for a day at the beach',
    clothing_item_ids: ['item-1', 'item-2', 'item-3'],
    tags: ['casual', 'summer'],
    occasion: 'beach',
    season: 'summer',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create an outfit with an image', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');

    const mockOutfitId = 'outfit-uuid-123';
    const mockFile = new File(['image'], 'outfit.jpg', { type: 'image/jpeg' });
    const mockUploadResult = {
      path: 'outfits/outfit-uuid-123/outfit.jpg',
      publicUrl: 'https://example.com/outfit.jpg',
      signedUrl: 'https://example.com/signed/outfit.jpg',
    };
    const mockOutfit = {
      id: mockOutfitId,
      user_id: mockUserId,
      ...mockOutfitData,
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
      is_favorite: false,
      wear_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    };

    vi.mocked(crypto.randomUUID).mockReturnValue(mockOutfitId);
    vi.mocked(uploadOutfitImage).mockResolvedValue(mockUploadResult);

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockOutfit,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    const result = await createOutfit(mockUserId, {
      ...mockOutfitData,
      image: mockFile,
    });

    expect(result.data).toEqual(mockOutfit);
    expect(result.error).toBeNull();

    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(uploadOutfitImage).toHaveBeenCalledWith(mockFile, mockOutfitId);
    expect(supabase.from).toHaveBeenCalledWith('outfits');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: mockUserId,
      name: mockOutfitData.name,
      description: mockOutfitData.description,
      clothing_item_ids: mockOutfitData.clothing_item_ids,
      tags: mockOutfitData.tags,
      occasion: mockOutfitData.occasion,
      season: mockOutfitData.season,
      image_path: mockUploadResult.path,
      image_url: mockUploadResult.publicUrl,
      is_favorite: false,
      wear_count: 0,
    });
  });

  it('should successfully create an outfit without an image', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');

    const mockOutfit = {
      id: 'outfit-456',
      user_id: mockUserId,
      ...mockOutfitData,
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
          data: mockOutfit,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    const result = await createOutfit(mockUserId, mockOutfitData);

    expect(result.data).toEqual(mockOutfit);
    expect(result.error).toBeNull();

    expect(crypto.randomUUID).not.toHaveBeenCalled();
    expect(uploadOutfitImage).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUserId,
        name: mockOutfitData.name,
        clothing_item_ids: mockOutfitData.clothing_item_ids,
        image_path: '',
        image_url: '',
      })
    );
  });

  it('should return error when image upload fails', async () => {
    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');

    const mockOutfitId = 'outfit-uuid-789';
    const mockFile = new File(['image'], 'outfit.jpg', { type: 'image/jpeg' });
    const mockUploadError = 'Failed to upload outfit image';

    vi.mocked(crypto.randomUUID).mockReturnValue(mockOutfitId);
    vi.mocked(uploadOutfitImage).mockResolvedValue({
      path: '',
      publicUrl: '',
      signedUrl: '',
      error: mockUploadError,
    });

    const result = await createOutfit(mockUserId, {
      ...mockOutfitData,
      image: mockFile,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(mockUploadError);
    expect(crypto.randomUUID).toHaveBeenCalled();
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

    const result = await createOutfit(mockUserId, mockOutfitData);

    expect(result.data).toBeNull();
    expect(result.error).toBe(mockError.message);
  });

  it('should handle exceptions and return unknown error', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const result = await createOutfit(mockUserId, mockOutfitData);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unexpected error');
  });

  it('should handle non-Error exceptions', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    vi.mocked(supabase.from).mockImplementation(() => {
      throw 'String error';
    });

    const result = await createOutfit(mockUserId, mockOutfitData);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unknown error');
  });

  it('should create outfit with minimal required fields', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const minimalData: CreateOutfitData = {
      name: 'Simple Outfit',
      clothing_item_ids: ['item-1', 'item-2'],
    };

    const mockOutfit = {
      id: 'outfit-999',
      user_id: mockUserId,
      name: minimalData.name,
      clothing_item_ids: minimalData.clothing_item_ids,
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
          data: mockOutfit,
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    const result = await createOutfit(mockUserId, minimalData);

    expect(result.data).toEqual(mockOutfit);
    expect(result.error).toBeNull();

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: mockUserId,
      name: minimalData.name,
      description: undefined,
      clothing_item_ids: minimalData.clothing_item_ids,
      tags: undefined,
      occasion: undefined,
      season: undefined,
      image_path: '',
      image_url: '',
      is_favorite: false,
      wear_count: 0,
    });
  });

  it('should preserve all optional fields when provided', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');

    const fullData: CreateOutfitData = {
      name: 'Winter Formal Outfit',
      description: 'Elegant outfit for winter weddings',
      clothing_item_ids: ['item-1', 'item-2', 'item-3', 'item-4'],
      tags: ['formal', 'winter', 'elegant'],
      occasion: 'wedding',
      season: 'winter',
    };

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'outfit-full', ...fullData },
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    await createOutfit(mockUserId, fullData);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUserId,
        name: fullData.name,
        description: fullData.description,
        clothing_item_ids: fullData.clothing_item_ids,
        tags: fullData.tags,
        occasion: fullData.occasion,
        season: fullData.season,
      })
    );
  });

  it('should generate unique UUID for each outfit with image', async () => {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'outfit.jpg', { type: 'image/jpeg' });
    const firstUUID = 'uuid-first';
    const secondUUID = 'uuid-second';

    vi.mocked(crypto.randomUUID)
      .mockReturnValueOnce(firstUUID)
      .mockReturnValueOnce(secondUUID);

    vi.mocked(uploadOutfitImage).mockResolvedValue({
      path: 'path/to/image.jpg',
      publicUrl: 'https://example.com/image.jpg',
      signedUrl: 'https://example.com/signed/image.jpg',
    });

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'outfit-1' },
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    // First creation
    await createOutfit(mockUserId, { ...mockOutfitData, image: mockFile });
    expect(uploadOutfitImage).toHaveBeenCalledWith(mockFile, firstUUID);

    // Second creation
    await createOutfit(mockUserId, { ...mockOutfitData, image: mockFile });
    expect(uploadOutfitImage).toHaveBeenCalledWith(mockFile, secondUUID);
  });
});

