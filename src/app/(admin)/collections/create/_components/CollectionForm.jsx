import { useState, useEffect } from 'react';
import { Tag, FileText, Layers, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const CollectionForm = ({
  collectionId = null,
  isEditing = false,
  initialData = null,
  onFormDataChange = null,
  collection = null,
  setCreateCollectionForm = null,
  setCollection = null
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    collection_type: initialData?.collection_type || 'manual',
    active: initialData?.active || true
  });

  const [isFetching, setIsFetching] = useState(false);

  // Determine if fields should be disabled
  const isFieldsDisabled = collectionId && !isEditing;

  // Fetch collection data when collectionId is provided
  useEffect(() => {
    if (collection) {
      setFormData(prev => {
        return {
          ...prev,
          name: collection.name,
          description: collection.description,
          collection_type: collection.collection_type,
          active: collection.active
        };
      });
      return;
    } else if (collectionId && collection) {
      setFormData(prev => {
        return {
          ...prev,
          name: collection.name,
          description: collection.description,
          collection_type: collection.collection_type,
          active: collection.active
        }
      })

      //fetchCollectionData();
    }
  }, [collectionId]);

  useEffect(() => {
    // For Create page
    if (!isEditing && setCreateCollectionForm) {
      setCreateCollectionForm(prev => ({
        ...prev,
        collection: {
          ...prev.collection,
          ...formData
        }
      }));
    }
    // For EDit page
    if (isEditing && setCollection) {
      setCollection(prev => ({
        ...prev,
        ...formData
      }));
    }

  }, [formData]);

  const fetchCollectionData = async () => {
    setIsFetching(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setFormData(result.data);
    } catch (err) {
      console.error('Error fetching collection:', err);
      toast.error('Failed to fetch collection details');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

  };

  const handleToggleActive = () => {
    if (isFieldsDisabled) return;
    setFormData(prev => ({
      ...prev,
      active: !prev.active
    }));
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 py-3 space-y-3">
        {/* Row 1: Collection Name and Active Toggle */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Tag size={14} className="text-gray-500" />
              Collection Name <span className='text-red-600'>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter collection name"
              disabled={isFieldsDisabled}
              className="w-100 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary focus:border-transparent outline-none transition-all disabled:bg-gray-100 "
              required
            />
          </div>

          {/* Active Toggle */}
          <div className="w-full flex-shrink-0">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              Status <span className='text-red-600'>*</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">
                {formData.active ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isFieldsDisabled}
                className={`relative w-11 h-6 rounded-full transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-300'
                  }  disabled:opacity-60 cursor-pointer`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Description + Collection Type */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <FileText size={14} className="text-gray-500" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter collection description"
              rows="2"
              disabled={isFieldsDisabled}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary focus:border-transparent outline-none transition-all resize-none disabled:bg-gray-100 "
            />
          </div>

          <div className="flex-shrink-0" style={{ minWidth: '180px' }}>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Layers size={14} className="text-gray-500" />
              Collection Type
            </label>
            <select
              name="collection_type"
              value={formData.collection_type}
              onChange={handleInputChange}
              disabled={isFieldsDisabled}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary focus:border-transparent outline-none transition-all bg-white cursor-pointer disabled:bg-gray-100 "
            >
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionForm;