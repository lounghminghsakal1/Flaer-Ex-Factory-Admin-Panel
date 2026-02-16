"use client";

import { Package, Tag } from "lucide-react";

export default function BrandsForm({
  formData,
  setFormData,
  isEditing
}) {

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("meta.")) {
      const key = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        meta: { ...prev.meta, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* BASIC */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter brand name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${formData.status === 'active'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${!isEditing ? 'opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="
                    w-4 h-4 
                    accent-green-600 
                    focus:ring-0 focus:outline-none 
                    disabled:accent-gray-400
                    cursor-pointer
                  " 
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>

              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${formData.status === 'inactive'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="
                    w-4 h-4 
                    accent-red-600 
                    focus:ring-0 focus:outline-none 
                    disabled:accent-gray-400
                    cursor-pointer
                  "
                />

                <span className="text-sm font-medium text-gray-700">
                  Inactive
                </span>
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="brand_description"
              value={formData.brand_description}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows="3"
              placeholder="Enter brand description"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>

        </div>
      </div>

      {/* META */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">

        <div className="flex items-center gap-2 mb-3">
          <Tag size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Meta Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Country
            </label>
            <input
              type="text"
              name="meta.country"
              value={formData.meta.country}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="e.g., Germany"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Founded
            </label>
            <input
              type="text"
              name="meta.founded"
              value={formData.meta.founded}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="e.g., 1923"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Specialization
            </label>
            <input
              type="text"
              name="meta.specialization"
              value={formData.meta.specialization}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="e.g., Furniture Fittings"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}