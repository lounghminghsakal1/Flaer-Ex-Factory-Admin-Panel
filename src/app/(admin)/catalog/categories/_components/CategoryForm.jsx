"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Loader2, X, Save, Edit2Icon, SquarePen } from "lucide-react";
import { toast } from "react-toastify";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import SubCategoriesTableSkeleton from "./SubCategoriesTableSkeleton";

export default function CategoryForm({
  formData,
  setFormData,
  isEditing,
  isCreateNew,
  isParentToggle,
  setIsParentToggle
}) {
  const [categories, setCategories] = useState([]);


  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [showCreateSubcategoryPopup, setShowCreateSubcategoryPopup] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isEditingPopup, setIsEditingPopup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [popupFormData, setPopupFormData] = useState({
    name: "",
    title: "",
    status: "active",
    description: "",
    parent_id: null
  });

  // Get category ID from URL
  const categoryId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('id')
    : null;

  useEffect(() => {
    if (isCreateNew) {
      fetchParentCategories();
    }
    if (!isCreateNew && categoryId) {
      fetchSubcategories();
    }
  }, [categoryId, isCreateNew]);

  const fetchParentCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      const result = await response.json();
      const namesArray = result.data.map((item) => ({ id: item.id, name: item.name }));
      setCategories(namesArray);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Error fetching categories");
    }
  };

  const fetchSubcategories = async () => {
    if (!categoryId) return;

    try {
      setSubcategoriesLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${categoryId}`
      );

      if (!response.ok) throw new Error("Failed to fetch subcategories");

      const result = await response.json();
      setSubcategories(result.data || []);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      toast.error("Error fetching subcategories");
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePopupInputChange = (e) => {
    const { name, value } = e.target;
    setPopupFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewDetails = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setPopupFormData({
      name: subcategory.name || "",
      title: subcategory.title || subcategory.name || "",
      status: (subcategory.status || "active").toLowerCase(),
      description: subcategory.description || "",
      parent_id: subcategory.parent?.id || null
    });
    setIsEditingPopup(true);
    setShowDetailPopup(true);
  };

  const handleCreateSubcategory = () => {
    setPopupFormData({
      name: "",
      title: "",
      status: "active",
      description: "",
      parent_id: categoryId
    });
    setIsEditingPopup(true);
    setShowCreateSubcategoryPopup(true);
  };

  const handlePopupSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!popupFormData.name || popupFormData.name.trim() === "" || popupFormData.title.trim() === "") {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: popupFormData.name,
        title: popupFormData.title,
        status: popupFormData.status,
        description: popupFormData.description,
        parent_id: showCreateSubcategoryPopup ? categoryId : popupFormData.parent_id
      };

      const url = showCreateSubcategoryPopup
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${selectedSubcategory.id}`;

      const method = showCreateSubcategoryPopup ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save subcategory");
      }

      toast.success(
        showCreateSubcategoryPopup
          ? "Subcategory created successfully!"
          : "Subcategory updated successfully!"
      );

      setShowDetailPopup(false);
      setShowCreateSubcategoryPopup(false);
      setIsEditingPopup(true);
      fetchSubcategories();
    } catch (err) {
      toast.error(err.message || "Something went wrong!");
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

  return (
    <div className="space-y-3">

      {/* CATEGORY TYPE TOGGLE - Only for Create New */}
      {isCreateNew && (
        <div className="w-150 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Category Type
              </h3>
              <p className="text-xs text-gray-500">
                Toggle to create a parent category or leave it off for subcategory
              </p>
            </div>

            <button
              onClick={() => setIsParentToggle(!isParentToggle)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-secondary focus:ring-offset-2 ${isParentToggle
                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                : "bg-gray-300 hover:bg-gray-400 cursor-pointer"
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${isParentToggle ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </div>

          {!isParentToggle && (
            <div className="pt-2 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-800 mb-1.5">
                Parent Category <span className="text-red-500">*</span>
              </label>

              <SearchableDropdown
                options={categories}
                value={formData.parent_id}
                onChange={(value) =>
                  setFormData({ ...formData, parent_id: value })
                }
                placeholder="Select parent category"
              />
            </div>
          )}
        </div>
      )}

      {/* BASIC INFORMATION */}
      <div className="w-150 bg-white border border-gray-200 rounded-lg p-4">

        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Category Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">

          {/* Category Name */}
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing && !isCreateNew}
              placeholder="Enter category name"
              className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing || isCreateNew
                ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
                : "border-gray-200 bg-gray-50 text-gray-500 "
                } outline-none placeholder:text-gray-300 `}
            />
          </div>

          {/* Display Title */}
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1.5">
              Display Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={!isEditing && !isCreateNew}
              placeholder="Enter display title"
              className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditing || isCreateNew
                ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
                : "border-gray-200 bg-gray-50 text-gray-500 "
                } outline-none placeholder:text-gray-300 `}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-800 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <label
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.status === "active"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                  } ${!isEditing && !isCreateNew ? "opacity-60 " : ""}`}
              >
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isCreateNew}
                  className="w-4 h-4 cursor-pointer focus:ring-0 focus:outline-none accent-green-600 disabled:accent-gray-400"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>

              <label
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${formData.status === "inactive"
                  ? "border-gray-500 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                  } ${!isEditing && !isCreateNew ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isCreateNew}
                  className="w-4 h-4 cursor-pointer focus:ring-0 focus:outline-none accent-gray-600 disabled:accent-gray-400"
                />
                <span className="text-sm font-medium text-gray-700">Inactive</span>
              </label>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={!isEditing && !isCreateNew}
              rows="3"
              placeholder="Enter category description"
              className={`w-full px-3 py-2 text-sm border rounded-lg transition-all resize-none ${isEditing || isCreateNew
                ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
                : "border-gray-200 bg-gray-50 text-gray-500 "
                } outline-none placeholder:text-gray-300 `}
            />
          </div>

        </div>
      </div>

      {/* SUBCATEGORIES TABLE */}
      {!isCreateNew && categoryId && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Subcategories</h2>
            </div>
            <button
              onClick={handleCreateSubcategory}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 hover:scale-105 text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
            >
              <Plus size={16} />
              Create Subcategory
            </button>
          </div>

          {subcategoriesLoading ? (
            <SubCategoriesTableSkeleton />
          ) : subcategories.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No subcategories found</p>
              <p className="text-gray-400 text-xs mt-1">
                Click "Create Subcategory" to add one
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Slug
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcategories.map((subcategory) => (
                    <tr key={subcategory.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {subcategory.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                        {subcategory.code}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                        {subcategory.slug}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate">
                        {subcategory.description || "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${subcategory.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {subcategory.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(subcategory)}
                          className="inline-flex items-center gap-1 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-all hover:scale-105 cursor-pointer"
                        >
                          <SquarePen size={12} />
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

      {/* EDIT SUBCATEGORY POPUP */}
      {showDetailPopup && selectedSubcategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="sticky top-0 bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between rounded-t-lg">
              <div>
                <h3 className="text-base font-bold text-gray-900">Subcategory Details</h3>
                <p className="text-gray-600 text-xs">{selectedSubcategory.name}</p>
              </div>
              <button
                onClick={closePopups}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 space-y-3">
              {/* Parent Category Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-700 mb-0.5">Parent Category</p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedSubcategory.parent?.name || formData.name || "N/A"}
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={popupFormData.name}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditingPopup
                      ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-500 "
                      } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={popupFormData.title}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all ${isEditingPopup
                      ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-500 "
                      } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${popupFormData.status === "active"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white"
                        } ${!isEditingPopup ? "opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={popupFormData.status === "active"}
                        onChange={handlePopupInputChange}
                        disabled={!isEditingPopup}
                        className="hidden"
                      />

                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center
    border-green-600">
                        {popupFormData.status === "active" && (
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        )}
                      </div>

                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${popupFormData.status === "inactive"
                        ? "border-gray-500 bg-gray-50"
                        : "border-gray-200 bg-white"
                        } ${!isEditingPopup ? "opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={popupFormData.status === "inactive"}
                        onChange={handlePopupInputChange}
                        disabled={!isEditingPopup}
                        className="hidden"
                      />

                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center
                               border-gray-600">
                        {popupFormData.status === "inactive" && (
                          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        )}
                      </div>

                      <span className="text-sm font-medium text-gray-700">Inactive</span>
                    </label>

                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-800 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={popupFormData.description}
                    onChange={handlePopupInputChange}
                    disabled={!isEditingPopup}
                    rows="3"
                    className={`w-full px-3 py-2 text-sm border rounded-lg transition-all resize-none ${isEditingPopup
                      ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-500 "
                      } outline-none placeholder:text-gray-300`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditingPopup && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={closePopups}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePopupSubmit}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUBCATEGORY POPUP */}
      {showCreateSubcategoryPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="sticky top-0 bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between rounded-t-lg">
              <div>
                <h3 className="text-base font-bold text-gray-900">Create New Subcategory</h3>
                <p className="text-gray-600 text-xs">Fill in the details below</p>
              </div>
              <button
                onClick={closePopups}
                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 space-y-3">
              {/* Parent Category Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-700 mb-0.5">Parent Category</p>
                <p className="text-sm font-bold text-gray-900">{formData.name}</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Sub category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={popupFormData.name}
                    onChange={handlePopupInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white outline-none transition-all"
                    placeholder="Enter subcategory name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Sub category Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={popupFormData.title}
                    onChange={handlePopupInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white outline-none transition-all"
                    placeholder="Enter title"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* ACTIVE */}
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${popupFormData.status === "active"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={popupFormData.status === "active"}
                        onChange={handlePopupInputChange}
                        className="hidden"
                      />

                      <div className="w-4 h-4 rounded-full border-2 border-green-600 flex items-center justify-center">
                        {popupFormData.status === "active" && (
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        )}
                      </div>

                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>

                    {/* INACTIVE */}
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition-all ${popupFormData.status === "inactive"
                        ? "border-gray-500 bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={popupFormData.status === "inactive"}
                        onChange={handlePopupInputChange}
                        className="hidden"
                      />

                      <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex items-center justify-center">
                        {popupFormData.status === "inactive" && (
                          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        )}
                      </div>

                      <span className="text-sm font-medium text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={popupFormData.description}
                    onChange={handlePopupInputChange}
                    rows="3"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white outline-none transition-all resize-none"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={closePopups}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePopupSubmit}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Subcategory
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}