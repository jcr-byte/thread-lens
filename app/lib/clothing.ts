import { supabase } from './supabase';
import { uploadClothingImage } from './uploadImage';
import { ClothingItem, CreateClothingItemData } from '../types/clothing';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

export async function createClothingItem(
    userId: string,
    data: CreateClothingItemData
): Promise<{ data: ClothingItem | null; error: string | null }> {
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
): Promise<{ data: ClothingItem[] | null; error: string | null }> {
    const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return { data: null, error: error.message };
    }

    return { data, error: null };
}