'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserClothingItems } from '../../lib/api/clothing';
import { ClothingItem, ClothingCategory } from '../../types/clothing';

interface AIOutfitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AIOutfitModal({ isOpen, onClose, onSuccess }: AIOutfitModalProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<'select' | 'details'>('select');
    
    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
    const [selectedColor, setSelectedColor] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Outfit details
    const [occasion, setOccasion] = useState('');
    const [description, setDescription] = useState('');

    // Load user's clothing items when modal opens and reset state
    useEffect(() => {
        if (isOpen && user) {
            loadClothingItems();
            setCurrentStep('select');
            setSelectedItemIds([]);
            setOccasion('');
            setDescription('');
            resetFilters();
        }
    }, [isOpen, user]);

    // Apply filters whenever items or filter states change
    useEffect(() => {
        applyFilters();
    }, [clothingItems, selectedCategory, selectedColor, searchQuery]);

    const loadClothingItems = async () => {
        if (!user) return;
        setIsLoading(true);
        const { data } = await getUserClothingItems(user.id);
        if (data) {
            setClothingItems(data);
        }
        setIsLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...clothingItems];

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Color filter
        if (selectedColor !== 'all') {
            filtered = filtered.filter(item => 
                item.color?.toLowerCase() === selectedColor.toLowerCase()
            );
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredItems(filtered);
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItemIds(prev => {
            if (prev.includes(itemId)) {
                // If item is already selected, remove it
                return prev.filter(id => id !== itemId);
            } else if (prev.length < 3) {
                // If less than 3 items selected, add this one
                return [...prev, itemId];
            } else {
                // Already at max limit, don't add
                return prev;
            }
        });
    };

    const getUniqueColors = () => {
        const colors = clothingItems
            .map(item => item.color)
            .filter((color): color is string => !!color);
        return Array.from(new Set(colors)).sort();
    };

    const categories: (ClothingCategory | 'all')[] = [
        'all',
        'tops',
        'bottoms',
        'dresses',
        'outerwear',
        'shoes',
        'accessories',
        'undergarments',
        'activewear'
    ];

    const resetFilters = () => {
        setSelectedCategory('all');
        setSelectedColor('all');
        setSearchQuery('');
    };

    const handleNext = () => {
        if (selectedItemIds.length > 0) {
            setCurrentStep('details');
        }
    };

    const handleBack = () => {
        setCurrentStep('select');
    };

    const handleGenerate = () => {
        // TODO: Implement AI outfit generation
        console.log('Generating outfit with:', {
            selectedItemIds,
            occasion,
            description
        });
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl p-6 w-full max-w-7xl max-h-[90vh] shadow-2xl relative flex flex-col"
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
                    <div className="flex items-center space-x-2 mb-1">
                        <Sparkles className="text-purple-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-900">
                            {currentStep === 'select' ? 'Create AI Outfit' : 'Outfit Details'}
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600">
                        {currentStep === 'select' 
                            ? 'Select up to 3 base items for your outfit'
                            : 'Add optional details for your outfit'
                        }
                    </p>
                </div>

                {/* Step 1: Item Selection */}
                {currentStep === 'select' && (
                <>
                {/* Filter Section */}
                <div className="mb-4 space-y-3">
                    {/* Search and Filter Toggle */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                                showFilters || selectedCategory !== 'all' || selectedColor !== 'all'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                                                selectedCategory === category
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedColor('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            selectedColor === 'all'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }`}
                                    >
                                        All
                                    </button>
                                    {getUniqueColors().map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                                                selectedColor === color
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                            }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Filters */}
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                Reset all filters
                            </button>
                        </div>
                    )}

                    {/* Selected Items Counter */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {filteredItems.length} of {clothingItems.length} items
                            {selectedItemIds.length > 0 && (
                                <span className={`ml-2 font-medium ${
                                    selectedItemIds.length === 3 ? 'text-purple-600' : 'text-purple-600'
                                }`}>
                                    • {selectedItemIds.length}/3 selected
                                </span>
                            )}
                        </p>
                        {selectedItemIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedItemIds([])}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>
                </div>

                {/* Items Grid */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <p className="text-lg font-medium">No items found</p>
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-6 gap-6 p-2">
                            {filteredItems.map((item) => {
                                const isSelected = selectedItemIds.includes(item.id);
                                const isDisabled = !isSelected && selectedItemIds.length >= 3;
                                
                                return (
                                <div
                                    key={item.id}
                                    onClick={() => !isDisabled && toggleItemSelection(item.id)}
                                    className={`aspect-square rounded-lg overflow-hidden transition-all relative ${
                                        isDisabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : 'cursor-pointer'
                                    } ${
                                        isSelected
                                            ? 'ring-2 ring-purple-500 shadow-lg scale-105'
                                            : isDisabled 
                                            ? '' 
                                            : 'hover:shadow-lg hover:scale-105'
                                    }`}
                                >
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm p-2 text-center">
                                            {item.name}
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
                                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                                                ✓
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Step 1 Action Buttons */}
                <div className="mt-6 flex space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={selectedItemIds.length === 0}
                        className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Next
                    </button>
                </div>
                </>
                )}

                {/* Step 2: Outfit Details */}
                {currentStep === 'details' && (
                <>
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Selected Items Preview */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Selected Items ({selectedItemIds.length})
                            </label>
                            <div className="flex space-x-3">
                                {clothingItems
                                    .filter(item => selectedItemIds.includes(item.id))
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="w-24 h-24 rounded-lg overflow-hidden ring-2 ring-purple-500"
                                        >
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                                                    {item.name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Occasion Input */}
                        <div>
                            <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-2">
                                Occasion (Optional)
                            </label>
                            <input
                                type="text"
                                id="occasion"
                                value={occasion}
                                onChange={(e) => setOccasion(e.target.value)}
                                placeholder="e.g., Casual, Formal, Date Night"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                            />
                        </div>

                        {/* Description Input */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add any notes or preferences..."
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2 Action Buttons */}
                <div className="mt-6 flex space-x-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                <span>Generate</span>
                            </>
                        )}
                    </button>
                </div>
                </>
                )}
            </div>
        </div>
    );
}

