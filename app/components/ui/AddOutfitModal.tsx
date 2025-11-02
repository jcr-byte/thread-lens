'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';   
import { createOutfit } from '../../lib/api/outfits';
import { getUserClothingItems } from '../../lib/api/clothing';
import { ClothingItem } from '../../types/clothing';
import { supabase } from '../../lib/api/supabase';

interface AddOutfitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialMode?: 'manual' | 'ai';
}

export default function AddOutfitModal({ isOpen, onClose, onSuccess, initialMode = 'ai' }: AddOutfitModalProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [isAIMode, setIsAIMode] = useState(initialMode === 'ai');
    const [aiGeneratedItems, setAiGeneratedItems] = useState<ClothingItem[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [baseItem, setBaseItem] = useState<ClothingItem | null>(null);
    const [showBaseItemSelector, setShowBaseItemSelector] = useState(false);
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
            // Reset to initial mode when modal opens
            setIsAIMode(initialMode === 'ai');
        }
    }, [isOpen, user, initialMode]);

    const loadClothingItems = async () => {
        if (!user) return;
        const { data } = await getUserClothingItems(user.id);
        if (data) {
            setClothingItems(data);
        }
    };

    const generateAIOutfit = async () => {
        if (!baseItem) {
            setError('Please select a base item to build an outfit around');
            return;
        }

        if (!user) {
            setError('You must be logged in');
            return;
        }

        setIsGeneratingAI(true);
        setError('');

        try {
            // Get user's session token
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.access_token) {
                setError('Session expired. Please log in again.');
                return;
            }

            // Get IDs to exclude (previously generated items for regeneration)
            const excludeIds = aiGeneratedItems
                .filter(item => item.id !== baseItem.id)
                .map(item => item.id);

            // Call the recommendation API with Authorization header
            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    baseItemId: baseItem.id,
                    excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to generate outfit');
            }

            const data = await response.json();
            
            if (!data.outfit || data.outfit.length === 0) {
                setError('No matching items found. Try adding more items to your closet or select a different base item.');
                return;
            }

            // Set the generated outfit
            setAiGeneratedItems(data.outfit);
            setSelectedItemIds(data.outfit.map((item: ClothingItem) => item.id));
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate outfit. Please try again.');
        } finally {
            setIsGeneratingAI(false);
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

        // Only require name in manual mode
        if (!isAIMode && !formData.name.trim()) {
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

            // Use user-provided name in manual mode, or auto-generate in AI mode
            const outfitName = isAIMode 
                ? `Outfit ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
                : formData.name;

            const { data, error: createError } = await createOutfit(user.id, {
                name: outfitName,
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
                    <p className="text-sm text-gray-600">
                        {isAIMode ? 'Let AI help you create the perfect outfit' : 'Select clothing items to create an outfit'}
                    </p>
                </div>

                {/* Toggle Switch */}
                <div className="mb-6">
                    <div className="flex items-center justify-center space-x-4">
                        <button
                            type="button"
                            onClick={() => setIsAIMode(false)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                                !isAIMode 
                                    ? 'bg-gray-100 text-gray-700 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <User size={18} />
                            <span>Manual</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAIMode(true)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                                isAIMode 
                                    ? 'bg-thread-lens-accent text-thread-lens-primary font-medium' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Sparkles size={18} />
                            <span>AI Assistant</span>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Outfit Name - only show in Manual mode */}
                        {!isAIMode && (
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm"
                                    placeholder="e.g., Summer Beach Day"
                                    required
                                />
                            </div>
                        )}

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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all text-sm"
                                placeholder="e.g., Summer, Winter"
                            />
                        </div>
                    </div>

                    {/* Description - only show in Manual mode */}
                    {!isAIMode && (
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-thread-lens-primary focus:border-transparent transition-all resize-none text-sm"
                                placeholder="Add any notes about this outfit..."
                            />
                        </div>
                    )}

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

                    {/* AI Mode Content */}
                    {isAIMode ? (
                        <div className="space-y-4">
                            {/* Base Item Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Choose a base item
                                </label>
                                <div className="flex items-center space-x-3">
                                    {baseItem ? (
                                        <div className="flex items-center space-x-3 bg-thread-lens-accent border border-thread-lens-primary/20 rounded-lg p-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                                                {baseItem.image_url ? (
                                                    <img
                                                        src={baseItem.image_url}
                                                        alt={baseItem.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                                        {baseItem.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{baseItem.name}</p>
                                                <p className="text-xs text-gray-500">{baseItem.category} • {baseItem.color}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBaseItem(null)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowBaseItemSelector(!showBaseItemSelector)}
                                            className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-thread-lens-primary hover:text-thread-lens-primary transition-colors"
                                        >
                                            <Plus size={16} />
                                            <span>Select base item</span>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Base Item Selector */}
                                {showBaseItemSelector && !baseItem && (
                                    <div className="mt-3 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-4 gap-2">
                                            {clothingItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        setBaseItem(item);
                                                        setShowBaseItemSelector(false);
                                                    }}
                                                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-thread-lens-primary transition-all"
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
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Generate outfit with AI
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={generateAIOutfit}
                                        disabled={isGeneratingAI || !baseItem}
                                        className="flex-1 px-4 py-2 bg-thread-lens-primary hover:bg-thread-lens-secondary disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                                    >
                                        {isGeneratingAI ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                <span>{aiGeneratedItems.length > 0 ? 'Regenerate Outfit' : 'Generate Outfit'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {baseItem 
                                        ? `AI will find items that complement your ${baseItem.name.toLowerCase()}` 
                                        : 'Select a base item to get started'}
                                </p>
                            </div>

                            {/* AI Generated Items */}
                            {aiGeneratedItems.length > 0 && (
                                <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    AI Selected Items ({aiGeneratedItems.length} items)
                                    {baseItem && <span className="text-xs text-thread-lens-primary ml-2">• Built around your {baseItem.name}</span>}
                                </label>
                                    <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                        {aiGeneratedItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                    baseItem && item.id === baseItem.id 
                                                        ? 'ring-4 ring-thread-lens-primary' 
                                                        : 'ring-4 ring-thread-lens-dark'
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
                                                <div className={`absolute top-1 right-1 text-white rounded-full p-1 ${
                                                    baseItem && item.id === baseItem.id 
                                                        ? 'bg-thread-lens-primary' 
                                                        : 'bg-thread-lens-dark'
                                                }`}>
                                                    {baseItem && item.id === baseItem.id ? (
                                                        <User size={16} />
                                                    ) : (
                                                        <Sparkles size={16} />
                                                    )}
                                                </div>
                                                {baseItem && item.id === baseItem.id && (
                                                    <div className="absolute bottom-1 left-1 bg-thread-lens-primary text-white text-xs px-2 py-1 rounded">
                                                        Base
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Manual Mode Content */
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
                                                    ? 'ring-4 ring-thread-lens-primary'
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
                                                <div className="absolute top-1 right-1 bg-thread-lens-primary text-white rounded-full p-1">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

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
                        className="w-full font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm bg-thread-lens-primary hover:bg-thread-lens-secondary disabled:bg-gray-400 text-white"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Creating Outfit...
                            </div>
                        ) : (
                            isAIMode ? 'Create AI Outfit' : 'Create Outfit'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}


