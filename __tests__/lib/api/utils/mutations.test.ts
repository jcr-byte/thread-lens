import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFavorite, deleteItem } from '@/app/lib/api/utils';

vi.mock('@/app/lib/api/supabase', () => ({
    supabase: {
        from: vi.fn(),
        storage: {
            from: vi.fn(),
        },
    },
}));

describe('mutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('toggleFavorite', () => {
        it('should successfully toggle favorite to true', async () => {
            const { supabase } = await import('@/app/lib/api/supabase');

            const mockEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

            vi.mocked(supabase.from).mockReturnValue({
                update: mockUpdate,
            } as any);

            const result = await toggleFavorite('clothing_items', 'item-123', false);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();

            expect(mockUpdate).toHaveBeenCalledWith({ is_favorite: true });
            expect(mockEq).toHaveBeenCalledWith('id', 'item-123');
            expect(supabase.from).toHaveBeenCalledWith('clothing_items');
        });

        it('should successfully toggle favorite to false', async () => {
            const { supabase } = await import('@/app/lib/api/supabase');

            const mockEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

            vi.mocked(supabase.from).mockReturnValue({
                update: mockUpdate,
            } as any);

            const result = await toggleFavorite('clothing_items', 'item-123', true);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();

            expect(mockUpdate).toHaveBeenCalledWith({ is_favorite: false });
            expect(mockEq).toHaveBeenCalledWith('id', 'item-123');
            expect(supabase.from).toHaveBeenCalledWith('clothing_items');
        });


        it('should return error when database update fails', async () => {
            const { supabase } = await import('@/app/lib/api/supabase');
            const mockError = { message: 'Database connection failed' };

            vi.mocked(supabase.from).mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        error: mockError,
                    }),
                }),
            } as any)

            const result = await toggleFavorite('clothing_items', 'item-123', false);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Database connection failed');
        });

        it('should handle unexpected exceptions', async () => {
            const { supabase } = await import ('@/app/lib/api/supabase');

            vi.mocked(supabase.from).mockImplementation(() => {
                throw new Error('Network failure');
            })

            const result = await toggleFavorite('clothing_items', 'item-123', false);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network failure');
        });
    });
});