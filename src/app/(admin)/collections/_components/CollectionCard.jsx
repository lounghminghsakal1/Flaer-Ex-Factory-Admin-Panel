import React, { useEffect, useState } from 'react';
import { Tag, Package, ArrowRight, Edit2, X, Plus, FileText, Layers, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const EditCollectionPopup = ({ collection, showPopup, setShowPopup, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    collection_type: collection?.collection_type || 'manual',
    active: collection?.active || false
  });

  useEffect(() => {
    if (showPopup && collection?.id) {
      fetchCollectionData();
    }
  }, [showPopup, collection?.id]);


  async function fetchCollectionData() {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collection.id}`;
      const response = await fetch(url);
      const result = await response.json();
      setFormData(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({
      ...prev,
      active: !prev.active
    }));
  };

  const handleClose = () => {
    setShowPopup(false);
    // Reset form to original values
    setFormData({
      name: collection?.name || '',
      description: collection?.description || '',
      collection_type: collection?.collection_type || 'manual',
      active: collection?.active || false
    });
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const payload = {
        collection: {
          name: formData.name,
          description: formData.description,
          collection_type: formData.collection_type,
          active: formData.active
        }
      };

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collection.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Collection updated:', data);
        if (onUpdate) {
          onUpdate();
        }
        handleClose();
        toast.success("Collection updated successfully");
      } else {
        console.error('Failed to update collection');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error("Failed to update collection");
    } finally {
      setLoading(false);
    }
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Edit2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Edit Collection</h2>
                <p className="text-blue-100 text-sm mt-0.5">Update collection details</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Name Field */}
          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <Tag size={16} className="text-blue-500" />
              Collection Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Best Sellers – TMT Bars"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Description Field */}
          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <FileText size={16} className="text-blue-500" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Top selling TMT bars across sizes and grades"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          {/* Collection Type Dropdown */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <Layers size={16} className="text-blue-500" />
              Collection Type *
            </label>
            <select
              name="collection_type"
              value={formData.collection_type}
              onChange={handleInputChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer capitalize"
            >
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="mb-1">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                {formData.active ? (
                  <ToggleRight size={24} className="text-green-500" />
                ) : (
                  <ToggleLeft size={24} className="text-gray-400" />
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Active Status</span>
                  <span className="text-xs text-gray-500">
                    {formData.active ? 'Collection is active' : 'Collection is inactive'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                className={`relative w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${formData.active ? 'translate-x-7' : 'translate-x-0'
                    }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading || !formData.name}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 hover:scale-105 cursor-pointer active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const CollectionCard = ({ collection, onUpdateCollection }) => {
  const router = useRouter();
  const [showEditPopup, setShowEditPopup] = useState(false);

  const handleCardClick = (e) => {
    // Don't navigate if clicking the edit button
    if (e.target.closest('.edit-button')) {
      return;
    }
    router.push(`/collections/${collection.id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setShowEditPopup(true);
  };

  return (
    <React.Fragment key={collection.id}>
      <div
        className="group bg-white rounded-xl border border-gray-200 p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 cursor-pointer relative"
        onClick={handleCardClick}
      >
        {/* Edit Button - Top Right */}
        <button
          onClick={handleEditClick}
          className="edit-button absolute top-3 right-3 p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <Edit2 size={16} />
        </button>

        {/* Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 pr-10">
          {collection.name}
        </h3>

        {/* Collection Type */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200 capitalize">
            <Package size={12} />
            {collection.collection_type}
          </span>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">
            {collection.description}
          </p>
        )}

        {/* Slug */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
          <Tag size={14} className="text-gray-400" />
          <span className="font-mono text-gray-600">
            {collection.slug}
          </span>
        </div>

        {/* Footer - Status and Arrow */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span
            className={`px-2.5 py-1 text-sm font-semibold rounded-full ${collection.active
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
              }`}
          >
            {collection.active ? 'Active' : 'Inactive'}
          </span>

          <div className="p-2 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Edit Popup */}
      <EditCollectionPopup
        collection={collection}
        showPopup={showEditPopup}
        setShowPopup={setShowEditPopup}
        onUpdate={onUpdateCollection}
      />
    </React.Fragment>
  );
};

export default CollectionCard;
