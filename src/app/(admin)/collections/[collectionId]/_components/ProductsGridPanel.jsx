// ProductsGridPanel.jsx (Updated)
import { useState, useEffect } from "react";
import { Package, ArrowLeft, Edit2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import { toast } from "react-toastify";

export default function ProductsGridPanel({ products, collectionName, collectionId, setCollectionData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [removingIds, setRemovingIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSaveChanges = async () => {
    if (removingIds.length === 0) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        item_ids: removingIds
      };

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}/remove_collection_item_mapping`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Items removed:', data);
        setIsEditing(false);
        setRemovingIds([]);
        toast.success("Product(s) removed from collection");
        // refresh page
        refreshProductsList();
      } else {
        console.error('Failed to remove items');
      }
    } catch (error) {
      console.error('Error removing items:', error);
      toast.error("Failed to remove product(s) from collection");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancel edit - reset removing ids
      setRemovingIds([]);
    }
    setIsEditing(!isEditing);
  };

  const handleBack = () => {
    router.back();
  };

  async function refreshProductsList() {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setCollectionData(result.data);
    } catch(err) {
      console.log(err);
    }
  }

  return (
    <div className="w-full">
      {/* Header with Back, Title, and Edit/Save buttons */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>

          {/* Collection Name and Info */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{collectionName}</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {products?.length || 0} {products?.length === 1 ? 'item' : 'items'} in this collection
              {isEditing && removingIds.length > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  ({removingIds.length} marked for removal)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Edit/Save Buttons */}
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleToggleEdit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
            >
              <X size={16} />
              Cancel
            </button>
          )}
          
          <button
            onClick={isEditing ? handleSaveChanges : handleToggleEdit}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              isEditing
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save size={16} />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 size={16} />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              collectionItem={item}
              isEditing={isEditing}
              removingIds={removingIds}
              setRemovingIds={setRemovingIds}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center col-span-full">
          <Package size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">No items in this collection</p>
          <p className="text-sm text-gray-500 mt-1">Add products to get started</p>
        </div>
      )}
    </div>
  );
}