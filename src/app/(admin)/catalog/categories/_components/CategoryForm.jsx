'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Tag, Loader2, ArrowLeft, Plus, Save, Edit2 } from 'lucide-react';
import { successToast, errorToast } from '../../../../../../components/ui/toast';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';

export default function CategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateNew = searchParams.get('createNew') === 'true';
  const categoryId = searchParams.get('id');
  const tab = searchParams.get('tab');

  const [isEditing, setIsEditing] = useState(isCreateNew);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isCreateNew);

  const [categories, setCategories] = useState([]); // Parent categories for dropdown
  const [isParentToggle, setIsParentToggle] = useState(true);
  const [lockedParentForChild, setLockedParentForChild] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    status: 'active',
    description: '',
    parent_id: null,
    priority: 1,
    meta: {
      type: '',
      seo: ''
    }
  });

  useEffect(() => {
    fetchParentCategories();
    if (!isCreateNew && categoryId) {
      fetchCategoryDetails();
    }
  }, [categoryId, isCreateNew]);

  useEffect(() => {
    if (tab === "sub") {
      setIsParentToggle(false);
    }
  }, [tab]);

  useEffect(() => {
    if (isEditing) {
      setLockedParentForChild(null);
    }
  }, [isEditing]);

  const fetchParentCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`
      );
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      const namesArray = result.data.map((item) => ({ id: item.id, name: item.name }));
      setCategories(namesArray);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchCategoryDetails = async () => {
    try {
      setInitialLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${categoryId}`
      );

      if (!response.ok) throw new Error('Failed to fetch category');

      const result = await response.json();
      const data = result.data;

      const parentObj = data.parent
        ? {
          id: data.parent.id,
          name: data.parent.name
        }
        : null;

      setFormData({
        name: data.name ?? '',
        title: data.title ?? '',
        description: data.description ?? '',
        status: data.status ?? 'active',
        priority: data.priority ?? 1,
        parent_id: parentObj?.id ?? null,
        meta: {
          type: data.meta?.type ?? '',
          seo: data.meta?.seo ?? ''
        }
      });

      // Toggle logic
      if (tab === "sub") {
        setIsParentToggle(false);
      } else {
        setIsParentToggle(!parentObj);
      }

      // Lock parent if sub tab
      if (tab === "sub" && parentObj) {
        setLockedParentForChild(parentObj);
      }

    } catch (err) {
      errorToast('Failed to load category details');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('meta.')) {
      const metaField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          [metaField]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name || formData.name.trim() === "") {
      errorToast("Name cannot be empty");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        title: formData.title,
        status: formData.status,
        description: formData.description,
        priority: parseInt(formData.priority) || 1,
        meta: formData.meta,
        ...((!isParentToggle || lockedParentForChild) && {
          parent_id: lockedParentForChild?.id || formData.parent_id
        })
      };

      const url = isCreateNew
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${categoryId}`;

      const method = isCreateNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }

      if (isCreateNew) {
        successToast('Category created successfully!');
      } else {
        successToast('Category updated successfully!');
      }

      //successToast(isCreateNew ? 'Category created successfully!' : 'Category updated successfully!');

      setTimeout(() => {
        router.back();
      }, 800);
    } catch (err) {
      errorToast(err.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing && !isCreateNew) {
      handleSubmit();
    } else {
      setIsEditing(!isEditing);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors border cursor-pointer border-gray-200 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isCreateNew ? 'Create New Category' : 'Category Details'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isCreateNew
                  ? 'Fill in the details to create a new category'
                  : isEditing
                    ? 'Edit category information'
                    : 'View category information'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={isCreateNew ? handleSubmit : handleEditToggle}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${isCreateNew
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : isEditing
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''} cursor-pointer`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isCreateNew ? 'Creating...' : 'Saving...'}
              </>
            ) : isCreateNew ? (
              <>
                <Plus className="w-4 h-4" />
                Save
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit
              </>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Is Parent Toggle Card */}
          {(isCreateNew) && tab !== "parent" && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Is Parent Category
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Toggle this to create a parent category or leave it off for a subcategory
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (
                      tab !== "sub" &&
                      !lockedParentForChild &&
                      (isCreateNew || isEditing)
                    ) {
                      setIsParentToggle(!isParentToggle);
                    }
                  }}
                  disabled={
                    tab === "sub" ||
                    !!lockedParentForChild ||
                    (!isCreateNew && !isEditing)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${tab === "sub" ||
                    lockedParentForChild ||
                    (!isCreateNew && !isEditing)
                    ? "bg-gray-300 cursor-not-allowed pointer-events-auto"
                    : isParentToggle
                      ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      : "bg-gray-300 hover:bg-gray-400 cursor-pointer"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isParentToggle ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </div>
          )}


          {/* Parent Category Selector */}
          {!isParentToggle && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Parent Category <span className="text-red-500">*</span>
              </label>

              <SearchableDropdown
                options={categories}
                value={formData.parent_id}
                onChange={(value) =>
                  setFormData({ ...formData, parent_id: value })
                }
                placeholder="Select parent category"
                disabled={
                  !!lockedParentForChild && !isEditing
                }
              />

              {lockedParentForChild && !isEditing && (
                <p className="text-xs text-gray-500 mt-2">
                  Parent category is locked for this subcategory
                </p>
              )}
            </div>
          )}


          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  CATEGORY NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isCreateNew && !isEditing}
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="Enter category name"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  TITLE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="Enter title"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  STATUS <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <label
                    className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 has-[:checked]:border-green-500 has-[:checked]:bg-green-50 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-4 h-4 cursor-pointer accent-green-600 focus:ring-green-500"
                    />
                    <span
                      className={`text-sm font-medium ${formData.status === 'active' ? 'text-green-700' : 'text-gray-700'
                        }`}
                    >
                      Active
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 has-[:checked]:border-gray-500 has-[:checked]:bg-gray-50 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-4 h-4 cursor-pointer accent-gray-600 focus:ring-gray-500"
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

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  PRIORITY <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="1"
                  min="1"
                />
              </div>

              {/* Description - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  DESCRIPTION <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all resize-none ${isEditing
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="Enter category description"
                />
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-purple-600" />
              <h2 className="text-base font-semibold text-gray-900">Meta Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">TYPE</label>
                <input
                  type="text"
                  name="meta.type"
                  value={formData.meta.type}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="e.g., material"
                />
              </div>

              {/* SEO Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">SEO SLUG</label>
                <input
                  type="text"
                  name="meta.seo"
                  value={formData.meta.seo}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="e.g., wood-products"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}