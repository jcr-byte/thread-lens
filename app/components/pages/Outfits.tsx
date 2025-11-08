"use client"

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { getUserOutfits } from "../../lib/api/outfits";
import { getClothingItemsByIds } from "../../lib/api/clothing";
import { Outfit } from "../../types/outfit";
import { ClothingItem } from "../../types/clothing";
import AddOutfitModal from "../ui/AddOutfitModal";
import AIOutfitModal from "../ui/AIOutfitModal";
import OutfitModal from "../ui/OutfitModal";

export default function Outfits() {
  const user = useRequireAuth();
  
  // Early return if auth is still loading
  if (!user) {
    return null;
  }
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [outfitItemsMap, setOutfitItemsMap] = useState<Record<string, ClothingItem[]>>({});
  const [hoveredOutfitId, setHoveredOutfitId] = useState<string | null>(null);
  const [showNameForOutfit, setShowNameForOutfit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hoverTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const loadOutfits = async () => {
    setIsLoading(true);
    const { data, error } = await getUserOutfits(user.id);
    if (data) {
      setOutfits(data);
      
      // Load clothing items for each outfit
      const itemsMap: Record<string, ClothingItem[]> = {};
      for (const outfit of data) {
        if (outfit.clothing_item_ids.length > 0) {
          // Get first 4 items for preview
          const itemIdsToFetch = outfit.clothing_item_ids.slice(0, 4);
          const { data: items } = await getClothingItemsByIds(itemIdsToFetch);
          if (items) {
            itemsMap[outfit.id] = items;
          }
        }
      }
      setOutfitItemsMap(itemsMap);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadOutfits();
    }
  }, [user]);

  const handleCreateOutfit = (mode: 'manual' | 'ai') => {
    if (mode === 'ai') {
      setIsAIModalOpen(true);
    } else {
      setIsManualModalOpen(true);
    }
    setIsDropdownOpen(false);
  };

  const handleMouseEnter = (outfitId: string) => {
    setHoveredOutfitId(outfitId);
    // Clear any existing timeout for this outfit
    if (hoverTimeoutRef.current[outfitId]) {
      clearTimeout(hoverTimeoutRef.current[outfitId]);
    }
    // Set timeout to show name after 2 seconds
    hoverTimeoutRef.current[outfitId] = setTimeout(() => {
      setShowNameForOutfit(outfitId);
    }, 1000);
  };

  const handleMouseLeave = (outfitId: string) => {
    setHoveredOutfitId(null);
    // Clear timeout if mouse leaves before 2 seconds
    if (hoverTimeoutRef.current[outfitId]) {
      clearTimeout(hoverTimeoutRef.current[outfitId]);
      delete hoverTimeoutRef.current[outfitId];
    }
    // Hide name immediately
    setShowNameForOutfit(null);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(hoverTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Filter outfits based on search query
  const filteredOutfits = outfits.filter((outfit) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    return (
      outfit.name.toLowerCase().includes(query) ||
      outfit.description?.toLowerCase().includes(query) ||
      outfit.occasion?.toLowerCase().includes(query) ||
      outfit.season?.toLowerCase().includes(query) ||
      outfit.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <AddOutfitModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          loadOutfits(); // Refresh the list
        }}
        initialMode="manual"
      />

      <AIOutfitModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={() => {
          loadOutfits(); // Refresh the list
        }}
      />

      <OutfitModal
        outfit={selectedOutfit}
        isOpen={selectedOutfit !== null}
        onClose={() => setSelectedOutfit(null)}
        onDelete={(outfitId) => {
          setOutfits(outfits.filter(o => o.id !== outfitId));
          setSelectedOutfit(null);
        }}
        onToggleFavorite={(outfitId) => {
          setOutfits(outfits.map(o => 
            o.id === outfitId ? { ...o, is_favorite: !o.is_favorite } : o
          ));
        }}
        onUpdate={(updatedOutfit) => {
          setOutfits(outfits.map(o => 
            o.id === updatedOutfit.id ? updatedOutfit : o
          ));
        }}
      />
      
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Search Bar and Create Outfit Dropdown */}
        <div className="ml-6 mt-3 mb-2 relative flex-shrink-0 flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search outfits by name, description, tags, occasion, or season..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm"
            />
          </div>
          
          {/* Create Outfit Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-thread-lens-primary hover:bg-thread-lens-secondary text-white rounded-lg text-sm font-medium transition-colors"
            >
              <span>Create Outfit</span>
              <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-20">
                  <button
                    onClick={() => handleCreateOutfit('ai')}
                    className="w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-900"
                  >
                    Create with AI
                  </button>
                  
                  <button
                    onClick={() => handleCreateOutfit('manual')}
                    className="w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-900"
                  >
                    Create Manually
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Scrollable Grid Container */}
        <div className="flex-1 overflow-y-auto">
          {filteredOutfits.length === 0 && searchQuery ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No outfits found matching "{searchQuery}"</p>
                <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-4 my-6 ml-6 mr-6 pb-6">
              {/* Outfit items */}
              {filteredOutfits.map((outfit) => {
              const previewItems = outfitItemsMap[outfit.id] || [];
              const hasItems = previewItems.length > 0;
              
              const isShowingName = showNameForOutfit === outfit.id;
              
              return (
                <div 
                  key={outfit.id}
                  onClick={() => setSelectedOutfit(outfit)}
                  onMouseEnter={() => handleMouseEnter(outfit.id)}
                  onMouseLeave={() => handleMouseLeave(outfit.id)}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg hover:scale-105 transition-all cursor-pointer relative"
                >
                  {outfit.image_url ? (
                    <img 
                      src={outfit.image_url} 
                      alt={outfit.name}
                      className="w-full h-full object-cover"
                    />
                  ) : hasItems ? (
                    <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                      {previewItems.map((item, index) => (
                        <div key={item.id} className="relative bg-gray-200 overflow-hidden aspect-square">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover min-w-0 min-h-0"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                              <span className="truncate">{item.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Fill empty slots if less than 4 items */}
                      {Array.from({ length: Math.max(0, 4 - previewItems.length) }).map((_, index) => (
                        <div key={`empty-${index}`} className="bg-gray-100 overflow-hidden aspect-square" />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-4">
                      <span className="text-lg font-semibold text-center">{outfit.name}</span>
                      <span className="text-sm text-gray-400 mt-2">{outfit.clothing_item_ids.length} items</span>
                    </div>
                  )}
                  {/* Hover overlay with outfit name */}
                  <div 
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
                      isShowingName ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="text-white text-center px-4">
                      <p className="text-lg font-semibold">{outfit.name}</p>
                      {outfit.occasion && (
                        <p className="text-sm text-white/80 mt-1">{outfit.occasion}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
