import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserItems } from '@/app/lib/api/utils/queries';
import type { ApiResult } from '@/app/lib/api/utils/types';

// Mock the Supabase client
vi.mock('@/app/lib/api/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('getUserItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data when query succeeds', async () => {
    // Arrange
    const mockData = [
      { id: '1', name: 'Test Item 1', user_id: 'user-123' },
      { id: '2', name: 'Test Item 2', user_id: 'user-123' },
    ];

    const { supabase } = await import('@/app/lib/api/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    } as any);

    // Act
    const result = await getUserItems('test_table', 'user-123');

    // Assert
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('test_table');
  });

  it('should return error when query fails', async () => {
    // Arrange
    const mockError = { message: 'Database error' };

    const { supabase } = await import('@/app/lib/api/supabase');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    } as any);

    // Act
    const result = await getUserItems('test_table', 'user-123');

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe('Database error');
  });
});

