"use client"

import { useState } from 'react';
import Header from "./components/Header";
import Closet from "./components/pages/Closet";
import Outfits from "./components/pages/Outfits";
import Sidebar from "./components/Sidebar";

export type Page = 'closet' | 'outfits' | 'profile' | 'settings';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('closet');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'closet':
        return <Closet />;
      case 'outfits':
        return <Outfits />;
      case 'profile':
        return <div className="p-10"><h1 className="text-2xl font-bold">Profile - Coming Soon</h1></div>;
      case 'settings':
        return <div className="p-10"><h1 className="text-2xl font-bold">Settings - Coming Soon</h1></div>;
      default:
        return <Closet />;
    }
  };

  return (
    <div className="w-full h-full">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      <div className={`
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'lg:ml-60' : 'ml-0'}
      `}>
        <Header onSidebarToggle={toggleSidebar} onPageChange={handlePageChange} />
        {renderPage()}
      </div>
    </div>
  );
}