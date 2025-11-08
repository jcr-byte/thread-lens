'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Trash2, Tag, Calendar, Snowflake, Sun, Leaf, Edit2, Save, Image as ImageIcon, ChevronDown, Check } from 'lucide-react';
import { Outfit } from '../../types/outfit';
import { ClothingItem } from '../../types/clothing';
import { useAuth } from '../../contexts/AuthContext';
import { deleteOutfit, toggleFavoriteOutfit, updateOutfit } from '../../lib/api/outfits';
import { getClothingItemsByIds, getUserClothingItems } from '../../lib/api/clothing';

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
  const [allUserItems, setAllUserItems] = useState<ClothingItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [isOccasionDropdownOpen, setIsOccasionDropdownOpen] = useState(false);
  const occasionDropdownRef = useRef<HTMLDivElement>(null);

  const occasionOptions = [
    'Casual',
    'Business Casual',
    'Smart Casual',
    'Formal',
    'Business',
    'Date Night',
    'Wedding',
    'Party',
    'Cocktail',
    'Beach',
    'Workout',
    'Athletic',
    'Travel',
    'Everyday',
    'Evening',
    'Brunch',
    'Dinner',
    'Outdoor',
    'Holiday',
  ];

  const seasonOptions = ['Spring', 'Summer', 'Fall', 'Winter'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    occasion: '',
    season: '',
    tags: '',
    clothing_item_ids: [] as string[],
    image: null as File | null,
  });

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

  // Load all user items when entering edit mode
  useEffect(() => {
    if (isEditMode && user) {
      getUserClothingItems(user.id).then(({ data }) => {
        if (data) {
          setAllUserItems(data);
        }
      });
    }
  }, [isEditMode, user]);

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (outfit && isEditMode) {
      setFormData({
        name: outfit.name || '',
        description: outfit.description || '',
        occasion: outfit.occasion || '',
        season: outfit.season || '',
        tags: outfit.tags ? outfit.tags.join(', ') : '',
        clothing_item_ids: outfit.clothing_item_ids || [],
        image: null,
      });
      setImagePreview(outfit.image_url || null);
      setShouldRemoveImage(false);
      setError('');
    }
  }, [outfit, isEditMode]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setClothingItems([]);
      setIsEditMode(false);
      setImagePreview(null);
      setShouldRemoveImage(false);
      setIsLoading(false); // Reset loading state when modal closes
    }
  }, [isOpen]);

  // Close occasion dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (occasionDropdownRef.current && !occasionDropdownRef.current.contains(event.target as Node)) {
        setIsOccasionDropdownOpen(false);
      }
    };

    if (isOccasionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOccasionDropdownOpen]);

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

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsEditMode(true);
    setIsLoading(false); // Ensure loading is reset when entering edit mode
    setError('');
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsEditMode(false);
    setError('');
    setImagePreview(outfit.image_url || null);
    setShouldRemoveImage(false);
    setIsLoading(false); // Reset loading state when canceling
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setShouldRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
    setShouldRemoveImage(true);
  };

  const toggleItemSelection = (itemId: string) => {
    setFormData({
      ...formData,
      clothing_item_ids: formData.clothing_item_ids.includes(itemId)
        ? formData.clothing_item_ids.filter(id => id !== itemId)
        : [...formData.clothing_item_ids, itemId],
    });
  };

  const handleOccasionSelect = (occasion: string) => {
    setFormData({
      ...formData,
      occasion: occasion,
    });
    setIsOccasionDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Guard against submission when not in edit mode
    if (!isEditMode) {
      return;
    }
    
    if (isLoading) {
      return;
    }
    
    setError('');

    if (!user) {
      setError('You must be logged in to update outfits');
      return;
    }

    if (!formData.name.trim()) {
      setError('Outfit name is required');
      return;
    }

    if (formData.clothing_item_ids.length === 0) {
      setError('Please select at least one clothing item');
      return;
    }

    setIsLoading(true);

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const updateData = {
        name: formData.name,
        description: formData.description || undefined,
        clothing_item_ids: formData.clothing_item_ids,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        occasion: formData.occasion || undefined,
        season: formData.season || undefined,
        image: formData.image || undefined,
        removeImage: shouldRemoveImage || undefined,
      };

      const { data: updatedOutfit, error: updateError } = await updateOutfit(
        outfit.id,
        updateData,
        outfit.image_path
      );

      if (updateError) {
        throw new Error(updateError);
      }

      if (!updatedOutfit) {
        throw new Error('Failed to update outfit');
      }

      setIsEditMode(false);
      onUpdate?.(updatedOutfit);
    } catch (err) {
      console.error('Error updating outfit:', err);
      setError(err instanceof Error ? err.message : 'Failed to update outfit. Please try again.');
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

  // Get items for display (selected items in edit mode, or outfit items in view mode)
  const displayItems = isEditMode
    ? allUserItems.filter(item => formData.clothing_item_ids.includes(item.id))
    : clothingItems;

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
            {isEditMode ? (
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 self-start">
                  Outfit Photo
                </label>
                {imagePreview ? (
                  <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-thread-lens-primary cursor-pointer transition-colors">
                    <ImageIcon size={56} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : (
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
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {!isEditMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={18} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
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
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    form="edit-form"
                    disabled={isLoading || !isEditMode}
                    onClick={(e) => {
                      if (!isEditMode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    <Save size={18} />
                    <span className="text-sm font-medium">
                      {isLoading ? 'Saving...' : 'Save'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:bg-gray-300 transition-colors"
                  >
                    <X size={18} />
                    <span className="text-sm font-medium">Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            {isEditMode ? (
              <form 
                id="edit-form" 
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key unless it's in a textarea or submit button
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'submit') {
                      e.preventDefault();
                    } else if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type !== 'submit') {
                      e.preventDefault();
                    }
                  }
                }}
                className="space-y-4"
                noValidate
              >
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Outfit Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm"
                    placeholder="e.g., Summer Beach Day"
                    required
                  />
                </div>

                {/* Occasion and Season Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative" ref={occasionDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Occasion
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsOccasionDropdownOpen(!isOccasionDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm text-left flex items-center justify-between bg-white hover:border-gray-400"
                    >
                      <span className={formData.occasion ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.occasion || 'Select an occasion'}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isOccasionDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOccasionDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => handleOccasionSelect('')}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                            !formData.occasion
                              ? 'bg-gray-50 text-gray-900 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          Select an occasion
                        </button>
                        {occasionOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleOccasionSelect(option)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                              formData.occasion === option
                                ? 'bg-thread-lens-primary/10 text-thread-lens-primary font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Season
                    </label>
                    <select
                      id="season"
                      name="season"
                      value={formData.season}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm bg-white"
                    >
                      <option value="">Select a season</option>
                      {seasonOptions.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all resize-none text-sm"
                    placeholder="Add any notes about this outfit..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm"
                    placeholder="e.g., comfortable, stylish, work"
                  />
                </div>

                {/* Clothing Items Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clothing Items * ({formData.clothing_item_ids.length} selected)
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                    {allUserItems.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No clothing items available. Add items to your closet first!
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {allUserItems.map((item) => {
                          const isSelected = formData.clothing_item_ids.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleItemSelection(item.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-thread-lens-primary/10 border-2 border-thread-lens-primary'
                                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                              }`}
                            >
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs text-center p-1">
                                  <span className="truncate">{item.name}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                {item.category && (
                                  <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Check size={16} className="text-thread-lens-primary flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </form>
            ) : (
              <>
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
                      Clothing Items ({displayItems.length})
                    </label>
                    {isLoadingItems ? (
                      <div className="text-sm text-gray-500">Loading items...</div>
                    ) : displayItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {displayItems.map((item) => (
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
