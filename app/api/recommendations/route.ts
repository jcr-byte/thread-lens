import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateCompleteOutfit } from '@/app/lib/recommendations';

export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client from user's session
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get and verify the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    const { baseItemId, excludeIds } = await request.json();
    
    if (!baseItemId) {
      return NextResponse.json(
        { error: 'baseItemId is required' },
        { status: 400 }
      );
    }
    
    console.log(`Generating outfit for user ${user.id}, base item ${baseItemId}`);
    
    // Pass the authenticated client to the function
    const outfit = await generateCompleteOutfit(
      supabase,  // Authenticated client
      user.id,   // User ID from session
      baseItemId,
      excludeIds || []
    );
    
    console.log(`Successfully generated outfit with ${outfit.length} items`);
    
    return NextResponse.json({
      success: true,
      outfit,
    });
  } catch (error) {
    console.error('Error generating outfit recommendations:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate outfit',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

