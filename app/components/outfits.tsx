
import { Plus } from "lucide-react";

export default function Outfits() {
  return (
    <div className="grid grid-cols-4 gap-4 px-20 py-10">
        <div className="w-72 h-72 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 hover:cursor-pointer">
            <Plus className="text-black w-50 h-50" />
        </div>
    </div>
  );
}