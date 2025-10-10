"use client"

import { X, Home, Settings, User } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-60
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">ThreadLens</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Sidebar Content */}
        <nav className="p-4">
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Home size={20} />
              <span>Home</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <User size={20} />
              <span>Profile</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
