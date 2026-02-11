"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import CreateCollectionPopup from "./CreateCollectionPopup";

export default function CollectionsListingPageHeader({ onCollectionCreated }) {
  
  const [showCreateCollectionPopup, setShowCreateCollectionPopup] = useState(false);

  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-2xl font-bold text-blue-800">Collections</h2>
      </div>
      <div>
        <button className="flex bg-blue-800 text-gray-100 px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 " onClick={() => setShowCreateCollectionPopup(true)}><span><Plus /></span> Create Collection</button>
      </div>
      <CreateCollectionPopup showCreateCollectionPopup={showCreateCollectionPopup} setShowCreateCollectionPopup={setShowCreateCollectionPopup} onSuccess={onCollectionCreated} />
    </div>
  );
}