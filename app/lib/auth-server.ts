import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Create an authenticated Supabase client from the Authorization header
 * This should only be called in API routes (server-side)
 */
export async function getAuthenticatedClient(request: NextRequest) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return { 
      client: null, 
      user: null, 
      error: 'No authorization token provided' 
    };
  }
  
  // Create Supabase client with user's token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
  
  // Verify the user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { 
      client: null, 
      user: null, 
      error: authError?.message || 'Invalid or expired token' 
    };
  }
  
  return { 
    client: supabase, 
    user, 
    error: null 
  };
}

