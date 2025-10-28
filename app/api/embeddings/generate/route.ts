import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateItemEmbeddings } from '@/app/lib/embeddings';

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { itemId } = await request.json();
    
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }
    
    // Fetch the item from the database
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();
    
    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Item not found', details: fetchError?.message },
        { status: 404 }
      );
    }
    
    console.log(`Generating embeddings for item ${itemId}...`);
    
    // Generate embeddings
    const embeddings = await generateItemEmbeddings({
      image_url: item.image_url,
      title: item.title,
      category: item.category,
      colors: item.colors,
    });
    
    if (!embeddings.v_image && !embeddings.v_text) {
      return NextResponse.json(
        { error: 'Failed to generate any embeddings' },
        { status: 500 }
      );
    }
    
    // Update the item with embeddings
    const { error: updateError } = await supabase
      .from('items')
      .update(embeddings)
      .eq('id', itemId);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`Successfully generated embeddings for item ${itemId}`);
    
    return NextResponse.json({
      success: true,
      itemId,
      hasImageEmbedding: !!embeddings.v_image,
      hasTextEmbedding: !!embeddings.v_text,
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate embeddings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Batch processing endpoint - processes items without embeddings
export async function PUT(request: NextRequest) {
  try {
    // Get all items without embeddings
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, image_url, title, category, colors')
      .or('v_image.is.null,v_text.is.null')
      .limit(10); // Process in batches of 10
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No items to process' });
    }
    
    const results = [];
    
    for (const item of items) {
      try {
        const embeddings = await generateItemEmbeddings({
          image_url: item.image_url,
          title: item.title,
          category: item.category,
          colors: item.colors,
        });
        
        await supabase
          .from('items')
          .update(embeddings)
          .eq('id', item.id);
        
        results.push({ id: item.id, success: true });
      } catch (error) {
        results.push({
          id: item.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in batch processing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

