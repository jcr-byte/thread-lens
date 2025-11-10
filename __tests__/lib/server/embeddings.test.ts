import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Mock Replicate - must be before importing embeddings module
vi.mock('replicate', () => {
  const mockRun = vi.fn();
  // Store reference globally so we can control it
  (global as any).__mockReplicateRun = mockRun;
  return {
    default: class Replicate {
      run = mockRun;
    },
  };
});

// Mock OpenAI - must be before importing embeddings module
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  // Store reference globally so we can control it
  (global as any).__mockOpenAICreate = mockCreate;
  return {
    default: class OpenAI {
      embeddings = {
        create: mockCreate,
      };
    },
  };
});

// Mock node-vibrant - must be before importing embeddings module
vi.mock('node-vibrant/node', () => {
  const mockGetPalette = vi.fn();
  // Store reference globally so we can control it
  (global as any).__mockVibrantGetPalette = mockGetPalette;
  return {
    Vibrant: class Vibrant {
      constructor(public imageUrl: string) {}
      getPalette = mockGetPalette;
    },
  };
});

// Import after mocks are set up
import {
  generateImageEmbedding,
  generateTextEmbedding,
  createItemSearchText,
  generateItemEmbeddings,
} from '@/app/lib/server/embeddings';
import { getColorPalette } from '@/app/lib/server/util/embeddings';

