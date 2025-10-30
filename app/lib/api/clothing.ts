import { supabase } from './supabase';
import { uploadClothingImage } from './uploadImage';
import { ClothingItem, CreateClothingItemData } from '../../types/clothing';
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

