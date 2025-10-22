export interface Outfit {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    image_url?: string;
    image_path?: string;
    clothing_item_ids: string[];
    tags?: string[];
    occasion?: string;
    season?: string;
    is_favorite: boolean;
    wear_count: number;
    created_at: string;
    updated_at: string;
}

export interface CreateOutfitData {
    name: string;
    description?: string;
    clothing_item_ids: string[];
    tags?: string[];
    occasion?: string;
    season?: string;
    image?: File;
}


