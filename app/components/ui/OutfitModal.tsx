'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Trash2, Tag, Calendar, Snowflake, Sun, Leaf } from 'lucide-react';
import { Outfit } from '../../types/outfit';
import { ClothingItem } from '../../types/clothing';
import { useAuth } from '../../contexts/AuthContext';
import { deleteOutfit, toggleFavoriteOutfit } from '../../lib/api/outfits';
import { getClothingItemsByIds } from '../../lib/api/clothing';

interface OutfitModalProps {
  outfit: Outfit | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (outfitId: string) => void;
  onToggleFavorite?: (outfitId: string) => void;
  onUpdate?: (updatedOutfit: Outfit) => void;
}

export default function OutfitModal({
  outfit,
  isOpen,
  onClose,
  onDelete,
  onToggleFavorite,
  onUpdate,
}: OutfitModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Load clothing items when outfit changes
  useEffect(() => {
    if (outfit && outfit.clothing_item_ids.length > 0) {
      setIsLoadingItems(true);
      getClothingItemsByIds(outfit.clothing_item_ids)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading clothing items:', error);
            setClothingItems([]);
          } else {
            setClothingItems(data || []);
          }
        })
        .finally(() => {
          setIsLoadingItems(false);
        });
    } else {
      setClothingItems([]);
    }
  }, [outfit]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setClothingItems([]);
    }
  }, [isOpen]);

  if (!isOpen || !outfit) return null;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this outfit?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: deleteError } = await deleteOutfit(outfit.id, outfit.image_path);
      
      if (deleteError) {
        throw new Error(deleteError);
      }

      onDelete?.(outfit.id);
      onClose();
    } catch (err) {
      console.error('Error deleting outfit:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete outfit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: toggleError } = await toggleFavoriteOutfit(
        outfit.id,
        outfit.is_favorite
      );

      if (toggleError) {
        throw new Error(toggleError);
      }

      // Update local state
      const updatedOutfit = { ...outfit, is_favorite: !outfit.is_favorite };
      onToggleFavorite?.(outfit.id);
      onUpdate?.(updatedOutfit);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to update favorite status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeasonIcon = (season?: string) => {
    switch (season?.toLowerCase()) {
      case 'spring':
        return <Leaf size={18} className="text-green-600" />;
      case 'summer':
        return <Sun size={18} className="text-yellow-600" />;
      case 'fall':
      case 'autumn':
        return <Leaf size={18} className="text-orange-600" />;
      case 'winter':
        return <Snowflake size={18} className="text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl relative overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="flex flex-col">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              {outfit.image_url ? (
                <img
                  src={outfit.image_url}
                  alt={outfit.name}
                  className="w-full h-full object-cover"
                />
              ) : clothingItems.length > 0 ? (
                <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                  {clothingItems.slice(0, 4).map((item) => (
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
                  {Array.from({ length: Math.max(0, 4 - clothingItems.length) }).map((_, index) => (
                    <div key={`empty-${index}`} className="bg-gray-100 overflow-hidden aspect-square" />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  outfit.is_favorite
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart size={18} fill={outfit.is_favorite ? 'currentColor' : 'none'} />
                <span className="text-sm font-medium">
                  {outfit.is_favorite ? 'Favorited' : 'Favorite'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{outfit.name}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Description */}
              {outfit.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{outfit.description}</p>
                </div>
              )}

              {/* Occasion */}
              {outfit.occasion && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Occasion</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <p className="text-base text-gray-900">{outfit.occasion}</p>
                  </div>
                </div>
              )}

              {/* Season */}
              {outfit.season && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Season</label>
                  <div className="flex items-center gap-2">
                    {getSeasonIcon(outfit.season)}
                    <p className="text-base text-gray-900 capitalize">{outfit.season}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {outfit.tags && outfit.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {outfit.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                      >
                        <Tag size={14} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Wear Count */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Wear Count</label>
                <p className="text-base text-gray-900">{outfit.wear_count} times</p>
              </div>

              {/* Clothing Items */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-500 mb-3">
                  Clothing Items ({clothingItems.length})
                </label>
                {isLoadingItems ? (
                  <div className="text-sm text-gray-500">Loading items...</div>
                ) : clothingItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {clothingItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs text-center p-1">
                            <span className="truncate">{item.name}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          {item.category && (
                            <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No clothing items in this outfit</div>
                )}
              </div>

              {/* Created Date */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-base text-gray-900">
                  {new Date(outfit.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

