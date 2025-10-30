'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/api/supabase';
import { uploadUserImage } from '../../lib/api/uploadImage';
import { ClothingCategory } from '../../types/clothing';

interface AddClothingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddClothingModal({ isOpen, onClose, onSuccess }: AddClothingModalProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
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
            // Create preview
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
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) {
            setError('You must be logged in to add items');
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
            let imageUrl = null;
            let imagePath = null;

            // Upload image if provided
            if (formData.image) {
                const uploadResult = await uploadUserImage(formData.image, user.id);
                if (uploadResult.error) {
                    throw new Error(`Image upload failed: ${uploadResult.error}`);
                }
                imageUrl = uploadResult.publicUrl;
                imagePath = uploadResult.path;
            }

            // Parse tags
            const tagsArray = formData.tags
                ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
                : [];

            const { data, error: dbError } = await supabase
                .from('clothing_items')
                .insert({
                    user_id: user.id,
                    name: formData.name,
                    category: formData.category,
                    subcategory: formData.subcategory || null,
                    brand: formData.brand || null,
                    color: formData.color || null,
                    size: formData.size || null,
                    material: formData.material || null,
                    image_url: imageUrl,
                    image_path: imagePath,
                    purchase_date: formData.purchase_date || null,
                    price: formData.price ? parseFloat(formData.price) : null,
                    tags: tagsArray.length > 0 ? tagsArray : null,
                    notes: formData.notes || null,
                    is_favorite: false,
                    wear_count: 0,
                  })
                .select()
                .single();

            if (dbError) {
                throw dbError;
            }

            // Trigger embedding generation asynchronously (non-blocking)
            if (data?.id) {
                fetch('/api/embeddings/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId: data.id }),
                }).catch(err => console.error('Failed to generate embeddings:', err));
            }

            // Reset form
            setFormData({
                name: '',
                category: '',
                subcategory: '',
                brand: '',
                color: '',
                size: '',
                material: '',
                purchase_date: '',
                price: '',
                tags: '',
                notes: '',
                image: null,
            });
            setImagePreview(null);

            onSuccess?.();
            onClose();
            } catch (err) {
                console.error('Error adding clothing item: ', err);
                setError(err instanceof Error ? err.message : 'Failed to add item. Please try again.');
            } finally {
              setIsLoading(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={onClose}
            >
            <div 
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] shadow-2xl relative overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                <X size={24} />
                </button>

                {/* Header */}
                <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Add Clothing Item</h2>
                <p className="text-sm text-gray-600">Add a new piece to your wardrobe</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 self-start">
                    Item Photo
                    </label>
                    {imagePreview ? (
                    <div className="relative w-80 h-80 bg-gray-100 rounded-lg overflow-hidden">
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
                    <label className="w-80 h-80 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
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
                    
                    {/* Custom Dropdown Menu */}
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                    {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding Item...
                    </div>
                    ) : (
                    'Add to Wardrobe'
                    )}
                </button>
                </form>
            </div>
            </div>
        );
}
