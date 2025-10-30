import { supabase } from './supabase';
import { uploadOutfitImage } from './uploadImage';
import { Outfit, CreateOutfitData } from '../../types/outfit';
import { getUserItems, toggleFavorite, deleteItem, ApiResult, ApiSuccess } from './utils';

export async function createOutfit(
    userId: string,
    data: CreateOutfitData
): Promise<ApiResult<Outfit>> {
    try {
        let imagePath = '';
        let imageUrl = '';

        // Upload image if provided
        if (data.image) {
            const outfitId = crypto.randomUUID();
            const uploadResult = await uploadOutfitImage(data.image, outfitId);
            if (uploadResult.error) {
                return { data: null, error: uploadResult.error };
            }
            imagePath = uploadResult.path;
            imageUrl = uploadResult.publicUrl;
        }

        // Insert into database
        const { data: outfit, error } = await supabase
            .from('outfits')
            .insert({
                user_id: userId,
                name: data.name,
                description: data.description,
                clothing_item_ids: data.clothing_item_ids,
                tags: data.tags,
                occasion: data.occasion,
                season: data.season,
                image_path: imagePath,
                image_url: imageUrl,
                is_favorite: false,
                wear_count: 0,
            })
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: outfit, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getUserOutfits(
    userId: string
): Promise<ApiResult<Outfit[]>> {
    return getUserItems<Outfit>('outfits', userId);
}

export async function deleteOutfit(
    outfitId: string,
    imagePath?: string
): Promise<ApiSuccess> {
    return deleteItem('outfits', outfitId, 'outfit-images', imagePath);
}

export async function toggleFavoriteOutfit(
    outfitId: string,
    currentFavoriteStatus: boolean
): Promise<ApiSuccess> {
    return toggleFavorite('outfits', outfitId, currentFavoriteStatus);
}


