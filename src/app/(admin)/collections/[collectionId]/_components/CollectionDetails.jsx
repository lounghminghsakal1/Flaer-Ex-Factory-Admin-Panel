"use client";

import { useState } from "react";
import ProductsGridPanel from "./ProductsGridPanel";
import SidebarArrowTrigger from "./SidebarArrowTrigger";
import RightModalPanel from "./RightModalPanel";
import { ArrowLeft } from "lucide-react";

export default function CollectionDetails({
  collection,
  setCollectionData,
  products
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex gap-1 h-screen p-4">
        <div className="w-[97%]">
          <ProductsGridPanel products={products} collectionName={collection.name} collectionId={collection.id} setCollectionData={setCollectionData} />
        </div>
        <div className="fixed top-1/2 right-2.5 flex justify-center items-center">
          <span className="p-3 rounded-full border-2 border-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer " onClick={() => setShowModal(true)} ><ArrowLeft /></span>
        </div>
        {showModal && (
          <RightModalPanel collectionId={collection.id} onClose={() => setShowModal(false)} setCollectionData={setCollectionData} />
        )} 
    </div>
  );
}
