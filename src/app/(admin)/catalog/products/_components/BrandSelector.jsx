import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

const BrandSelector = ({ selectedBrandId, onBrandSelect, formData, setFormData, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const dropdownRef = useRef(null);
  const brandRefs = useRef({});

  const [formDataPopup, setFormDataPopup] = useState({
    brand_name: '',
    brand_code: '',
    brand_description: '',
    brand_slug: '',
    priority: 1,
    status: 'active',
    image_url: '',
    meta: {
      country: '',
      founded: '',
      specialization: ''
    }
  });

  // Initialize selected brand from formData
  useEffect(() => {
    if (formData?.brand_id && brandOptions.length > 0 && !selectedBrand) {
      const found = brandOptions.find(b => b.id === formData.brand_id);
      if (found) {
        setSelectedBrand(found);
      }
    }
  }, [formData?.brand_id, brandOptions]);

  useEffect(() => {
    fetchBrandOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Auto-scroll to selected brand when dropdown opens
      if (selectedBrand && brandRefs.current[selectedBrand.id]) {
        setTimeout(() => {
          brandRefs.current[selectedBrand.id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedBrand]);

  async function fetchBrandOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands`);
      const result = await response.json();
      if (!response.ok || result.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setBrandOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands list "+err.message);
    }
  }

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);

    // Update parent form data
    if (setFormData) {
      setFormData(prev => ({
        ...prev,
        brand_id: brand.id
      }));
    }

    onBrandSelect?.(brand);
    setIsOpen(false);
  };

  const openCreatePopup = () => {
    setFormDataPopup({
      brand_name: '',
      brand_code: '',
      brand_description: '',
      brand_slug: '',
      priority: 1,
      status: 'active',
      image_url: '',
      meta: {
        country: '',
        founded: '',
        specialization: ''
      }
    });
    setShowCreatePopup(true);
    setIsOpen(false);
  };

  const handleCreateBrand = async () => {
    if (formDataPopup.brand_name === "") {
      toast.error("Name cannot be blank");
      return;
    }
    try {
      const body = {
        name: formDataPopup.brand_name,
        code: formDataPopup.brand_code,
        description: formDataPopup.brand_description,
        slug: formDataPopup.brand_slug,
        priority: formDataPopup.priority,
        status: formDataPopup.status,
        image_url: formDataPopup.image_url,
        meta: {
          country: formDataPopup.meta.country,
          founded: formDataPopup.meta.founded ? Number(formDataPopup.meta.founded) : null,
          specialization: formDataPopup.meta.specialization
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok || data.status === "failure") throw new Error(data?.errors[0] ?? "Something went wrong");
      if (response.ok) {
        const result = await response.json();
        const newBrand = result.data;

        setShowCreatePopup(false);
        toast.success("Brand created successfully");

        // Fetch updated brand list
        await fetchBrandOptions();

        // Auto-select the newly created brand
        const newBrandOption = { id: newBrand.id, name: newBrand.name };
        setSelectedBrand(newBrandOption);

        // Update parent form data
        if (setFormData) {
          setFormData(prev => ({
            ...prev,
            brand_id: newBrand.id
          }));
        }

        onBrandSelect?.(newBrandOption);

        // Reopen dropdown and scroll to new brand
        setTimeout(() => {
          setIsOpen(true);
          setTimeout(() => {
            brandRefs.current[newBrand.id]?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }, 100);
        }, 100);
      }
      if (data.status === "failure") throw new Error(data?.errors[0]);
    } catch (error) {
      console.error(error);
      toast.error("Error creating brand"+ error.message);
    }
  };

  const filteredBrands = brandOptions.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Brand
          </label>
          <button
            type="button"
            onClick={openCreatePopup}
            disabled={disabled}
            className={`flex items-center text-sm text-primary hover:text-primary/80 hover:underline font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
          >
            <Plus size={16} /> Create Brand
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 transition-colors text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={selectedBrand ? 'text-gray-900' : 'text-gray-400'}>
                {selectedBrand ? selectedBrand.name : 'Select brand'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              {/* Search Bar */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search brands..."
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Brand List */}
              <div className="max-h-64 overflow-y-auto py-1">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : filteredBrands.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No brands found</div>
                ) : (
                  <div>
                    {filteredBrands.map(brand => {
                      const isSelected = selectedBrand?.id === brand.id;
                      return (
                        <button
                          key={brand.id}
                          ref={el => brandRefs.current[brand.id] = el}
                          onClick={() => handleBrandSelect(brand)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                        >
                          {brand.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create Brand Button - Centered */}
              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={openCreatePopup}
                  disabled={disabled}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Brand</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Brand Popup */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Brand
              </h3>
              <button
                onClick={() => setShowCreatePopup(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type="text"
                  value={formDataPopup.brand_name}
                  onChange={(e) => setFormDataPopup({ ...formDataPopup, brand_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
                  placeholder="e.g., Hafele"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status 
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="active"
                      checked={formDataPopup.status === 'active'}
                      onChange={(e) => setFormDataPopup({ ...formDataPopup, status: e.target.value })}
                      className="w-4 h-4 cursor-pointer accent-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="inactive"
                      checked={formDataPopup.status === 'inactive'}
                      onChange={(e) => setFormDataPopup({ ...formDataPopup, status: e.target.value })}
                      className="w-4 h-4 cursor-pointer accent-gray-600 focus:ring-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Brand Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formDataPopup.brand_description}
                  onChange={(e) => setFormDataPopup({ ...formDataPopup, brand_description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 resize-none"
                  placeholder="e.g., Premium German brand for wardrobe systems..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowCreatePopup(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBrand}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                  disabled={formDataPopup.name === "s"}
                >
                  Create Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BrandSelector;