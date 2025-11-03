"use client"

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserOutfits } from "../../lib/api/outfits";
import { Outfit } from "../../types/outfit";
import AddOutfitModal from "../ui/AddOutfitModal";
import AIOutfitModal from "../ui/AIOutfitModal";

export default function Outfits() {
  const { user } = useAuth();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const loadOutfits = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await getUserOutfits(user.id);
    if (data) {
      setOutfits(data);
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
      
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Create Outfit Dropdown */}
        <div className="ml-6 mt-3 mb-2 relative flex-shrink-0">
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
          <div className="grid grid-cols-6 gap-4 my-6 ml-6 mr-6 pb-6">
            {/* Outfit items */}
            {outfits.map((outfit) => (
              <div 
                key={outfit.id}
                onClick={() => setSelectedOutfit(outfit)}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                {outfit.image_url ? (
                  <img 
                    src={outfit.image_url} 
                    alt={outfit.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-4">
                    <span className="text-lg font-semibold text-center">{outfit.name}</span>
                    <span className="text-sm text-gray-400 mt-2">{outfit.clothing_item_ids.length} items</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
