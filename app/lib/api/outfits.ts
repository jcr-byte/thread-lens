import { supabase } from './supabase';
import { uploadOutfitImage } from './uploadImage';
import { Outfit, CreateOutfitData } from '../../types/outfit';

export async function createOutfit(
    userId: string,
    data: CreateOutfitData
): Promise<{ data: Outfit | null; error: string | null }> {
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
): Promise<{ data: Outfit[] | null; error: string | null }> {
    const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return { data: null, error: error.message };
    }

    return { data, error: null };
}

export async function deleteOutfit(
    outfitId: string,
    imagePath?: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        // Delete image from storage if it exists
        if (imagePath) {
            const { error: storageError } = await supabase.storage
                .from('outfit-images')
                .remove([imagePath]);
            
            if (storageError) {
                console.error('Error deleting image:', storageError);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete from database
        const { error } = await supabase
            .from('outfits')
            .delete()
            .eq('id', outfitId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function toggleFavoriteOutfit(
    outfitId: string,
    currentFavoriteStatus: boolean
): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await supabase
            .from('outfits')
            .update({ is_favorite: !currentFavoriteStatus })
            .eq('id', outfitId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}


