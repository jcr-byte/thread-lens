import { Outfit } from '@/app/types/outfit';
import { ClothingItem } from '@/app/types/clothing';
import type { Palette } from '@vibrant/color';
import { ScoredItem } from '../recommendations';

type MatchReport = {
  hueDeg: number;
  satDiff: number;
  lightDiff: number;
  neutralPair: boolean;
  warmCoolClash: boolean;
  verdict: number;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

export function isNeutralPair(s: number, threshold = 12): boolean {
  return s < threshold;
}

function isWarmColor(hue: number): boolean {
  return (hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360);
}

export function hueDistanceDegrees(hue1: number, hue2: number): number {
  const distance = Math.abs(hue1 - hue2) % 360;
  return distance > 180 ? 360 - distance : distance;
}

export function compareColors(a: Palette, b: Palette): MatchReport {
  if (!a.Vibrant || !b.Vibrant) {
    throw new Error('No vibrant color found');
  }

  const hsl1 = rgbToHsl(a.Vibrant.rgb[0], a.Vibrant.rgb[1], a.Vibrant.rgb[2]);
  const hsl2 = rgbToHsl(b.Vibrant.rgb[0], b.Vibrant.rgb[1], b.Vibrant.rgb[2]);

  const hueDeg = hueDistanceDegrees(hsl1.h, hsl2.h);

  const satDiff = Math.abs(hsl1.s - hsl2.s);
  const lightDiff = Math.abs(hsl1.l - hsl2.l);

  const neutralPair = isNeutralPair(hsl1.s) || isNeutralPair(hsl2.s);

  const warmCoolClash = isWarmColor(hsl1.h) !== isWarmColor(hsl2.h);

  let verdict: number;
  
  if (neutralPair) {
    verdict = 0.5;
  } else {
    const baseScore = Math.exp(-hueDeg / 60);

    const clashPenality = warmCoolClash && hueDeg > 60
      ? 0.3 * (hueDeg - 60) / 120
      : 0;

      verdict = Math.max(0, Math.min(1, baseScore - clashPenality));
  }

  return {
    hueDeg,
    satDiff,
    lightDiff,
    neutralPair,
    warmCoolClash,
    verdict,
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

export function calculateOutfitScore(clothingItems: ClothingItem[], baseItem: ClothingItem): ScoredItem[] {

  // metric weights (color, cosine similarity, etc.)
  const weights = {
    colorWeight: 0.7,
    occasionWeight: 0.5,
    embeddingSimilarityWeight: 0.2,
  };

  const scoredItems: ScoredItem[] = clothingItems
  .filter((item) => item.v_image && item.palette_hsl)
  .map((item) => {
    const cosineSim = cosineSimilarity(baseItem.v_image, item.v_image) * weights.embeddingSimilarityWeight;
    const colorCoh = compareColors(baseItem.palette_hsl, item.palette_hsl).verdict * weights.colorWeight;

    return {
      ...item,
      cosineSimilarity: cosineSim,
      colorCohesion: colorCoh,
      finalScore: cosineSim + colorCoh
    };
  });

  return scoredItems;
}