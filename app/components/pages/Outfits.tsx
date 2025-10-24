"use client"

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserOutfits } from "../../lib/outfits";
import { Outfit } from "../../types/outfit";
import AddOutfitModal from "../ui/AddOutfitModal";

export default function Outfits() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

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

  return (
    <>
      <AddOutfitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadOutfits(); // Refresh the list
        }}
      />
      
      <div className="grid grid-cols-6 gap-4 my-10 mx-14">
        {/* Add button - stays first */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="mx-4 my-2 aspect-square flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 hover:cursor-pointer hover:scale-105 transition-all"
        >
          <Plus className="text-black w-50 h-50" />
        </div>
        
        {/* Outfit items */}
        {outfits.map((outfit) => (
          <div 
            key={outfit.id}
            onClick={() => setSelectedOutfit(outfit)}
            className="mx-4 my-2 aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
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
    </>
  );
}
