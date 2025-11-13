import { describe, it, expect } from 'vitest';
import { rgbToHsl, isNeutralPair, hueDistanceDegrees, compareColors } from '@/app/lib/server/util/recommendations';
import type { Palette } from '@vibrant/color';

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
    expect(result.verdict).toBe('neutral');
  });

  it('should return match for similar hues', () => {
    const red1 = createMockPalette([255, 0, 0]);
    const red2 = createMockPalette([255, 50, 50]);

    const result = compareColors(red1, red2);

    expect(result.verdict).toBe('match');
    expect(result.hueDeg).toBeLessThanOrEqual(30);
  });

  it('should return match for complementary colors within 90 degrees', () => {
    const red = createMockPalette([255, 0, 0]);
    const orange = createMockPalette([255, 165, 0]);

    const result = compareColors(red, orange);

    expect(result.verdict).toBe('match');
    expect(result.hueDeg).toBeLessThanOrEqual(90);
  });

  it('should return mismatch for warm/cool clash with large hue difference', () => {
    const red = createMockPalette([255, 0, 0]);
    const blue = createMockPalette([0, 0, 255]);

    const result = compareColors(red, blue);

    expect(result.warmCoolClash).toBe(true);
    expect(result.hueDeg).toBeGreaterThan(60);
    expect(result.verdict).toBe('mismatch');
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
    expect(['match', 'neutral', 'mismatch']).toContain(result.verdict);
  });
});

