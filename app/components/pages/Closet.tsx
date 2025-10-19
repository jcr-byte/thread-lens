"use client"

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserClothingItems, deleteClothingItem, toggleFavoriteClothingItem } from "../../lib/clothing";
import { ClothingItem } from "../../types/clothing";
import AddClothingModal from "../ui/AddClothingModal";
import ClothingItemModal from "../ui/ClothingItemModal";

export default function Closet() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

  const loadClothingItems = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await getUserClothingItems(user.id);
    if (data) {
      setClothingItems(data);
    }
    setIsLoading(false);
  };

  const handleDelete = async (itemId: string) => {
    const itemToDelete = clothingItems.find(item => item.id === itemId);
    const { success, error } = await deleteClothingItem(itemId, itemToDelete?.image_path);
    
    if (success) {
      // Refresh the list after deletion
      loadClothingItems();
    } else {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    const item = clothingItems.find(item => item.id === itemId);
    if (!item) return;

    const { success, error } = await toggleFavoriteClothingItem(itemId, item.is_favorite);
    
    if (success) {
      // Update the item in the local state immediately for responsive UI
      setClothingItems(prevItems =>
        prevItems.map(prevItem =>
          prevItem.id === itemId
            ? { ...prevItem, is_favorite: !prevItem.is_favorite }
            : prevItem
        )
      );
      
      // Update the selected item if it's currently displayed
      if (selectedItem?.id === itemId) {
        setSelectedItem({ ...selectedItem, is_favorite: !selectedItem.is_favorite });
      }
    } else {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      loadClothingItems();
    }
  }, [user]);

  return (
    <>
      <AddClothingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadClothingItems(); // Refresh the list
        }}
      />

      <ClothingItemModal
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />
      
      <div className="grid grid-cols-4 gap-4 my-10 mx-14">
        {/* Add button - stays first */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="mx-4 my-2 aspect-square flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 hover:cursor-pointer hover:scale-105 transition-all"
        >
          <Plus className="text-black w-50 h-50" />
        </div>
        
        {/* Clothing items */}
        {clothingItems.map((item) => (
          <div 
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="mx-4 my-2 aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}