"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Tag, Save, Edit2, Upload, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const BrandsForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
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
    },
    category_id: ''
  });

  const [categories, setCategories] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Parse URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const createNew = urlParams.get('createNew');
    const brandId = urlParams.get('id');

    if (createNew === 'true') {
      setIsEditMode(false);
      setIsLocked(false);
    } else if (brandId) {
      setIsEditMode(true);
      setIsLocked(true);
      fetchBrandData(brandId);
    }

    // Fetch categories
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`);
      const result = await response.json();
      if (result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // toast.error("Failed to fetch categories");
    }
  };

  const fetchBrandData = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands/${id}`);
      const result = await response.json();
      const data = result.data;

      setFormData({
        brand_name: data.name ?? '',
        brand_code: data.code ?? '',
        brand_description: data.description ?? '',
        brand_slug: data.slug ?? '',
        priority: data.priority ?? 1,
        status: data.status ?? 'active',
        image_url: data.image_url ?? '',
        category_id: data.category_id ?? '',
        meta: {
          country: data.meta?.country ?? '',
          founded: data.meta?.founded ?? '',
          specialization: data.meta?.specialization ?? '',
        },
      });

    } catch (error) {
      console.error('Error fetching brand:', error);
      toast.error("Error fetching brand");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle priority to prevent 0 or negative values
    if (name === 'priority') {
      const numValue = parseInt(value) || 1;
      setFormData(prev => ({ ...prev, [name]: numValue < 1 ? 1 : numValue }));
      return;
    }

    if (name.startsWith('meta.')) {
      const metaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        meta: { ...prev.meta, [metaField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const brandId = urlParams.get('id');

    if (formData.brand_name === "") {
      toast.error("Name is required", {
        toastId: "name-error"
      });
      return;
    }

    try {
      const url = brandId
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands/${brandId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands`;

      const method = brandId ? 'PUT' : 'POST';

      const payload = {
        name: formData.brand_name,
        code: formData.brand_code,
        description: formData.brand_description,
        // slug: formData.brand_slug,
        priority: Number(formData.priority),
        status: formData.status,
        // image_url: formData.image_url,
        // category_id: Number(formData.category_id),
        meta: {
          country: formData.meta.country,
          founded: formData.meta.founded,
          specialization: formData.meta.specialization,
        },
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(brandId ? 'Brand updated successfully!' : 'Brand created successfully!');
      }
      router.push("/catalog/brands");
    } catch (error) {
      console.log("Error saving brand",error);
      toast.error('Error saving brand');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isLocked) {
      // Enter edit mode
      setIsLocked(false);
      return;
    }

    // Save when already editing
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditMode ? 'Brand Details' : 'Create New Brand'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? 'View brand information' : 'Fill in the details to create a new brand'}
            </p>
          </div>
        </div>
        {isEditMode ? (
          <button
            onClick={toggleEdit}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${isLocked
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {isLocked ? (
              <>
                <Edit2 className="w-4 h-4" />
                Edit
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Create Brand
          </button>
        )}
      </div>

      {/* Form Content */}
      <div className="max-w-3xl p-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BRAND NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brand_name"
                value={formData.brand_name}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="Enter brand name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BRAND CODE <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brand_code"
                value={formData.brand_code}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="Enter brand code"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div> */}

            {/* STATUS - Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                STATUS <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all cursor-pointer ${formData.status === 'active'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${!isLocked ? '' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={handleInputChange}
                    disabled={isLocked}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span
                    className={`text-sm font-medium ${formData.status === 'active' ? 'text-green-700' : 'text-gray-700'
                      }`}
                  >
                    Active
                  </span>
                </label>

                <label
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all cursor-pointer ${formData.status === 'inactive'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${!isLocked ? '' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={handleInputChange}
                    disabled={isLocked}
                    className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                  />
                  <span
                    className={`text-sm font-medium ${formData.status === 'inactive' ? 'text-gray-700' : 'text-gray-700'
                      }`}
                  >
                    Inactive
                  </span>
                </label>
              </div>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PRIORITY <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                onWheel={(e) => e.target.blur()}
                disabled={isLocked}
                min="1"
                placeholder="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div> */}

            {/* <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BRAND SLUG <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brand_slug"
                value={formData.brand_slug}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="e.g., hafele"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div> */}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DESCRIPTION <span className="text-red-500">*</span>
              </label>
              <textarea
                name="brand_description"
                value={formData.brand_description}
                onChange={handleInputChange}
                disabled={isLocked}
                rows="4"
                placeholder="Enter brand description"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Meta Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                COUNTRY
              </label>
              <input
                type="text"
                name="meta.country"
                value={formData.meta.country}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="e.g., Germany"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FOUNDED
              </label>
              <input
                type="text"
                name="meta.founded"
                value={formData.meta.founded}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="e.g., 1923"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SPECIALIZATION
              </label>
              <input
                type="text"
                name="meta.specialization"
                value={formData.meta.specialization}
                onChange={handleInputChange}
                disabled={isLocked}
                placeholder="e.g., Furniture Fittings"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsForm;