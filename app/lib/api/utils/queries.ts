import { supabase } from '../supabase';
import { ApiResult } from './types';

/**
 * Generic function to get user's items from any table
 * Automatically orders by created_at descending
 * 
 * @param table - Database table name
 * @param userId - User ID to filter by
 * @returns Promise with array of items or error
 */
export async function getUserItems<T>(
  table: string,
  userId: string
): Promise<ApiResult<T[]>> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

