export interface ClothingItem {
    id: string;
    user_id: string;
    name: string;
    category: ClothingCategory;
    subcategory?: string;
    brand?: string;
    color?: string;
    size?: string;
    material?: string;
    image_url?: string;
    image_path?: string;
    purchase_date?: string;
    price?: number;
    tags?: string[];
    notes?: string;
    is_favorite: boolean;
    wear_count: number;
    created_at: string;
    updated_at: string;
}

export type ClothingCategory = 
    | 'tops'
    | 'bottoms'
    | 'dresses'
    | 'outerwear'
    | 'shoes'
    | 'accessories'
    | 'undergarments'
    | 'activewear';

export interface CreateClothingItemData {
    name: string;
    category: ClothingCategory;
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
}