import { ApiResult } from './types';

/**
 * Wraps async operations with consistent error handling
 * Converts thrown errors into ApiResult format
 * @param fn - Async function to execute
 * @returns Promise with data or error
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Helper to handle image upload results
 * Throws error if upload failed, returns paths if successful
 * @param uploadResult - Result from upload function
 * @returns Object with imagePath and imageUrl
 * @throws Error if upload failed
 */
export function handleUploadResult(uploadResult: {
  path: string;
  publicUrl: string;
  error?: string;
}): { imagePath: string; imageUrl: string } {
  if (uploadResult.error) {
    throw new Error(uploadResult.error);
  }
  return {
    imagePath: uploadResult.path,
    imageUrl: uploadResult.publicUrl,
  };
}

