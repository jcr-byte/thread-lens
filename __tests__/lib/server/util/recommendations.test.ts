import { describe, it, expect } from 'vitest';
import { rgbToHsl } from '@/app/lib/server/util/recommendations';

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

