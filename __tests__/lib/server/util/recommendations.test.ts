import { describe, it, expect } from 'vitest';
import { rgbToHsl, isNeutralPair, hueDistanceDegrees, compareColors, cosineSimilarity, calculateOutfitScore } from '@/app/lib/server/util/recommendations';
import type { Palette } from '@vibrant/color';
import type { ClothingItem } from '@/app/types/clothing';
import type { ScoredItem } from '@/app/lib/server/recommendations';

describe('rgbToHsl', () => {
  // Helper function to check HSL values with tolerance for floating point precision
  const expectHsl = (
    actual: { h: number; s: number; l: number },
    expected: { h: number; s: number; l: number },
    tolerance = 0.01
  ) => {
    expect(Math.abs(actual.h - expected.h)).toBeLessThan(tolerance);
    expect(Math.abs(actual.s - expected.s)).toBeLessThan(tolerance);
    expect(Math.abs(actual.l - expected.l)).toBeLessThan(tolerance);
  };

  describe('pure colors', () => {
    it('should convert pure red to HSL', () => {
      const result = rgbToHsl(255, 0, 0);
      expectHsl(result, { h: 0, s: 100, l: 50 });
    });

    it('should convert pure green to HSL', () => {
      const result = rgbToHsl(0, 255, 0);
      expectHsl(result, { h: 120, s: 100, l: 50 });
    });

    it('should convert pure blue to HSL', () => {
      const result = rgbToHsl(0, 0, 255);
      expectHsl(result, { h: 240, s: 100, l: 50 });
    });

    it('should convert cyan to HSL', () => {
      const result = rgbToHsl(0, 255, 255);
      expectHsl(result, { h: 180, s: 100, l: 50 });
    });

    it('should convert magenta to HSL', () => {
      const result = rgbToHsl(255, 0, 255);
      expectHsl(result, { h: 300, s: 100, l: 50 });
    });

    it('should convert yellow to HSL', () => {
      const result = rgbToHsl(255, 255, 0);
      expectHsl(result, { h: 60, s: 100, l: 50 });
    });
  });

  describe('grayscale colors', () => {
    it('should convert black to HSL', () => {
      const result = rgbToHsl(0, 0, 0);
      expectHsl(result, { h: 0, s: 0, l: 0 });
    });

    it('should convert white to HSL', () => {
      const result = rgbToHsl(255, 255, 255);
      expectHsl(result, { h: 0, s: 0, l: 100 });
    });

    it('should convert medium gray to HSL', () => {
      const result = rgbToHsl(128, 128, 128);
      expectHsl(result, { h: 0, s: 0, l: 50.2 }, 0.1);
    });

    it('should convert light gray to HSL', () => {
      const result = rgbToHsl(192, 192, 192);
      expectHsl(result, { h: 0, s: 0, l: 75.29 }, 0.1);
    });

    it('should convert dark gray to HSL', () => {
      const result = rgbToHsl(64, 64, 64);
      expectHsl(result, { h: 0, s: 0, l: 25.1 }, 0.1);
    });
  });

  describe('mixed colors', () => {
    it('should convert orange to HSL', () => {
      const result = rgbToHsl(255, 165, 0);
      expectHsl(result, { h: 38.82, s: 100, l: 50 }, 0.1);
    });

    it('should convert purple to HSL', () => {
      const result = rgbToHsl(128, 0, 128);
      expectHsl(result, { h: 300, s: 100, l: 25.1 }, 0.1);
    });

    it('should convert pink to HSL', () => {
      const result = rgbToHsl(255, 192, 203);
      expectHsl(result, { h: 349.52, s: 100, l: 87.65 }, 0.1);
    });

    it('should convert navy blue to HSL', () => {
      const result = rgbToHsl(0, 0, 128);
      expectHsl(result, { h: 240, s: 100, l: 25.1 }, 0.1);
    });

    it('should convert olive to HSL', () => {
      const result = rgbToHsl(128, 128, 0);
      expectHsl(result, { h: 60, s: 100, l: 25.1 }, 0.1);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum RGB values', () => {
      const result = rgbToHsl(0, 0, 0);
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(0);
    });

    it('should handle maximum RGB values', () => {
      const result = rgbToHsl(255, 255, 255);
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(100);
    });

    it('should handle single channel maximum', () => {
      const result = rgbToHsl(255, 0, 0);
      expectHsl(result, { h: 0, s: 100, l: 50 });
    });

    it('should handle two channels maximum', () => {
      const result = rgbToHsl(255, 255, 0);
      expectHsl(result, { h: 60, s: 100, l: 50 });
    });
  });

  describe('color accuracy', () => {
    it('should correctly calculate hue for red-dominant colors', () => {
      const result = rgbToHsl(200, 100, 50);
      expect(result.h).toBeGreaterThan(0);
      expect(result.h).toBeLessThan(60);
      expect(result.s).toBeGreaterThan(0);
      expect(result.l).toBeGreaterThan(0);
      expect(result.l).toBeLessThan(100);
    });

    it('should correctly calculate hue for green-dominant colors', () => {
      const result = rgbToHsl(50, 200, 100);
      expect(result.h).toBeGreaterThan(120);
      expect(result.h).toBeLessThan(180);
      expect(result.s).toBeGreaterThan(0);
      expect(result.l).toBeGreaterThan(0);
      expect(result.l).toBeLessThan(100);
    });

    it('should correctly calculate hue for blue-dominant colors', () => {
      const result = rgbToHsl(50, 100, 200);
      expect(result.h).toBeGreaterThan(200);
      expect(result.h).toBeLessThan(260);
      expect(result.s).toBeGreaterThan(0);
      expect(result.l).toBeGreaterThan(0);
      expect(result.l).toBeLessThan(100);
    });

    it('should return saturation of 0 for equal RGB values', () => {
      const result1 = rgbToHsl(100, 100, 100);
      expect(result1.s).toBe(0);

      const result2 = rgbToHsl(50, 50, 50);
      expect(result2.s).toBe(0);

      const result3 = rgbToHsl(200, 200, 200);
      expect(result3.s).toBe(0);
    });

    it('should return hue of 0 for grayscale colors', () => {
      const result1 = rgbToHsl(128, 128, 128);
      expect(result1.h).toBe(0);

      const result2 = rgbToHsl(64, 64, 64);
      expect(result2.h).toBe(0);
    });
  });

  describe('output range validation', () => {
    it('should return hue in range [0, 360)', () => {
      const testCases = [
        [255, 0, 0],    // Red
        [0, 255, 0],    // Green
        [0, 0, 255],    // Blue
        [255, 255, 0],  // Yellow
        [255, 0, 255],  // Magenta
        [0, 255, 255],  // Cyan
        [128, 64, 192], // Mixed
      ];

      testCases.forEach(([r, g, b]) => {
        const result = rgbToHsl(r, g, b);
        expect(result.h).toBeGreaterThanOrEqual(0);
        expect(result.h).toBeLessThan(360);
      });
    });

    it('should return saturation in range [0, 100]', () => {
      const testCases = [
        [255, 0, 0],    // Pure color
        [128, 128, 128], // Grayscale
        [200, 100, 50],  // Mixed
      ];

      testCases.forEach(([r, g, b]) => {
        const result = rgbToHsl(r, g, b);
        expect(result.s).toBeGreaterThanOrEqual(0);
        expect(result.s).toBeLessThanOrEqual(100);
      });
    });

    it('should return lightness in range [0, 100]', () => {
      const testCases = [
        [0, 0, 0],       // Black
        [255, 255, 255], // White
        [128, 128, 128], // Gray
        [255, 0, 0],     // Red
      ];

      testCases.forEach(([r, g, b]) => {
        const result = rgbToHsl(r, g, b);
        expect(result.l).toBeGreaterThanOrEqual(0);
        expect(result.l).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('isNeutralPair', () => {
  it('should return true for low saturation values', () => {
    expect(isNeutralPair(5)).toBe(true);
    expect(isNeutralPair(10)).toBe(true);
    expect(isNeutralPair(11.9)).toBe(true);
  });

  it('should return false for high saturation values', () => {
    expect(isNeutralPair(12)).toBe(false);
    expect(isNeutralPair(50)).toBe(false);
    expect(isNeutralPair(100)).toBe(false);
  });

  it('should use custom threshold when provided', () => {
    expect(isNeutralPair(15, 20)).toBe(true);
    expect(isNeutralPair(25, 20)).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isNeutralPair(0)).toBe(true);
    expect(isNeutralPair(12)).toBe(false);
    expect(isNeutralPair(12.1)).toBe(false);
  });
});

describe('hueDistanceDegrees', () => {
  it('should calculate distance for close hues', () => {
    expect(hueDistanceDegrees(0, 10)).toBe(10);
    expect(hueDistanceDegrees(50, 60)).toBe(10);
    expect(hueDistanceDegrees(100, 120)).toBe(20);
  });

  it('should calculate shortest path around color wheel', () => {
    expect(hueDistanceDegrees(10, 350)).toBe(20);
    expect(hueDistanceDegrees(350, 10)).toBe(20);
  });

  it('should handle opposite colors correctly', () => {
    expect(hueDistanceDegrees(0, 180)).toBe(180);
    expect(hueDistanceDegrees(90, 270)).toBe(180);
  });

  it('should return 0 for identical hues', () => {
    expect(hueDistanceDegrees(0, 0)).toBe(0);
    expect(hueDistanceDegrees(180, 180)).toBe(0);
    expect(hueDistanceDegrees(359, 359)).toBe(0);
  });

  it('should handle large differences correctly', () => {
    expect(hueDistanceDegrees(0, 200)).toBe(160);
    expect(hueDistanceDegrees(200, 0)).toBe(160);
  });

  it('should handle values near 360 boundary', () => {
    expect(hueDistanceDegrees(350, 10)).toBe(20);
    expect(hueDistanceDegrees(10, 350)).toBe(20);
    expect(hueDistanceDegrees(355, 5)).toBe(10);
  });
});

describe('compareColors', () => {
  const createMockPalette = (rgb: [number, number, number]): Palette => {
    return {
      Vibrant: {
        rgb,
        hsl: rgbToHsl(rgb[0], rgb[1], rgb[2]),
        hex: `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`,
        population: 1000,
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        titleTextColor: '#000000',
        bodyTextColor: '#000000',
        toJSON: () => ({ rgb, population: 1000 }),
      } as any,
      Muted: null,
      DarkVibrant: null,
      DarkMuted: null,
      LightVibrant: null,
      LightMuted: null,
    };
  };

  it('should throw error when Vibrant is missing', () => {
    const palette1: Palette = {
      Vibrant: null,
      Muted: null,
      DarkVibrant: null,
      DarkMuted: null,
      LightVibrant: null,
      LightMuted: null,
    };
    const palette2 = createMockPalette([255, 0, 0]);

    expect(() => compareColors(palette1, palette2)).toThrow('No vibrant color found');
    expect(() => compareColors(palette2, palette1)).toThrow('No vibrant color found');
  });

  it('should return neutral verdict for low saturation colors', () => {
    const gray1 = createMockPalette([128, 128, 128]);
    const gray2 = createMockPalette([100, 100, 100]);

    const result = compareColors(gray1, gray2);

    expect(result.neutralPair).toBe(true);
    expect(result.verdict).toBe(0.5); // Neutral pairs return 0.5
  });

  it('should return match for similar hues', () => {
    const red1 = createMockPalette([255, 0, 0]);
    const red2 = createMockPalette([255, 50, 50]);

    const result = compareColors(red1, red2);

    expect(result.verdict).toBeGreaterThan(0.7); // Similar colors should have high verdict (close to 1)
    expect(result.hueDeg).toBeLessThanOrEqual(30);
  });

  it('should return match for complementary colors within 90 degrees', () => {
    const red = createMockPalette([255, 0, 0]);
    const orange = createMockPalette([255, 165, 0]);

    const result = compareColors(red, orange);

    expect(result.verdict).toBeGreaterThan(0.3); // Complementary colors within 90 degrees should have decent verdict
    expect(result.hueDeg).toBeLessThanOrEqual(90);
  });

  it('should return mismatch for warm/cool clash with large hue difference', () => {
    const red = createMockPalette([255, 0, 0]);
    const blue = createMockPalette([0, 0, 255]);

    const result = compareColors(red, blue);

    expect(result.warmCoolClash).toBe(true);
    expect(result.hueDeg).toBeGreaterThan(60);
    expect(result.verdict).toBeLessThan(0.3); // Warm/cool clashes with large hue difference should have low verdict
  });

  it('should calculate correct hue distance', () => {
    const red = createMockPalette([255, 0, 0]);
    const green = createMockPalette([0, 255, 0]);

    const result = compareColors(red, green);

    expect(result.hueDeg).toBe(120);
  });

  it('should calculate saturation and lightness differences', () => {
    const color1 = createMockPalette([255, 0, 0]);
    const color2 = createMockPalette([128, 128, 128]);

    const result = compareColors(color1, color2);

    expect(result.satDiff).toBeGreaterThanOrEqual(0);
    expect(result.lightDiff).toBeGreaterThanOrEqual(0);
  });

  it('should handle warm colors correctly', () => {
    const red = createMockPalette([255, 0, 0]);
    const yellow = createMockPalette([255, 255, 0]);

    const result = compareColors(red, yellow);

    expect(result.warmCoolClash).toBe(false);
  });

  it('should handle cool colors correctly', () => {
    const blue = createMockPalette([0, 0, 255]);
    const green = createMockPalette([0, 255, 0]);

    const result = compareColors(blue, green);

    expect(result.warmCoolClash).toBe(false);
  });

  it('should return all required fields in MatchReport', () => {
    const palette1 = createMockPalette([255, 0, 0]);
    const palette2 = createMockPalette([0, 255, 0]);

    const result = compareColors(palette1, palette2);

    expect(result).toHaveProperty('hueDeg');
    expect(result).toHaveProperty('satDiff');
    expect(result).toHaveProperty('lightDiff');
    expect(result).toHaveProperty('neutralPair');
    expect(result).toHaveProperty('warmCoolClash');
    expect(result).toHaveProperty('verdict');
    expect(typeof result.verdict).toBe('number');
    expect(result.verdict).toBeGreaterThanOrEqual(0);
    expect(result.verdict).toBeLessThanOrEqual(1);
  });
});

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vec = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(vec, vec)).toBe(1);
  });

  it('should return 1 for proportional vectors', () => {
    const vec1 = [1, 2, 3];
    const vec2 = [2, 4, 6]; // 2x vec1
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1, 10);
  });

  it('should return 0 for orthogonal vectors', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    expect(cosineSimilarity(vec1, vec2)).toBe(0);
  });

  it('should return 0 for mismatched lengths', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it('should return 0 for zero vectors', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
    expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('should return 0 for null or undefined inputs', () => {
    expect(cosineSimilarity(null as any, [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], null as any)).toBe(0);
    expect(cosineSimilarity(undefined as any, [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], undefined as any)).toBe(0);
  });

  it('should calculate correct similarity for similar vectors', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0.8, 0.6, 0];
    // Dot product: 0.8
    // Magnitude vec1: 1
    // Magnitude vec2: sqrt(0.64 + 0.36) = 1
    // Result: 0.8 / (1 * 1) = 0.8
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0.8, 10);
  });

  it('should calculate correct similarity for opposite vectors', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [-1, 0, 0];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1, 10);
  });

  it('should handle negative values correctly', () => {
    const vec1 = [1, -1, 0];
    const vec2 = [-1, 1, 0];
    // Dot product: -1 - 1 + 0 = -2
    // Magnitude vec1: sqrt(1 + 1) = sqrt(2)
    // Magnitude vec2: sqrt(1 + 1) = sqrt(2)
    // Result: -2 / (sqrt(2) * sqrt(2)) = -2 / 2 = -1
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1, 10);
  });

  it('should handle large vectors', () => {
    const vec1 = Array(768).fill(0.1);
    const vec2 = Array(768).fill(0.2);
    // Both vectors are constant, so they're proportional
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1, 10);
  });

  it('should return values in range [-1, 1]', () => {
    const testCases = [
      [[1, 0, 0], [1, 0, 0]], // Same direction
      [[1, 0, 0], [0, 1, 0]], // Orthogonal
      [[1, 0, 0], [-1, 0, 0]], // Opposite
      [[1, 1, 0], [1, 0, 0]], // 45 degrees
    ];

    testCases.forEach(([a, b]) => {
      const result = cosineSimilarity(a, b);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});

describe('calculateOutfitScore', () => {
  const createMockPalette = (rgb: [number, number, number]): Palette => {
    return {
      Vibrant: {
        rgb,
        hsl: rgbToHsl(rgb[0], rgb[1], rgb[2]),
        hex: `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`,
        population: 1000,
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        titleTextColor: '#000000',
        bodyTextColor: '#000000',
        toJSON: () => ({ rgb, population: 1000 }),
      } as any,
      Muted: null,
      DarkVibrant: null,
      DarkMuted: null,
      LightVibrant: null,
      LightMuted: null,
    };
  };

  const createMockItem = (id: string, v_image: number[], palette: Palette): ClothingItem => ({
    id,
    user_id: 'user-1',
    name: `Item ${id}`,
    category: 'tops',
    is_favorite: false,
    wear_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    v_image,
    v_text: [],
    palette_hsl: palette,
  });

  it('should filter out items without v_image', () => {
    const baseItem = createMockItem('base', [1, 2, 3], createMockPalette([255, 0, 0]));
    const items: ClothingItem[] = [
      createMockItem('valid', [1, 2, 3], createMockPalette([255, 0, 0])),
      { ...createMockItem('no-image', [1, 2, 3], createMockPalette([255, 0, 0])), v_image: undefined as any },
    ];

    const result = calculateOutfitScore(items, baseItem);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('should filter out items without palette_hsl', () => {
    const baseItem = createMockItem('base', [1, 2, 3], createMockPalette([255, 0, 0]));
    const items: ClothingItem[] = [
      createMockItem('valid', [1, 2, 3], createMockPalette([255, 0, 0])),
      { ...createMockItem('no-palette', [1, 2, 3], createMockPalette([255, 0, 0])), palette_hsl: undefined as any },
    ];

    const result = calculateOutfitScore(items, baseItem);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('should filter out items without both v_image and palette_hsl', () => {
    const baseItem = createMockItem('base', [1, 2, 3], createMockPalette([255, 0, 0]));
    const items: ClothingItem[] = [
      createMockItem('valid', [1, 2, 3], createMockPalette([255, 0, 0])),
      { ...createMockItem('invalid', [1, 2, 3], createMockPalette([255, 0, 0])), v_image: undefined as any, palette_hsl: undefined as any },
    ];

    const result = calculateOutfitScore(items, baseItem);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('should calculate scores correctly', () => {
    const baseItem = createMockItem('base', [1, 0, 0], createMockPalette([255, 0, 0]));
    const items = [
      createMockItem('similar', [1, 0, 0], createMockPalette([255, 50, 50])), // Same vector, similar color
    ];

    const result = calculateOutfitScore(items, baseItem);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('cosineSimilarity');
    expect(result[0]).toHaveProperty('colorCohesion');
    expect(result[0]).toHaveProperty('finalScore');
    expect(result[0].finalScore).toBe(result[0].cosineSimilarity + result[0].colorCohesion);
  });

  it('should apply weights correctly', () => {
    const baseItem = createMockItem('base', [1, 0, 0], createMockPalette([255, 0, 0]));
    const items = [createMockItem('item', [1, 0, 0], createMockPalette([255, 0, 0]))];

    const result = calculateOutfitScore(items, baseItem);
    
    // cosineSimilarity should be weighted by 0.2
    const rawCosine = cosineSimilarity(baseItem.v_image, items[0].v_image);
    expect(result[0].cosineSimilarity).toBeCloseTo(rawCosine * 0.2, 5);
    
    // colorCohesion should be weighted by 0.7
    const rawColor = compareColors(baseItem.palette_hsl, items[0].palette_hsl).verdict;
    expect(result[0].colorCohesion).toBeCloseTo(rawColor * 0.7, 5);
  });

  it('should handle empty array', () => {
    const baseItem = createMockItem('base', [1, 2, 3], createMockPalette([255, 0, 0]));
    const result = calculateOutfitScore([], baseItem);
    expect(result).toEqual([]);
  });

  it('should preserve all item properties in result', () => {
    const baseItem = createMockItem('base', [1, 2, 3], createMockPalette([255, 0, 0]));
    const items = [createMockItem('item', [1, 2, 3], createMockPalette([255, 0, 0]))];

    const result = calculateOutfitScore(items, baseItem);
    expect(result[0].id).toBe('item');
    expect(result[0].name).toBe('Item item');
    expect(result[0].category).toBe('tops');
    expect(result[0].user_id).toBe('user-1');
    expect(result[0].is_favorite).toBe(false);
  });

  it('should calculate finalScore as sum of cosineSimilarity and colorCohesion', () => {
    const baseItem = createMockItem('base', [1, 0, 0], createMockPalette([255, 0, 0]));
    const items = [
      createMockItem('item1', [1, 0, 0], createMockPalette([255, 0, 0])),
      createMockItem('item2', [0, 1, 0], createMockPalette([0, 255, 0])),
    ];

    const result = calculateOutfitScore(items, baseItem);
    
    result.forEach(item => {
      expect(item.finalScore).toBeCloseTo(item.cosineSimilarity + item.colorCohesion, 10);
    });
  });

  it('should handle multiple items correctly', () => {
    const baseItem = createMockItem('base', [1, 0, 0], createMockPalette([255, 0, 0]));
    const items = [
      createMockItem('item1', [1, 0, 0], createMockPalette([255, 0, 0])),
      createMockItem('item2', [0, 1, 0], createMockPalette([0, 255, 0])),
      createMockItem('item3', [0, 0, 1], createMockPalette([0, 0, 255])),
    ];

    const result = calculateOutfitScore(items, baseItem);
    expect(result).toHaveLength(3);
    
    // All items should have scoring properties
    result.forEach(item => {
      expect(item).toHaveProperty('cosineSimilarity');
      expect(item).toHaveProperty('colorCohesion');
      expect(item).toHaveProperty('finalScore');
      expect(typeof item.cosineSimilarity).toBe('number');
      expect(typeof item.colorCohesion).toBe('number');
      expect(typeof item.finalScore).toBe('number');
    });
  });

  it('should return ScoredItem type with all required properties', () => {
    const baseItem = createMockItem('base', [1, 2, 3], createMockPalette([255, 0, 0]));
    const items = [createMockItem('item', [1, 2, 3], createMockPalette([255, 0, 0]))];

    const result = calculateOutfitScore(items, baseItem);
    const scoredItem: ScoredItem = result[0];
    
    // Verify it extends ClothingItem
    expect(scoredItem.id).toBe('item');
    expect(scoredItem.name).toBe('Item item');
    
    // Verify it has ScoredItem properties
    expect(scoredItem.cosineSimilarity).toBeDefined();
    expect(scoredItem.colorCohesion).toBeDefined();
    expect(scoredItem.finalScore).toBeDefined();
  });
});

