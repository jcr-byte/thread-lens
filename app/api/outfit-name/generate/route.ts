import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/app/lib/server/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated client from Authorization header
    const { client: supabase, user, error: authError } = await getAuthenticatedClient(request);
    
    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    const { clothingItemIds, occasion, description } = await request.json();
    
    if (!clothingItemIds || !Array.isArray(clothingItemIds) || clothingItemIds.length === 0) {
      return NextResponse.json(
        { error: 'clothingItemIds array is required' },
        { status: 400 }
      );
    }

    // Fetch the clothing items from the database
    const { data: items, error: fetchError } = await supabase
      .from('clothing_items')
      .select('name, category, color, brand, tags')
      .in('id', clothingItemIds)
      .eq('user_id', user.id);

    if (fetchError || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch clothing items', details: fetchError?.message },
        { status: 404 }
      );
    }

    // Build a description of the outfit for the AI
    const outfitDescription = items.map(item => {
      const parts = [
        item.name,
        item.category,
        item.color && `in ${item.color}`,
        item.brand && `by ${item.brand}`,
      ].filter(Boolean);
      return parts.join(' ');
    }).join(', ');

    // Create a prompt for OpenAI
    const prompt = `Generate a creative and concise outfit name (2-4 words) for this outfit: ${outfitDescription}${occasion ? `. Occasion: ${occasion}` : ''}${description ? `. Description: ${description}` : ''}. The name should be stylish and descriptive, like "Casual Summer Look" or "Elegant Evening Ensemble". Return only the outfit name, nothing else.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a fashion stylist who creates creative, concise outfit names. Always respond with just the outfit name (2-4 words), nothing else.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 20,
        temperature: 0.8,
      });

      const generatedName = completion.choices[0]?.message?.content?.trim();
      
      if (!generatedName) {
        throw new Error('No name generated');
      }

      return NextResponse.json({
        success: true,
        name: generatedName,
      });
    } catch (aiError) {
      console.error('Error generating outfit name with AI:', aiError);
      return NextResponse.json(
        {
          error: 'Failed to generate outfit name',
          details: aiError instanceof Error ? aiError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in outfit name generation:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate outfit name',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

