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

  /**
   * Helper function to set up all mocks needed for createOutfit tests
   * 
   * @param options Configuration for the test scenario
   * @returns Object containing all the mocks for assertions
   */
  async function setupCreateOutfitMocks(options: {
    // Duplicate check options
    duplicateExists?: boolean;
    duplicateCheckError?: { message: string };
    
    // Image upload options
    imageUploadResult?: {
      path: string;
      publicUrl: string;
      signedUrl?: string;
      error?: string;
    };
    imageUploadError?: string;
    
    // Database insert options
    insertResult?: any; // The outfit object to return
    insertError?: { message: string };
    
    // UUID for image uploads
    mockUUID?: string;
  } = {}) {
    const { supabase } = await import('@/app/lib/api/supabase');
    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');

    // Setup duplicate check mock
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: options.duplicateExists ? { id: 'existing-outfit-id' } : null,
      error: options.duplicateCheckError || null,
    });

    const mockEq2 = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    const mockEq1 = vi.fn().mockReturnValue({
      eq: mockEq2,
    });

    const duplicateCheckMock = {
      select: vi.fn().mockReturnValue({
        eq: mockEq1,
      }),
      maybeSingle: mockMaybeSingle,
    };

    // Setup insert mock
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: options.insertResult || null,
          error: options.insertError || null,
        }),
      }),
    });

    // Setup supabase.from mock
    vi.mocked(supabase.from).mockReturnValue({
      select: duplicateCheckMock.select,
      insert: mockInsert,
    } as any);

    // Setup image upload mock if provided
    if (options.imageUploadResult || options.imageUploadError) {
      const uploadResult = options.imageUploadError
        ? {
            path: '',
            publicUrl: '',
            signedUrl: '',
            error: options.imageUploadError,
          }
        : {
            path: options.imageUploadResult?.path || '',
            publicUrl: options.imageUploadResult?.publicUrl || '',
            signedUrl: options.imageUploadResult?.signedUrl || '',
            error: undefined,
          };
      
      vi.mocked(uploadOutfitImage).mockResolvedValue(uploadResult);
    }

    // Setup UUID mock if provided
    if (options.mockUUID) {
      vi.mocked(crypto.randomUUID).mockReturnValue(options.mockUUID);
    }

    return {
      duplicateCheckMock,
      mockInsert,
      mockMaybeSingle,
    };
  }

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
      outfit_signature: 'item-1,item-2,item-3',
    };

    const { mockInsert } = await setupCreateOutfitMocks({
      insertResult: mockOutfit,
      imageUploadResult: mockUploadResult,
      mockUUID: mockOutfitId,
    });

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
      outfit_signature: 'item-1,item-2,item-3',
    });
  });

  it('should successfully create an outfit without an image', async () => {

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
      outfit_signature: 'item-1,item-2,item-3',
    };

    const { mockInsert } = await setupCreateOutfitMocks({
      insertResult: mockOutfit,
    });

    const result = await createOutfit(mockUserId, mockOutfitData);

    expect(result.data).toEqual(mockOutfit);
    expect(result.error).toBeNull();

    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');
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
    const mockOutfitId = 'outfit-uuid-789';
    const mockFile = new File(['image'], 'outfit.jpg', { type: 'image/jpeg' });
    const mockUploadError = 'Failed to upload outfit image';

    await setupCreateOutfitMocks({
      imageUploadError: mockUploadError,
      mockUUID: mockOutfitId,
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
    const mockError = { message: 'Database error' };

    await setupCreateOutfitMocks({
      insertError: mockError,
    });

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

    const { mockInsert } = await setupCreateOutfitMocks({
      insertResult: mockOutfit,
    });

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
      outfit_signature: 'item-1,item-2',
    });
  });

  it('should preserve all optional fields when provided', async () => {
    const fullData: CreateOutfitData = {
      name: 'Winter Formal Outfit',
      description: 'Elegant outfit for winter weddings',
      clothing_item_ids: ['item-1', 'item-2', 'item-3', 'item-4'],
      tags: ['formal', 'winter', 'elegant'],
      occasion: 'wedding',
      season: 'winter',
    };

    const { mockInsert } = await setupCreateOutfitMocks({
      insertResult: { id: 'outfit-full', ...fullData },
    });

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
    const { uploadOutfitImage } = await import('@/app/lib/api/uploadImage');

    const mockFile = new File(['image'], 'outfit.jpg', { type: 'image/jpeg' });
    const firstUUID = 'uuid-first';
    const secondUUID = 'uuid-second';

    vi.mocked(crypto.randomUUID)
      .mockReturnValueOnce(firstUUID)
      .mockReturnValueOnce(secondUUID);

    await setupCreateOutfitMocks({
      insertResult: { id: 'outfit-1' },
      imageUploadResult: {
        path: 'path/to/image.jpg',
        publicUrl: 'https://example.com/image.jpg',
        signedUrl: 'https://example.com/signed/image.jpg',
      },
    });

    // First creation
    await createOutfit(mockUserId, { ...mockOutfitData, image: mockFile });
    expect(uploadOutfitImage).toHaveBeenCalledWith(mockFile, firstUUID);

    // Second creation
    await createOutfit(mockUserId, { ...mockOutfitData, image: mockFile });
    expect(uploadOutfitImage).toHaveBeenCalledWith(mockFile, secondUUID);
  });
});

