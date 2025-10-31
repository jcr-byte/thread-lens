import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadImageToBucket,
  uploadUserImage,
  uploadOutfitImage,
  uploadClothingImage,
} from '@/app/lib/api/uploadImage';

// Mock the Supabase client
vi.mock('@/app/lib/api/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImageToBucket', () => {
    it('should successfully upload an image and return URLs', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
      const mockUploadData = { path: 'test/test-image.jpg' };
      const mockPublicUrl = 'https://example.com/public/test-image.jpg';
      const mockSignedUrl = 'https://example.com/signed/test-image.jpg';

      const mockUpload = vi.fn().mockResolvedValue({
        data: mockUploadData,
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const result = await uploadImageToBucket('test-bucket', mockFile);

      expect(result.path).toBe('test/test-image.jpg');
      expect(result.publicUrl).toBe(mockPublicUrl);
      expect(result.signedUrl).toBe(mockSignedUrl);
      expect(result.error).toBeUndefined();

      expect(supabase.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('test-image.jpg'),
        mockFile,
        { upsert: false, contentType: 'image/jpeg' }
      );
      expect(mockGetPublicUrl).toHaveBeenCalled();
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        expect.stringContaining('test-image.jpg'),
        3600
      );
    });

    it('should upload to specified folder when folder option is provided', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'custom-folder/test.jpg' },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/test.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadImageToBucket('test-bucket', mockFile, {
        folder: 'custom-folder',
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^custom-folder\//),
        mockFile,
        expect.any(Object)
      );
    });

    it('should use custom fileName when provided', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'original.jpg', { type: 'image/jpeg' });
      const customFileName = 'custom-name.jpg';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: customFileName },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/custom-name.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/custom-name.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadImageToBucket('test-bucket', mockFile, {
        fileName: customFileName,
      });

      expect(mockUpload).toHaveBeenCalledWith(
        customFileName,
        mockFile,
        expect.any(Object)
      );
    });

    it('should respect upsert option when provided', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test.jpg' },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/test.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadImageToBucket('test-bucket', mockFile, {
        upsert: true,
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.any(String),
        mockFile,
        { upsert: true, contentType: 'image/jpeg' }
      );
    });

    it('should use custom contentType when provided', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test.png' },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.png' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/test.png' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadImageToBucket('test-bucket', mockFile, {
        contentType: 'image/webp',
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.any(String),
        mockFile,
        { upsert: false, contentType: 'image/webp' }
      );
    });

    it('should return error when upload fails', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('Upload failed');

      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await uploadImageToBucket('test-bucket', mockFile);

      expect(result.path).toBe('');
      expect(result.publicUrl).toBe('');
      expect(result.signedUrl).toBe('');
      expect(result.error).toBe('Upload failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error uploading image', mockError);
      consoleErrorSpy.mockRestore();
    });

    it('should return error when signed URL creation fails', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('Signed URL creation failed');

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test.jpg' },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await uploadImageToBucket('test-bucket', mockFile);

      expect(result.path).toBe('');
      expect(result.publicUrl).toBe('');
      expect(result.signedUrl).toBe('');
      expect(result.error).toBe('Signed URL creation failed');

      consoleErrorSpy.mockRestore();
    });

    it('should return error when signed URL data is null', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test.jpg' },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await uploadImageToBucket('test-bucket', mockFile);

      expect(result.error).toBe('Failed to create signed URL');

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      vi.mocked(supabase.storage.from).mockImplementation(() => {
        throw 'String error';
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await uploadImageToBucket('test-bucket', mockFile);

      expect(result.path).toBe('');
      expect(result.publicUrl).toBe('');
      expect(result.signedUrl).toBe('');
      expect(result.error).toBe('Unknown error occurred');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('uploadUserImage', () => {
    it('should call uploadImageToBucket with correct parameters', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `users/${userId}/avatar.jpg` },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/avatar.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const result = await uploadUserImage(mockFile, userId);

      expect(supabase.storage.from).toHaveBeenCalledWith('user-images');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^users/${userId}/`)),
        mockFile,
        expect.any(Object)
      );
      expect(result.error).toBeUndefined();
    });

    it('should pass through additional options', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `users/${userId}/custom.jpg` },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/custom.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/custom.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadUserImage(mockFile, userId, {
        fileName: 'custom.jpg',
        upsert: true,
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('custom.jpg'),
        mockFile,
        { upsert: true, contentType: 'image/jpeg' }
      );
    });
  });

  describe('uploadOutfitImage', () => {
    it('should call uploadImageToBucket with correct parameters', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'outfit.jpg', { type: 'image/jpeg' });
      const outfitId = 'outfit-456';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `outfits/${outfitId}/outfit.jpg` },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/outfit.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/outfit.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const result = await uploadOutfitImage(mockFile, outfitId);

      expect(supabase.storage.from).toHaveBeenCalledWith('outfit-images');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^outfits/${outfitId}/`)),
        mockFile,
        expect.any(Object)
      );
      expect(result.error).toBeUndefined();
    });

    it('should pass through additional options', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'outfit.jpg', { type: 'image/jpeg' });
      const outfitId = 'outfit-456';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `outfits/${outfitId}/custom-outfit.jpg` },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/custom-outfit.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/custom-outfit.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadOutfitImage(mockFile, outfitId, {
        fileName: 'custom-outfit.jpg',
        contentType: 'image/png',
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('custom-outfit.jpg'),
        mockFile,
        { upsert: false, contentType: 'image/png' }
      );
    });
  });

  describe('uploadClothingImage', () => {
    it('should call uploadImageToBucket with correct parameters', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'shirt.jpg', { type: 'image/jpeg' });
      const userId = 'user-789';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `users/${userId}/clothing/shirt.jpg` },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/shirt.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/shirt.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const result = await uploadClothingImage(mockFile, userId);

      expect(supabase.storage.from).toHaveBeenCalledWith('clothing-images');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^users/${userId}/clothing/`)),
        mockFile,
        expect.any(Object)
      );
      expect(result.error).toBeUndefined();
    });

    it('should pass through additional options', async () => {
      const { supabase } = await import('@/app/lib/api/supabase');
      
      const mockFile = new File(['test'], 'shirt.jpg', { type: 'image/jpeg' });
      const userId = 'user-789';

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: `users/${userId}/clothing/custom-shirt.jpg` },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/custom-shirt.jpg' },
      });
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed/custom-shirt.jpg' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      await uploadClothingImage(mockFile, userId, {
        fileName: 'custom-shirt.jpg',
        upsert: true,
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('custom-shirt.jpg'),
        mockFile,
        { upsert: true, contentType: 'image/jpeg' }
      );
    });
  });
});

