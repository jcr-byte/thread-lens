import { supabase } from '../supabase';
import { ApiSuccess } from './types';

/**
 * Generic toggle favorite function
 * Works with any table that has an 'is_favorite' boolean column
 * 
 * @param table - Database table name
 * @param itemId - Item ID to update
 * @param currentStatus - Current favorite status
 * @returns Promise with success status
 */
export async function toggleFavorite(
  table: string,
  itemId: string,
  currentStatus: boolean
): Promise<ApiSuccess> {
  try {
    const { error } = await supabase
      .from(table)
      .update({ is_favorite: !currentStatus })
      .eq('id', itemId);

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

/**
 * Generic delete function with optional storage cleanup
 * Deletes from database and optionally removes associated storage files
 * 
 * @param table - Database table name
 * @param itemId - Item ID to delete
 * @param storageBucket - Optional storage bucket name
 * @param imagePath - Optional image path to delete from storage
 * @returns Promise with success status
 */
export async function deleteItem(
  table: string,
  itemId: string,
  storageBucket?: string,
  imagePath?: string
): Promise<ApiSuccess> {
  try {
    // Delete image from storage if it exists
    if (storageBucket && imagePath) {
      const { error: storageError } = await supabase.storage
        .from(storageBucket)
        .remove([imagePath]);
      
      if (storageError) {
        console.error('Error deleting image:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', itemId);

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

