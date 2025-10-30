import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateItemEmbeddings } from '@/app/lib/server/embeddings';

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
    
    // Fetch the item from clothing_items table
    const { data: item, error: fetchError } = await supabase
      .from('clothing_items')
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
    
    // Generate embeddings - map clothing_items fields to embedding function
    const embeddings = await generateItemEmbeddings({
      image_url: item.image_url,
      title: item.name,  // map 'name' to 'title'
      category: item.category,
      colors: item.color ? [item.color] : null,  // convert single color to array
      tags: item.tags,
      brand: item.brand,
      material: item.material,
      notes: item.notes,
    });
    
    if (!embeddings.v_image && !embeddings.v_text) {
      return NextResponse.json(
        { error: 'Failed to generate any embeddings' },
        { status: 500 }
      );
    }
    
    // Update the clothing_items table with embeddings
    const { error: updateError } = await supabase
      .from('clothing_items')
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

// Batch processing endpoint - processes clothing items without embeddings
export async function PUT(request: NextRequest) {
  try {
    // Get all clothing items without embeddings
    const { data: items, error: fetchError } = await supabase
      .from('clothing_items')
      .select('id, image_url, name, category, color, tags, brand, material, notes')
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
          title: item.name,
          category: item.category,
          colors: item.color ? [item.color] : null,
          tags: item.tags,
          brand: item.brand,
          material: item.material,
          notes: item.notes,
        });
        
        await supabase
          .from('clothing_items')
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