describe('embeddings', () => {
  // Get references to the mocked functions
  const getMockReplicateRun = () => (global as any).__mockReplicateRun;
  const getMockOpenAICreate = () => (global as any).__mockOpenAICreate;
  const getMockVibrantGetPalette = () => (global as any).__mockVibrantGetPalette;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateImageEmbedding', () => {
    it('should successfully generate image embedding', async () => {
      const mockEmbedding = Array(768).fill(0).map((_, i) => Math.random());
      const mockOutput = [{ embedding: mockEmbedding }];

      getMockReplicateRun().mockResolvedValue(mockOutput);

      const imageUrl = 'https://example.com/image.jpg';
      const result = await generateImageEmbedding(imageUrl);

      expect(result).toEqual(mockEmbedding);
      expect(getMockReplicateRun()).toHaveBeenCalledWith(
        "andreasjansson/clip-features:75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
        {
          input: {
            inputs: imageUrl,
          }
        })
    })

    it('should successfully generate color palette', async () => {
      const mockPalette = {
        Vibrant: { rgb: [255, 0, 0], hsl: [0, 100, 50] },
        Muted: { rgb: [128, 128, 128], hsl: [0, 0, 50] },
      };

      getMockVibrantGetPalette().mockResolvedValue(mockPalette);

      const imageUrl = 'https://example.com/image.jpg';
      const result = await getColorPalette(imageUrl);

      expect(result).toEqual(mockPalette);
      expect(getMockVibrantGetPalette()).toHaveBeenCalled();
    });


    it('should throw error when Replicate response is invalid (empty array)', async () => {
      getMockReplicateRun().mockResolvedValue([]);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(generateImageEmbedding('https://example.com/image.jpg')).rejects.toThrow(
        'Invalid CLIP response format'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when Replicate response has no embedding', async () => {
      getMockReplicateRun().mockResolvedValue([{}]);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(generateImageEmbedding('https://example.com/image.jpg')).rejects.toThrow(
        'Invalid CLIP response format'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when Replicate response is not an array', async () => {
      getMockReplicateRun().mockResolvedValue(null);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(generateImageEmbedding('https://example.com/image.jpg')).rejects.toThrow(
        'Invalid CLIP response format'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when Replicate API call fails', async () => {
      const mockError = new Error('Replicate API error');
      getMockReplicateRun().mockRejectedValue(mockError);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(generateImageEmbedding('https://example.com/image.jpg')).rejects.toThrow(
        'Replicate API error'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating image embedding:', mockError);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateTextEmbedding', () => {
    it('should successfully generate text embedding', async () => {
      const mockEmbedding = Array(512).fill(0).map((_, i) => Math.random());
      const mockResponse = {
        data: [
          {
            embedding: mockEmbedding,
          },
        ],
      };

      getMockOpenAICreate().mockResolvedValue(mockResponse);

      const text = 'blue denim jacket';
      const result = await generateTextEmbedding(text);

      expect(result).toEqual(mockEmbedding);
      expect(getMockOpenAICreate()).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 512,
      });
    });

    it('should throw error when OpenAI API call fails', async () => {
      const mockError = new Error('OpenAI API error');
      getMockOpenAICreate().mockRejectedValue(mockError);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(generateTextEmbedding('test text')).rejects.toThrow('OpenAI API error');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating text embedding:', mockError);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createItemSearchText', () => {
    it('should combine all fields into searchable text', () => {
      const item = {
        title: 'Blue Denim Jacket',
        category: 'outerwear',
        brand: 'Levi\'s',
        material: 'denim',
        colors: ['blue', 'navy'],
        tags: ['casual', 'winter'],
        notes: 'Perfect for layering',
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('Blue Denim Jacket outerwear Levi\'s denim blue navy casual winter Perfect for layering');
    });

    it('should handle missing optional fields', () => {
      const item = {
        title: 'T-Shirt',
        category: 'tops',
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('T-Shirt tops');
    });

    it('should filter out null and undefined values', () => {
      const item = {
        title: 'Jacket',
        category: 'outerwear',
        brand: null,
        material: undefined,
        colors: null,
        tags: undefined,
        notes: null,
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('Jacket outerwear');
    });

    it('should handle empty arrays', () => {
      const item = {
        title: 'Shirt',
        category: 'tops',
        colors: [],
        tags: [],
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('Shirt tops');
    });

    it('should return empty string when all fields are null or undefined', () => {
      const item = {
        title: null,
        category: undefined,
        brand: null,
        material: undefined,
        colors: null,
        tags: undefined,
        notes: null,
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('');
    });

    it('should handle single color array', () => {
      const item = {
        title: 'Red Dress',
        category: 'dresses',
        colors: ['red'],
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('Red Dress dresses red');
    });

    it('should handle multiple tags', () => {
      const item = {
        title: 'Sneakers',
        category: 'shoes',
        tags: ['casual', 'sport', 'comfortable'],
      };

      const result = createItemSearchText(item);
      
      expect(result).toBe('Sneakers shoes casual sport comfortable');
    });
  });

  describe('generateItemEmbeddings', () => {
    it('should generate both image and text embeddings when both are available', async () => {
      const mockImageEmbedding = Array(768).fill(0).map((_, i) => Math.random());
      const mockTextEmbedding = Array(512).fill(0).map((_, i) => Math.random());

      getMockReplicateRun().mockResolvedValue([{ embedding: mockImageEmbedding }]);
      getMockOpenAICreate().mockResolvedValue({
        data: [{ embedding: mockTextEmbedding }],
      });

      const item = {
        image_url: 'https://example.com/image.jpg',
        title: 'Blue Jacket',
        category: 'outerwear',
        brand: 'Levi\'s',
        colors: ['blue'],
        tags: ['casual'],
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toEqual(mockImageEmbedding);
      expect(result.v_text).toEqual(mockTextEmbedding);
    });

    it('should generate only image embedding when text is empty', async () => {
      const mockImageEmbedding = Array(768).fill(0).map((_, i) => Math.random());
      getMockReplicateRun().mockResolvedValue([{ embedding: mockImageEmbedding }]);

      const item = {
        image_url: 'https://example.com/image.jpg',
        // No text fields
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toEqual(mockImageEmbedding);
      expect(result.v_text).toBeUndefined();
      expect(getMockOpenAICreate()).not.toHaveBeenCalled();
    });

    it('should generate only text embedding when image is missing', async () => {
      const mockTextEmbedding = Array(512).fill(0).map((_, i) => Math.random());
      getMockOpenAICreate().mockResolvedValue({
        data: [{ embedding: mockTextEmbedding }],
      });

      const item = {
        title: 'Blue Jacket',
        category: 'outerwear',
        // No image_url
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toBeUndefined();
      expect(result.v_text).toEqual(mockTextEmbedding);
      expect(getMockReplicateRun()).not.toHaveBeenCalled();
    });

    it('should return empty object when both image and text are missing', async () => {
      const item = {
        // No image_url, no text fields
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toBeUndefined();
      expect(result.v_text).toBeUndefined();
      expect(getMockReplicateRun()).not.toHaveBeenCalled();
      expect(getMockOpenAICreate()).not.toHaveBeenCalled();
    });

    it('should continue without image embedding if image embedding fails', async () => {
      const mockTextEmbedding = Array(512).fill(0).map((_, i) => Math.random());
      
      getMockReplicateRun().mockRejectedValue(new Error('Image embedding failed'));
      getMockOpenAICreate().mockResolvedValue({
        data: [{ embedding: mockTextEmbedding }],
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const item = {
        image_url: 'https://example.com/image.jpg',
        title: 'Blue Jacket',
        category: 'outerwear',
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toBeUndefined();
      expect(result.v_text).toEqual(mockTextEmbedding);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to generate image embedding:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should continue without text embedding if text embedding fails', async () => {
      const mockImageEmbedding = Array(768).fill(0).map((_, i) => Math.random());
      
      getMockReplicateRun().mockResolvedValue([{ embedding: mockImageEmbedding }]);
      getMockOpenAICreate().mockRejectedValue(new Error('Text embedding failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const item = {
        image_url: 'https://example.com/image.jpg',
        title: 'Blue Jacket',
        category: 'outerwear',
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toEqual(mockImageEmbedding);
      expect(result.v_text).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to generate text embedding:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle null image_url', async () => {
      const mockTextEmbedding = Array(512).fill(0).map((_, i) => Math.random());
      getMockOpenAICreate().mockResolvedValue({
        data: [{ embedding: mockTextEmbedding }],
      });

      const item = {
        image_url: null,
        title: 'Blue Jacket',
        category: 'outerwear',
      };

      const result = await generateItemEmbeddings(item);

      expect(result.v_image).toBeUndefined();
      expect(result.v_text).toEqual(mockTextEmbedding);
      expect(getMockReplicateRun()).not.toHaveBeenCalled();
    });
  });
});

