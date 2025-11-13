import type { Palette } from '@vibrant/color';
import { Vibrant } from "node-vibrant/node";



export async function getColorPalette(imageUrl: string): Promise<Palette> {
    const vibrant = new Vibrant(imageUrl);
    const palette = await vibrant.getPalette();
    return palette;
}

