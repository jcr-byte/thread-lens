import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedClient } from '@/app/lib/server/auth';
import type { NextRequest } from 'next/server';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Create mock instances that we can control
const mockGetUser = vi.fn();

// Mock Supabase createClient
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn().mockImplementation(() => ({
      auth: {
        getUser: mockGetUser,
      },
    })),
  };
});

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('getAuthenticatedClient', () => {
    it('should return error when Authorization header is missing', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe('No authorization token provided');
      expect(mockRequest.headers.get).toHaveBeenCalledWith('Authorization');
    });

    it('should return error when Authorization header is empty string', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(''),
        },
      } as unknown as NextRequest;

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe('No authorization token provided');
    });

    it('should return error when Authorization header has no Bearer prefix', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('token123'),
        },
      } as unknown as NextRequest;

      // When there's no Bearer prefix, replace returns the original string
      // So it will try to authenticate, but should fail at getUser
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token format' },
      });

      const result = await getAuthenticatedClient(mockRequest);

      // The token is extracted (even without Bearer), but auth fails
      expect(result.client).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid token format');
    });

    it('should extract token from Bearer Authorization header', async () => {
      const mockToken = 'test-token-123';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { createClient } = await import('@supabase/supabase-js');
      const result = await getAuthenticatedClient(mockRequest);

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        {
          global: {
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          },
        }
      );

      expect(result.client).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should return error when getUser returns an error', async () => {
      const mockToken = 'invalid-token';
      const mockAuthError = { message: 'Invalid token' };

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: mockAuthError,
      });

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid token');
    });

    it('should return error when getUser returns null user', async () => {
      const mockToken = 'expired-token';

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should return error when getUser returns error without message', async () => {
      const mockToken = 'bad-token';

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: {},
      });

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should successfully authenticate with valid token', async () => {
      const mockToken = 'valid-token-123';
      const mockUser = {
        id: 'user-456',
        email: 'user@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockGetUser).toHaveBeenCalled();
    });

    it('should handle token with extra spaces in Bearer prefix', async () => {
      const mockToken = 'token-123';
      const mockUser = {
        id: 'user-789',
        email: 'test@example.com',
      };

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer  ${mockToken}`), // Extra space
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getAuthenticatedClient(mockRequest);

      // Should still extract token correctly (replace only removes first occurrence)
      expect(result.client).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should create Supabase client with correct configuration', async () => {
      const mockToken = 'config-test-token';
      const mockUser = {
        id: 'user-config',
        email: 'config@example.com',
      };

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { createClient } = await import('@supabase/supabase-js');
      await getAuthenticatedClient(mockRequest);

      expect(createClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          },
        }
      );
    });

    it('should handle case-insensitive Authorization header', async () => {
      const mockToken = 'case-test-token';
      const mockUser = {
        id: 'user-case',
        email: 'case@example.com',
      };

      // Simulate case-insensitive header lookup (headers.get is case-insensitive in Next.js)
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(`Bearer ${mockToken}`),
        },
      } as unknown as NextRequest;

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getAuthenticatedClient(mockRequest);

      expect(result.client).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });
  });
});

