"use client"

import { useState } from 'react';
import { User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface HeaderProps {
  onSidebarToggle?: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center bg-white border-b border-gray-200 px-5 h-14">
        <div className="flex items-center space-x-4">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleAuthClick}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleAuthClick}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <User size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}

