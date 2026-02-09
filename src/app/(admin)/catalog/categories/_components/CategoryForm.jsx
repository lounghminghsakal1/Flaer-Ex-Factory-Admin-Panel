'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Loader2, ArrowLeft, Plus, Save, Edit2, X, Eye, Trash2, Edit2Icon } from 'lucide-react';
import { toast } from 'react-toastify';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';

export default function CategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateNew = searchParams.get('createNew') === 'true';
  const categoryId = searchParams.get('id');

  const [isEditing, setIsEditing] = useState(isCreateNew);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isCreateNew);

  const [categories, setCategories] = useState([]);
  const [isParentToggle, setIsParentToggle] = useState(true);
  const [lockedParentForChild, setLockedParentForChild] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    status: 'active',
    description: '',
    parent_id: null,
    // priority: 1
  });

  // Subcategory table states
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  // Popup states
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showCreateSubcategoryPopup, setShowCreateSubcategoryPopup] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isEditingPopup, setIsEditingPopup] = useState(true);
  const [popupFormData, setPopupFormData] = useState({
    name: '',
    title: '',
    status: 'active',
    description: '',
    parent_id: null,
    // priority: 1
  });

  useEffect(() => {
    if (isCreateNew) {
      fetchParentCategories();
    }
    if (!isCreateNew && categoryId) {
      fetchCategoryDetails();
      fetchSubcategories();
    }
  }, [categoryId, isCreateNew]);

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
      toast.error("Error fetching categories");
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
        // priority: data.priority ?? 1,
        parent_id: parentObj?.id ?? null
      });

    } catch (err) {
      toast.error('Failed to load category details');
      console.log('Failed to load category details', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    if (!categoryId) return;

    try {
      setSubcategoriesLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${categoryId}`
      );

      if (!response.ok) throw new Error('Failed to fetch subcategories');

      const result = await response.json();
      setSubcategories(result.data || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      toast.error("Error fetching subcategories");
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePopupInputChange = (e) => {
    const { name, value } = e.target;
    setPopupFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name || formData.name.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }

    if (!formData.title || formData.title.trim() === "") {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        title: formData.title,
        status: formData.status,
        description: formData.description,
        // priority: parseInt(formData.priority) || 1,
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
        toast.success('Category created successfully!');
      } else {
        toast.success('Category updated successfully!');
        setIsEditing(false);
        router.back();
      }

      setTimeout(() => {
        if (isCreateNew) {
          router.back();
        } else {
          fetchCategoryDetails();
        }
      }, 800);
    } catch (err) {
      toast.error(err.message || 'Something went wrong!');
      console.log(err.message, err);
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

  const handleViewDetails = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setPopupFormData({
      name: subcategory.name || '',
      title: subcategory.name || '',
      status: subcategory.status || 'active',
      description: subcategory.description || '',
      parent_id: subcategory.parent?.id || null,
      // priority: 1
    });
    setIsEditingPopup(true);
    setShowDetailPopup(true);
  };

  const handleCreateSubcategory = () => {
    setPopupFormData({
      name: '',
      title: '',
      status: 'active',
      description: '',
      parent_id: categoryId,
      // priority: 1
    });
    setIsEditingPopup(true);
    setShowCreateSubcategoryPopup(true);
  };

  const handlePopupSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!popupFormData.name || popupFormData.name.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: popupFormData.name,
        title: popupFormData.title,
        status: popupFormData.status,
        description: popupFormData.description,
        // priority: parseInt(popupFormData.priority) || 1,
        parent_id: showCreateSubcategoryPopup ? categoryId : popupFormData.parent_id
      };

      const url = showCreateSubcategoryPopup
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${selectedSubcategory.id}`;

      const method = showCreateSubcategoryPopup ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save subcategory');
      }

      toast.success(showCreateSubcategoryPopup ? 'Subcategory created successfully!' : 'Subcategory updated successfully!');

      setShowDetailPopup(false);
      setShowCreateSubcategoryPopup(false);
      setIsEditingPopup(true);
      fetchSubcategories();

    } catch (err) {
      toast.error(err.message || 'Something went wrong!');
      console.log(err.message, err);
    } finally {
      setLoading(false);
    }
  };

  const closePopups = () => {
    setShowDetailPopup(false);
    setShowCreateSubcategoryPopup(false);
    setSelectedSubcategory(null);
    setIsEditingPopup(true);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition-all border border-gray-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-7 h-7 text-blue-600" />
                {isCreateNew ? 'Create New Category' : 'Category Details'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isCreateNew
                  ? 'Fill in the details to create a new category'
                  : isEditing
                    ? 'Edit category information'
                    : 'View and manage category details'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={isCreateNew ? handleSubmit : handleEditToggle}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg ${isCreateNew
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
                Create Category
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Category
              </>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Category Type Card - Toggle and Parent Selector Combined */}
          {(isCreateNew) && (
            <div className="max-w-3xl bg-white rounded-md border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Toggle Section */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Category Type
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Toggle to create a parent category or leave it off for subcategory
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (
                      !lockedParentForChild &&
                      (isCreateNew || isEditing)
                    ) {
                      setIsParentToggle(!isParentToggle);
                    }
                  }}
                  disabled={
                    !!lockedParentForChild ||
                    (!isCreateNew && !isEditing)
                  }
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${lockedParentForChild ||
                    (!isCreateNew && !isEditing)
                    ? "bg-gray-300 cursor-not-allowed"
                    : isParentToggle
                      ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      : "bg-gray-300 hover:bg-gray-400 cursor-pointer"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${isParentToggle ? "translate-x-8" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {/* Parent Category Selector - Shown when toggle is off */}
              {!isParentToggle && (
                <div className="pt-1 border-t border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Parent Category <span className="text-red-500">*</span>
                  </label>

                  <SearchableDropdown
                    options={categories}
                    value={formData.parent_id}
                    onChange={(value) =>
                      setFormData({ ...formData, parent_id: value })
                    }
                    placeholder="Select parent category"
                    disabled={!!lockedParentForChild && !isEditing}
                  />

                  {lockedParentForChild && !isEditing && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                      Parent category is locked for this subcategory
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parent Category Information */}
          <div className="max-w-3xl bg-gradient-to-br from-white to-gray-50 rounded-md border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Category Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isCreateNew && !isEditing}
                  className={`w-full px-4 py-3 text-sm border rounded-xl transition-all ${isEditing || isCreateNew
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="Enter category name"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Display Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isCreateNew}
                  className={`w-full px-4 py-3 text-sm border rounded-xl transition-all ${isEditing || isCreateNew
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="Enter display title"
                />
              </div>

              {/* Priority */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isCreateNew}
                  className={`w-full px-4 py-3 text-sm border rounded-xl transition-all ${isEditing || isCreateNew
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="1"
                  min="1"
                />
              </div> */}

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${formData.status === 'active'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      } ${!isEditing && !isCreateNew ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleInputChange}
                      disabled={!isEditing && !isCreateNew}
                      className="w-4 h-4 cursor-pointer accent-green-600"
                    />
                    <span className={`text-sm font-semibold ${formData.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                      Active
                    </span>
                  </label>

                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${formData.status === 'inactive'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      } ${!isEditing && !isCreateNew ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleInputChange}
                      disabled={!isEditing && !isCreateNew}
                      className="w-4 h-4 cursor-pointer accent-gray-600"
                    />
                    <span className={`text-sm font-semibold ${formData.status === 'inactive' ? 'text-gray-700' : 'text-gray-700'}`}>
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isCreateNew}
                  rows="4"
                  className={`w-full px-4 py-3 text-sm border rounded-xl transition-all resize-none ${isEditing || isCreateNew
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                    } outline-none`}
                  placeholder="Enter category description"
                />
              </div>
            </div>
          </div>

          {/* Subcategory Details Table */}
          {!isCreateNew && categoryId && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-md border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Subcategory Details</h2>
                </div>
                <button
                  onClick={handleCreateSubcategory}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white rounded-xl text-sm font-semibold transition-all ease-in-out shadow-sm hover:shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Subcategory
                </button>
              </div>

              {subcategoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : subcategories.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No subcategories found</p>
                  {isEditing && (
                    <p className="text-gray-400 text-xs mt-1">Click "Create Subcategory" to add one</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Slug</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subcategories.map((subcategory, index) => (
                        <tr key={subcategory.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{subcategory.name}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{subcategory.code}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{subcategory.slug}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{subcategory.description ? subcategory.description : "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-1 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${subcategory.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {subcategory.status === 'active' ? "ACTIVE" : "IN ACTIVE"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleViewDetails(subcategory)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md hover:scale-105 cursor-pointer"
                            >
                              <Edit2Icon className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail/Edit Popup */}
      {showDetailPopup && selectedSubcategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Subcategory Details</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedSubcategory.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* {!isEditingPopup && (
                  <button
                    onClick={() => setIsEditingPopup(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )} */}
                <button
                  onClick={closePopups}
                  className="p-2 rounded-lg transition-colors hover:bg-red-500 cursor-pointer hover:text-gray-100"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Popup Content */}
            <div className="p-4 space-y-3">
              {/* Parent Category Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Parent Category</p>
                <p className="text-sm font-bold text-gray-900">{selectedSubcategory.parent?.name || 'N/A'}</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={popupFormData.name}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl transition-all ${isEditingPopup
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                      : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                      } outline-none`}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={popupFormData.title}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl transition-all ${isEditingPopup
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                      : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                      } outline-none`}
                  />
                </div>

                {/* Priority */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={popupFormData.priority}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl transition-all ${isEditingPopup
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                      : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                      } outline-none`}
                    min="1"
                  />
                </div> */}

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${popupFormData.status === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
                      } ${!isEditingPopup ? 'cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={popupFormData.status === 'active'}
                        onChange={handlePopupInputChange}
                        disabled={!isEditingPopup}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="text-sm font-semibold text-gray-700">Active</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${popupFormData.status === 'inactive' ? 'border-gray-500 bg-gray-50' : 'border-gray-300 bg-white'
                      } ${!isEditingPopup ? 'cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={popupFormData.status === 'inactive'}
                        onChange={handlePopupInputChange}
                        disabled={!isEditingPopup}
                        className="w-4 h-4 accent-gray-600"
                      />
                      <span className="text-sm font-semibold text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={popupFormData.description}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    rows="3"
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl transition-all resize-none ${isEditingPopup
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                      : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                      } outline-none`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditingPopup && (
                <div className="flex justify-center gap-3 pt-4 border-t">
                  <button
                    onClick={handlePopupSubmit}
                    disabled={loading}
                    className="w-52 flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={closePopups}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Subcategory Popup */}
      {showCreateSubcategoryPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create New Subcategory</h3>
                <p className="text-gray-600 text-sm mt-1">Fill in the details below</p>
              </div>
              <button
                onClick={closePopups}
                className="flex justify-center items-center px-3 py-1 hover:bg-red-400 border border-red-500 hover:text-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                X
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 space-y-3">
              {/* Parent Category Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Parent Category</p>
                <p className="text-sm font-bold text-gray-900">{formData.name}</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={popupFormData.name}
                    onChange={handlePopupInputChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white outline-none transition-all"
                    placeholder="Enter subcategory name"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={popupFormData.title}
                    onChange={handlePopupInputChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white outline-none transition-all"
                    placeholder="Enter title"
                  />
                </div>

                {/* Priority */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={popupFormData.priority}
                    onChange={handlePopupInputChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white outline-none transition-all"
                    placeholder="1"
                    min="1"
                  />
                </div> */}

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${popupFormData.status === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={popupFormData.status === 'active'}
                        onChange={handlePopupInputChange}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="text-sm font-semibold text-gray-700">Active</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${popupFormData.status === 'inactive' ? 'border-gray-500 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={popupFormData.status === 'inactive'}
                        onChange={handlePopupInputChange}
                        className="w-4 h-4 accent-gray-600"
                      />
                      <span className="text-sm font-semibold text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={popupFormData.description}
                    onChange={handlePopupInputChange}
                    rows="3"
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white outline-none transition-all resize-none"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-3 border-t">
                <button
                  onClick={handlePopupSubmit}
                  disabled={loading}
                  className="w-64 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Subcategory
                    </>
                  )}
                </button>
                <button
                  onClick={closePopups}
                  disabled={loading}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}