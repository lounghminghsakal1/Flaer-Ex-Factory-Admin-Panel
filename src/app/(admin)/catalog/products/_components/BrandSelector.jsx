import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';

const BrandSelector = ({ selectedBrandId, onBrandSelect, formData, setFormData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef(null);


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
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  async function fetchBrandOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands`);
      if (!response.ok) throw new Error("Failed to fetch brands list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setBrandOptions(namesArray);
    } catch (err) {
      console.log(err);
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

      if (response.ok) {
        setShowCreatePopup(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchBrandOptions();
      }
    } catch (error) {
      console.error('Error creating brand:', error);
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
            className="text-sm text-blue-600 hover:text-blue-900 font-medium cursor-pointer"
          >
            + Create Brand
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          >
            <div className="flex items-center justify-between">
              <span className={selectedBrand ? 'text-gray-900' : 'text-gray-400'}>
                {selectedBrand ? selectedBrand.name : 'Select brand'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && (
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
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    {filteredBrands.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => handleBrandSelect(brand)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Brand Button */}
              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={openCreatePopup}
                  className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Brand</span>
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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Brand
              </h3>
              <button
                onClick={() => setShowCreatePopup(false)}
                className="text-gray-400 border-2 p-2 rounded-md hover:text-gray-50 hover:bg-red-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={formDataPopup.brand_name}
                  onChange={(e) => setFormDataPopup({ ...formDataPopup, brand_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Hafele"
                />
              </div>

              {/* Brand Code
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Code *
                </label>
                <input
                  type="text"
                  value={formDataPopup.brand_code}
                  onChange={(e) => setFormDataPopup({ ...formDataPopup, brand_code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., HAF"
                  maxLength="10"
                />
              </div> */}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="e.g., Premium German brand for wardrobe systems..."
                />
              </div>

              {/* Brand Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Slug
                </label>
                <input
                  type="text"
                  value={formDataPopup.brand_slug}
                  onChange={(e) => setFormDataPopup({ ...formDataPopup, brand_slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., hafele"
                />
              </div>

              {/* Image URL
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formDataPopup.image_url}
                  onChange={(e) => setFormDataPopup({ ...formDataPopup, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div> */}

              {/* Meta Information Section */}
              {/* <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>

                <div className="space-y-3"> */}
                  {/* Country */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formDataPopup.meta.country}
                      onChange={(e) => setFormDataPopup({
                        ...formDataPopup,
                        meta: { ...formDataPopup.meta, country: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Germany"
                    />
                  </div> */}

                  {/* Founded Year */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      value={formDataPopup.meta.founded}
                      onChange={(e) => setFormDataPopup({
                        ...formDataPopup,
                        meta: { ...formDataPopup.meta, founded: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 1923"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  </div> */}

                  {/* Specialization */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formDataPopup.meta.specialization}
                      onChange={(e) => setFormDataPopup({
                        ...formDataPopup,
                        meta: { ...formDataPopup.meta, specialization: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Furniture Fittings"
                    />
                  </div> */}
                {/* </div>
              </div> */}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreatePopup(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-800 hover:text-gray-100 transition-colors font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBrand}
                  className="flex-1 px-4 py-2 text-sm bg-blue-400 text-white rounded-md hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-3 border-r-2 border-b-2 border-green-500 transform rotate-45"></div>
          </div>
          <span className="font-medium">Brand created successfully!</span>
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