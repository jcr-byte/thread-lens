'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, Trash2, ChevronDown, ChevronUp, Tag, DollarSign, Info, Edit2, Save, Image as ImageIcon } from 'lucide-react';
import { ClothingItem, ClothingCategory } from '../../types/clothing';
import { useAuth } from '../../contexts/AuthContext';
import { updateClothingItem } from '../../lib/api/clothing';

interface ClothingItemModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (itemId: string) => void;
  onToggleFavorite?: (itemId: string) => void;
  onUpdate?: (updatedItem: ClothingItem) => void;
}

export default function ClothingItemModal({
  item,
  isOpen,
  onClose,
  onDelete,
  onToggleFavorite,
  onUpdate,
}: ClothingItemModalProps) {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState({
    details: false,
    purchaseInfo: false,
    additional: false,
  });

  const categories: ClothingCategory[] = [
    'tops',
    'bottoms',
    'dresses',
    'outerwear',
    'shoes',
    'accessories',
    'undergarments',
    'activewear',
  ];

  const [formData, setFormData] = useState({
    name: '',
    category: '' as ClothingCategory | '',
    subcategory: '',
    brand: '',
    color: '',
    size: '',
    material: '',
    purchase_date: '',
    price: '',
    tags: '',
    notes: '',
    image: null as File | null,
  });

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (item && isEditMode) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        subcategory: item.subcategory || '',
        brand: item.brand || '',
        color: item.color || '',
        size: item.size || '',
        material: item.material || '',
        purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
        price: item.price ? item.price.toString() : '',
        tags: item.tags ? item.tags.join(', ') : '',
        notes: item.notes || '',
        image: null,
      });
      setImagePreview(item.image_url || null);
      setShouldRemoveImage(false);
      setError('');
    }
  }, [item, isEditMode]);

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setError('');
      setImagePreview(null);
      setShouldRemoveImage(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  if (!isOpen || !item) return null;

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
      onClose();
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(item.id);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleEdit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsEditMode(true);
    setExpandedSections({
      details: true,
      purchaseInfo: true,
      additional: true,
    });
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError('');
    setImagePreview(item.image_url || null);
    setShouldRemoveImage(false);
  };

  const handleCategorySelect = (category: ClothingCategory) => {
    setFormData({
      ...formData,
      category: category,
    });
    setIsCategoryDropdownOpen(false);
    setError('');
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
      setShouldRemoveImage(false); // User is uploading a new image, so don't remove
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null); // Clear the preview
    setShouldRemoveImage(true); // Mark that image should be removed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (isLoading) {
      return;
    }
    
    setError('');

    if (!user) {
      setError('You must be logged in to update items');
      return;
    }

    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    setIsLoading(true);

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const updateData = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand || undefined,
        color: formData.color || undefined,
        size: formData.size || undefined,
        material: formData.material || undefined,
        purchase_date: formData.purchase_date || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        notes: formData.notes || undefined,
        image: formData.image || undefined,
        removeImage: shouldRemoveImage || undefined,
      };

      const { data: updatedItem, error: updateError } = await updateClothingItem(
        item.id,
        user.id,
        updateData,
        item.image_path
      );

      if (updateError) {
        throw new Error(updateError);
      }

      if (!updatedItem) {
        throw new Error('Failed to update item');
      }

      // Trigger embedding regeneration
      fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: updatedItem.id }),
      }).catch(err => console.error('Failed to regenerate embeddings:', err));

      setIsEditMode(false);
      onUpdate?.(updatedItem);
    } catch (err) {
      console.error('Error updating clothing item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if sections have any data
  const hasDetailsData =
    item.subcategory || item.brand || item.color || item.size || item.material;
  const hasPurchaseData = item.price || item.purchase_date;
  const hasAdditionalData = (item.tags && item.tags.length > 0) || item.notes;

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
                  Item Photo
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
                  <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
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
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      item.is_favorite
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart size={18} fill={item.is_favorite ? 'currentColor' : 'none'} />
                    <span className="text-sm font-medium">
                      {item.is_favorite ? 'Favorited' : 'Favorite'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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
                    disabled={isLoading}
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
                  // Prevent form submission on Enter key unless it's in a textarea
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
                    e.preventDefault();
                  }
                }}
                className="space-y-4"
              >
                {/* Name and Category Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., Blue Denim Jacket"
                      required
                    />
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-left flex items-center justify-between bg-white hover:border-gray-400"
                    >
                      <span className={formData.category ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.category
                          ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1)
                          : 'Select category'}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategorySelect(cat)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                              formData.category === cat
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand and Color Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Brand
                    </label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., Levi's"
                    />
                  </div>

                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Color
                    </label>
                    <input
                      type="text"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., Navy Blue"
                    />
                  </div>
                </div>

                {/* Size and Material Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Size
                    </label>
                    <input
                      type="text"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., M, 32, 10"
                    />
                  </div>

                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Material
                    </label>
                    <input
                      type="text"
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., Cotton, Denim"
                    />
                  </div>
                </div>

                {/* Purchase Date and Price Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      id="purchase_date"
                      name="purchase_date"
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Subcategory and Tags Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., Casual, Formal"
                    />
                  </div>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="e.g., summer, casual, vintage"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                    placeholder="Add any additional notes or details..."
                  />
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
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{item.name}</h2>

                <div className="space-y-4">
              {/* Always visible: Category */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <p className="text-base text-gray-900 capitalize">{item.category}</p>
              </div>

              {/* Always visible: Wear Count */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Wear Count</label>
                <p className="text-base text-gray-900">{item.wear_count} times</p>
              </div>

              {/* Collapsible Details Section */}
              {hasDetailsData && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSection('details')}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info size={18} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Details</span>
                    </div>
                    {expandedSections.details ? (
                      <ChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-500" />
                    )}
                  </button>
                  {expandedSections.details && (
                    <div className="mt-3 space-y-3 pl-6">
                      {item.subcategory && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Subcategory
                          </label>
                          <p className="text-base text-gray-900">{item.subcategory}</p>
                        </div>
                      )}
                      {item.brand && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Brand
                          </label>
                          <p className="text-base text-gray-900">{item.brand}</p>
                        </div>
                      )}
                      {(item.color || item.size) && (
                        <div className="grid grid-cols-2 gap-4">
                          {item.color && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">
                                Color
                              </label>
                              <p className="text-base text-gray-900">{item.color}</p>
                            </div>
                          )}
                          {item.size && (
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">
                                Size
                              </label>
                              <p className="text-base text-gray-900">{item.size}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {item.material && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Material
                          </label>
                          <p className="text-base text-gray-900">{item.material}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Purchase Info Section */}
              {hasPurchaseData && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSection('purchaseInfo')}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Purchase Info</span>
                    </div>
                    {expandedSections.purchaseInfo ? (
                      <ChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-500" />
                    )}
                  </button>
                  {expandedSections.purchaseInfo && (
                    <div className="mt-3 space-y-3 pl-6">
                      <div className="grid grid-cols-2 gap-4">
                        {item.price && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Price
                            </label>
                            <p className="text-base text-gray-900">${item.price.toFixed(2)}</p>
                          </div>
                        )}
                        {item.purchase_date && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Purchase Date
                            </label>
                            <p className="text-base text-gray-900">
                              {new Date(item.purchase_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Additional Section */}
              {hasAdditionalData && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => toggleSection('additional')}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Additional</span>
                    </div>
                    {expandedSections.additional ? (
                      <ChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-500" />
                    )}
                  </button>
                  {expandedSections.additional && (
                    <div className="mt-3 space-y-3 pl-6">
                      {item.tags && item.tags.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-2">
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Notes
                          </label>
                          <p className="text-base text-gray-900 whitespace-pre-wrap">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

