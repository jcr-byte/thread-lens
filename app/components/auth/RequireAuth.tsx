'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../AuthModal';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  showAuthModal?: boolean;
}

/**
 * Component that only renders children if user is authenticated.
 * Shows loading spinner while checking auth, and auth modal if not authenticated.
 */
export default function RequireAuth({ 
  children, 
  fallback = null,
  showAuthModal = true 
}: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && showAuthModal) {
      setShowModal(true);
    }
  }, [isLoading, isAuthenticated, showAuthModal]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated, show fallback or auth modal
  if (!isAuthenticated || !user) {
    return (
      <>
        {fallback}
        {showAuthModal && (
          <AuthModal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)}
            onSuccess={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

