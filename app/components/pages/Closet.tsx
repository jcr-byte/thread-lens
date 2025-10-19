"use client"

import { Plus } from "lucide-react";
import { useState } from "react";
import AddClothingModal from "../ui/AddClothingModal";

export default function Closet() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <AddClothingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Optional: Add any refresh logic here
          console.log('Item added successfully!');
        }}
      />
      
      <div className="grid grid-cols-4 gap-4 px-20 py-10">
        <div 
          onClick={() => setIsModalOpen(true)}
          className="w-72 h-72 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 hover:cursor-pointer transition-colors"
        >
          <Plus className="text-black w-50 h-50" />
        </div>
      </div>
    </>
  );
}