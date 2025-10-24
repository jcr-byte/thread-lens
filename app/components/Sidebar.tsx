"use client"

import { X, Home, Settings, User, Shirt } from 'lucide-react';
import { Page } from '../page';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export default function Sidebar({ isOpen, onClose, currentPage, onPageChange }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-100 border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-60
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 pl-2 pr-4 border-b border-gray-200">
          <img 
            src="/branding/thread-lens-wordmark-transparent-svg.svg"
            alt="ThreadLens"
            className="h-36 mt-2"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Sidebar Content */}
        <nav className="p-4">
          <div className="space-y-1">
            <button 
              onClick={() => onPageChange('closet')}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 text-left rounded-lg transition-colors text-sm ${
                currentPage === 'closet' 
                  ? 'bg-thread-lens-primary text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home size={16} />
              <span>Closet</span>
            </button>
            
            <button 
              onClick={() => onPageChange('outfits')}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 text-left rounded-lg transition-colors text-sm ${
                currentPage === 'outfits' 
                  ? 'bg-thread-lens-primary text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Shirt size={16} />
              <span>Outfits</span>
            </button>
            
            <button 
              onClick={() => onPageChange('profile')}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 text-left rounded-lg transition-colors text-sm ${
                currentPage === 'profile' 
                  ? 'bg-thread-lens-primary text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User size={16} />
              <span>Profile</span>
            </button>
            
            <button 
              onClick={() => onPageChange('settings')}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 text-left rounded-lg transition-colors text-sm ${
                currentPage === 'settings' 
                  ? 'bg-thread-lens-primary text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
