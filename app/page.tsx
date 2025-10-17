"use client"

import { useState } from 'react';
import Header from "./components/Header";
import Outfits from "./components/pages/Outfits";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="w-full h-full">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={`
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'lg:ml-60' : 'ml-0'}
      `}>
        <Header onSidebarToggle={toggleSidebar} />
        <Outfits />
      </div>
    </div>
  );
}