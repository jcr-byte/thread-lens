import OpenAI from 'openai';
import Replicate from 'replicate';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/**
 * Generate image embedding using CLIP via Replicate (768 dimensions)
 * Uses OpenAI's CLIP-ViT-Large-Patch14 model
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  try {
    const output = await replicate.run(
      "andreasjansson/clip-features:75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a",
      {
        input: {
          inputs: imageUrl,
        }
      }
    );
    
    // Extract embedding from Replicate response: [{ embedding: [...768 numbers...] }]
    if (!Array.isArray(output) || output.length === 0 || !output[0]?.embedding) {
      throw new Error('Invalid CLIP response format');
    }
    
    return output[0].embedding;
  } catch (error) {
    console.error('Error generating image embedding:', error);
    throw error;
  }
}

/**
 * Generate text embedding using OpenAI (512 dimensions)
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 512,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    throw error;
  }
}

/**
 * Create searchable text from item metadata
 */
export function createItemSearchText(item: {
  title?: string | null;
  category?: string | null;
  colors?: string[] | null;
  tags?: string[] | null;
  brand?: string | null;
  material?: string | null;
  notes?: string | null;
}): string {
  const parts = [
    item.title,
    item.category,
    item.brand,
    item.material,
    ...(item.colors || []),
    ...(item.tags || []),
    item.notes,
  ].filter(Boolean);
  
  return parts.join(' ').trim();
}

/**
 * Generate both embeddings for an item
 */
export async function generateItemEmbeddings(item: {
  image_url?: string | null;
  title?: string | null;
  category?: string | null;
  colors?: string[] | null;
  tags?: string[] | null;
  brand?: string | null;
  material?: string | null;
  notes?: string | null;
}): Promise<{
  v_image?: number[];
  v_text?: number[];
}> {
  const embeddings: {
    v_image?: number[];
    v_text?: number[];
  } = {};

  // Generate image embedding if image exists
  if (item.image_url) {
    try {
      embeddings.v_image = await generateImageEmbedding(item.image_url);
    } catch (error) {
      console.error('Failed to generate image embedding:', error);
      // Continue without image embedding
    }
  }

  // Generate text embedding if there's text content
  const searchText = createItemSearchText(item);
  if (searchText.length > 0) {
    try {
      embeddings.v_text = await generateTextEmbedding(searchText);
    } catch (error) {
      console.error('Failed to generate text embedding:', error);
      // Continue without text embedding
    }
  }

  return embeddings;
}

