import { supabase } from './supabase';
import { uploadClothingImage } from './uploadImage';
import { ClothingItem, CreateClothingItemData, ClothingCategory } from '../../types/clothing';
import { getUserItems, toggleFavorite, deleteItem, ApiResult, ApiSuccess } from './utils';

export async function createClothingItem(
    userId: string,
    data: CreateClothingItemData
): Promise<ApiResult<ClothingItem>> {
    try {
        let imagePath = '';
        let imageUrl = '';

        // Upload image if provided
        if (data.image) {
            const uploadResult = await uploadClothingImage(data.image, userId);
            if (uploadResult.error) {
                return { data: null, error: uploadResult.error };
            }
            imagePath = uploadResult.path;
            imageUrl = uploadResult.publicUrl;
        }

        // Insert into database
        const { data: item, error } = await supabase
            .from('clothing_items')
            .insert({
                user_id: userId,
                name: data.name,
                category: data.category,
                subcategory: data.subcategory,
                brand: data.brand,
                color: data.color,
                size: data.size,
                material: data.material,
                image_path: imagePath,
                image_url: imageUrl,
                purchase_date: data.purchase_date,
                price: data.price,
                tags: data.tags,
                notes: data.notes,
            })
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: item, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getUserClothingItems(
    userId: string
): Promise<ApiResult<ClothingItem[]>> {
    return getUserItems<ClothingItem>('clothing_items', userId);
}

export async function getClothingItemsByIds(
    itemIds: string[]
): Promise<ApiResult<ClothingItem[]>> {
    try {
        if (itemIds.length === 0) {
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from('clothing_items')
            .select('*')
            .in('id', itemIds);

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: data || [], error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function deleteClothingItem(
    itemId: string,
    imagePath?: string
): Promise<ApiSuccess> {
    return deleteItem('clothing_items', itemId, 'clothing-images', imagePath);
}

export async function toggleFavoriteClothingItem(
    itemId: string,
    currentFavoriteStatus: boolean
): Promise<ApiSuccess> {
    return toggleFavorite('clothing_items', itemId, currentFavoriteStatus);
}

export interface UpdateClothingItemData {
    name?: string;
    category?: ClothingCategory;
    subcategory?: string;
    brand?: string;
    color?: string;
    size?: string;
    material?: string;
    purchase_date?: string;
    price?: number;
    tags?: string[];
    notes?: string;
    image?: File;
    removeImage?: boolean;
}

export async function updateClothingItem(
    itemId: string,
    userId: string,
    data: UpdateClothingItemData,
    oldImagePath?: string
): Promise<ApiResult<ClothingItem>> {
    try {
        let imagePath: string | undefined;
        let imageUrl: string | undefined;

        // Handle image removal
        if (data.removeImage && oldImagePath) {
            // Delete image from storage
            const { error: deleteError } = await supabase.storage
                .from('clothing-images')
                .remove([oldImagePath]);
            
            if (deleteError) {
                console.warn('Failed to delete image from storage:', deleteError);
            }
            
            // Set image fields to null
            imagePath = undefined;
            imageUrl = undefined;
        }
        // Upload new image if provided
        else if (data.image) {
            // Delete old image if it exists
            if (oldImagePath) {
                const { error: deleteError } = await supabase.storage
                    .from('clothing-images')
                    .remove([oldImagePath]);
                
                if (deleteError) {
                    console.warn('Failed to delete old image:', deleteError);
                }
            }

            const uploadResult = await uploadClothingImage(data.image, userId);
            if (uploadResult.error) {
                return { data: null, error: uploadResult.error };
            }
            imagePath = uploadResult.path;
            imageUrl = uploadResult.publicUrl;
        }

        // Prepare update data
        const updateData: any = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.subcategory !== undefined) updateData.subcategory = data.subcategory || null;
        if (data.brand !== undefined) updateData.brand = data.brand || null;
        if (data.color !== undefined) updateData.color = data.color || null;
        if (data.size !== undefined) updateData.size = data.size || null;
        if (data.material !== undefined) updateData.material = data.material || null;
        if (data.purchase_date !== undefined) updateData.purchase_date = data.purchase_date || null;
        if (data.price !== undefined) updateData.price = data.price || null;
        if (data.tags !== undefined) updateData.tags = data.tags && data.tags.length > 0 ? data.tags : null;
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        
        // Update image fields if new image was uploaded or image was removed
        if (data.removeImage) {
            updateData.image_path = null;
            updateData.image_url = null;
        } else if (imagePath && imageUrl) {
            updateData.image_path = imagePath;
            updateData.image_url = imageUrl;
        }

        // Update in database
        const { data: item, error } = await supabase
            .from('clothing_items')
            .update(updateData)
            .eq('id', itemId)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: item, error: null };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

