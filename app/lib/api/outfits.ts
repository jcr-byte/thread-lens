import { supabase } from './supabase';
import { uploadOutfitImage } from './uploadImage';
import { Outfit, CreateOutfitData } from '../../types/outfit';
import { getUserItems, toggleFavorite, deleteItem, ApiResult, ApiSuccess, generateOutfitSignature } from './utils';

export async function createOutfit(
    userId: string,
    data: CreateOutfitData
): Promise<ApiResult<Outfit>> {
    try {

        const outfitSignature = generateOutfitSignature(data.clothing_item_ids);

        // Check if outfit with same signature already exists
        const { data: existingOutfit, error: existingOutfitError } = await supabase
            .from('outfits')
            .select('id')
            .eq('user_id', userId)
            .eq('outfit_signature', outfitSignature)
            .single();

        if (existingOutfitError) {
            return { data: null, error: existingOutfitError.message };
        }

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
                outfit_signature: outfitSignature,
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

export interface UpdateOutfitData {
    name?: string;
    description?: string | null;
    clothing_item_ids?: string[];
    tags?: string[] | null;
    occasion?: string | null;
    season?: string | null;
    image?: File;
    removeImage?: boolean;
}

export async function updateOutfit(
    outfitId: string,
    data: UpdateOutfitData,
    oldImagePath?: string
): Promise<ApiResult<Outfit>> {
    try {
        let imagePath: string | undefined;
        let imageUrl: string | undefined;

        // Upload new image if provided (takes priority over removeImage)
        if (data.image) {
            // Delete old image if it exists
            if (oldImagePath) {
                const { error: deleteError } = await supabase.storage
                    .from('outfit-images')
                    .remove([oldImagePath]);
                
                if (deleteError) {
                    console.warn('Failed to delete old image:', deleteError);
                }
            }

            const uploadResult = await uploadOutfitImage(data.image, outfitId);
            if (uploadResult.error) {
                return { data: null, error: uploadResult.error };
            }
            imagePath = uploadResult.path;
            imageUrl = uploadResult.publicUrl;
        }
        // Handle image removal (only if no new image was provided)
        else if (data.removeImage && oldImagePath) {
            // Delete image from storage
            const { error: deleteError } = await supabase.storage
                .from('outfit-images')
                .remove([oldImagePath]);
            
            if (deleteError) {
                console.warn('Failed to delete image from storage:', deleteError);
            }
            
            // Set image fields to null
            imagePath = undefined;
            imageUrl = undefined;
        }

        // Prepare update data
        const updateData: any = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.clothing_item_ids !== undefined) updateData.clothing_item_ids = data.clothing_item_ids;
        if (data.tags !== undefined) updateData.tags = data.tags && data.tags.length > 0 ? data.tags : null;
        if (data.occasion !== undefined) updateData.occasion = data.occasion || null;
        if (data.season !== undefined) updateData.season = data.season || null;
        
        // Update image fields if new image was uploaded or image was removed
        if (imagePath && imageUrl) {
            // New image was uploaded
            updateData.image_path = imagePath;
            updateData.image_url = imageUrl;
        } else if (data.removeImage) {
            // Image was explicitly removed (no new image uploaded)
            updateData.image_path = null;
            updateData.image_url = null;
        }

        // Update in database
        const { data: updatedOutfit, error } = await supabase
            .from('outfits')
            .update(updateData)
            .eq('id', outfitId)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: updatedOutfit, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}


