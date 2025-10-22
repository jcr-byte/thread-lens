'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createOutfit } from '../../lib/outfits';
import { getUserClothingItems } from '../../lib/clothing';
import { ClothingItem } from '../../types/clothing';

interface AddOutfitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddOutfitModal({ isOpen, onClose, onSuccess }: AddOutfitModalProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        occasion: '',
        season: '',
        tags: '',
    });

    // Load user's clothing items when modal opens
    useEffect(() => {
        if (isOpen && user) {
            loadClothingItems();
        }
    }, [isOpen, user]);

    const loadClothingItems = async () => {
        if (!user) return;
        const { data, error } = await getUserClothingItems(user.id);
        if (data) {
            setClothingItems(data);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItemIds(prev => 
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) {
            setError('You must be logged in to create outfits');
            return;
        }

        if (!formData.name.trim()) {
            setError('Outfit name is required');
            return;
        }

        if (selectedItemIds.length === 0) {
            setError('Please select at least one clothing item');
            return;
        }

        setIsLoading(true);

        try {
            // Parse tags
            const tagsArray = formData.tags
                ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
                : [];

            const { data, error: createError } = await createOutfit(user.id, {
                name: formData.name,
                description: formData.description || undefined,
                clothing_item_ids: selectedItemIds,
                tags: tagsArray.length > 0 ? tagsArray : undefined,
                occasion: formData.occasion || undefined,
                season: formData.season || undefined,
            });

            if (createError) {
                throw new Error(createError);
            }

            // Reset form
            setFormData({
                name: '',
                description: '',
                occasion: '',
                season: '',
                tags: '',
            });
            setSelectedItemIds([]);

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error creating outfit: ', err);
            setError(err instanceof Error ? err.message : 'Failed to create outfit. Please try again.');
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

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Create New Outfit</h2>
                    <p className="text-sm text-gray-600">Select clothing items to create an outfit</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Outfit Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="e.g., Summer Beach Day"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Occasion
                            </label>
                            <input
                                type="text"
                                id="occasion"
                                name="occasion"
                                value={formData.occasion}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="e.g., Casual, Formal"
                            />
                        </div>

                        <div>
                            <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Season
                            </label>
                            <input
                                type="text"
                                id="season"
                                name="season"
                                value={formData.season}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="e.g., Summer, Winter"
                            />
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
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            placeholder="e.g., comfortable, stylish, work"
                        />
                    </div>

                    {/* Clothing Item Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Clothing Items * ({selectedItemIds.length} selected)
                        </label>
                        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                            {clothingItems.length === 0 ? (
                                <div className="col-span-4 text-center py-8 text-gray-500">
                                    No clothing items found. Add some items to your closet first!
                                </div>
                            ) : (
                                clothingItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItemSelection(item.id)}
                                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                                            selectedItemIds.includes(item.id)
                                                ? 'ring-4 ring-blue-500'
                                                : 'hover:ring-2 hover:ring-gray-300'
                                        }`}
                                    >
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                                {item.name}
                                            </div>
                                        )}
                                        {selectedItemIds.includes(item.id) && (
                                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                                                <Check size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
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
                                Creating Outfit...
                            </div>
                        ) : (
                            'Create Outfit'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}


