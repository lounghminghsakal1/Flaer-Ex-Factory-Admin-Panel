import { useState } from 'react';
import { X, Plus, Tag, FileText, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-toastify';

const CreateCollectionPopup = ({ showCreateCollectionPopup, setShowCreateCollectionPopup, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collection_type: 'manual',
    active: true
  });

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
    setShowCreateCollectionPopup(false);
    // Reset form
    setFormData({
      name: '',
      description: '',
      collection_type: 'manual',
      active: true
    });
  };

  const handleCreateCollection = async () => {
    setLoading(true);
    try {
      const payload = {
        collection: formData
      };
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Collection created:', data);
        handleClose();
        toast.success("Collection created successfully");
        onSuccess();
      } else {
        console.error('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error("Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  if (!showCreateCollectionPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create New Collection</h2>
                <p className="text-blue-100 text-sm mt-0.5">Add a new collection</p>
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
              placeholder="Enter collection name"
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
              placeholder="Enter collection description"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer"
            >
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="mb-1">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
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
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    formData.active ? 'translate-x-7' : 'translate-x-0'
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
            onClick={handleCreateCollection}
            disabled={loading || !formData.name}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 hover:scale-105 active:scale-100 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Collection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCollectionPopup;
