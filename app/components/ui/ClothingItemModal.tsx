'use client';

import React, { useState } from 'react';
import { X, Heart, Trash2, ChevronDown, ChevronUp, Tag, DollarSign, Info } from 'lucide-react';
import { ClothingItem } from '../../types/clothing';

interface ClothingItemModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (itemId: string) => void;
  onToggleFavorite?: (itemId: string) => void;
}

export default function ClothingItemModal({
  item,
  isOpen,
  onClose,
  onDelete,
  onToggleFavorite,
}: ClothingItemModalProps) {
  const [expandedSections, setExpandedSections] = useState({
    details: false,
    purchaseInfo: false,
    additional: false,
  });

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

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
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
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
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
          </div>
        </div>
      </div>
    </div>
  );
}

