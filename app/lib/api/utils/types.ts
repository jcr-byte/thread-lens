/**
 * Generic API result type for operations returning data
 */
export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Generic API result type for success/failure operations
 */
export type ApiSuccess = {
  success: boolean;
  error: string | null;
};

