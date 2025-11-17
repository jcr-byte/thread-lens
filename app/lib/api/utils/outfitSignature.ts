/**
 * Utility functions for generating and working with outfit signatures
 * Signatures are used for fast duplicate outfit detection
 */

/**
 * Generates a canonical signature from an array of clothing item IDs
 * The signature is order-independent: same IDs in any order produce the same signature
 * 
 * @param clothingItemIds - Array of clothing item IDs
 * @returns Canonical signature string (sorted IDs joined by comma)
 * 
 * @example
 * generateOutfitSignature(["id3", "id1", "id2"]) // Returns "id1,id2,id3"
 * generateOutfitSignature(["id2", "id1", "id3"]) // Returns "id1,id2,id3" (same result)
 */
export function generateOutfitSignature(clothingItemIds: string[]): string {
  if (!clothingItemIds || clothingItemIds.length === 0) {
    return '';
  }
  
  // Sort IDs alphabetically to ensure order-independence
  const sortedIds = [...clothingItemIds].sort();
  
  // Join with comma delimiter
  return sortedIds.join(',');
}

/**
 * Validates that a signature matches the expected format
 * Useful for debugging and data integrity checks
 * 
 * @param signature - Signature string to validate
 * @returns True if signature is valid (non-empty, contains only UUIDs/IDs separated by commas)
 */
export function isValidOutfitSignature(signature: string): boolean {
  if (!signature || signature.trim() === '') {
    return false;
  }
  
  // Check format: should be comma-separated IDs
  // Basic validation: should contain only alphanumeric, hyphens, underscores, and commas
  const signaturePattern = /^[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]+)*$/;
  return signaturePattern.test(signature);
}


export function parseOutfitSignature(signature: string): string[] {
  if (!signature || signature.trim() === '') {
    return [];
  }

  return signature.split(',');
}
