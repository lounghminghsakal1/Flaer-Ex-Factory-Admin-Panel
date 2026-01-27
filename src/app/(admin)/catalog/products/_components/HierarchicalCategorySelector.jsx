"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Minus, X } from 'lucide-react';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';

const HierarchicalCategorySelector = ({ selectedCategoryId, onCategorySelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [lockedParentForChild, setLockedParentForChild] = useState(null);
  const [isParentToggle, setIsParentToggle] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    status: 'active',
    priority: 1,
    meta: {
      type: '',
      seo: ''
    }
  });

  useEffect(() => {
    fetchRootCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-expand selected parent category when dropdown opens
      if (selectedParent && !expandedCategories.has(selectedParent.id)) {
        const newExpanded = new Set(expandedCategories);
        newExpanded.add(selectedParent.id);
        setExpandedCategories(newExpanded);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchRootCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?only_names=true`);
      const result = await response.json();
      const categoriesWithChildren = (result.data || []).map(cat => ({
        ...cat,
        children: [],
        hasChildren: true
      }));
      setCategories(categoriesWithChildren);
    } catch (error) {
      console.error('Error fetching root categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (parentId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${parentId}&only_names=true`);
      const result = await response.json();
      return (result.data || []).map(cat => ({
        ...cat,
        children: [],
        hasChildren: false
      }));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  };

  const toggleCategory = async (category, event) => {
    event.stopPropagation();
    
    if (expandedCategories.has(category.id)) {
      const newExpanded = new Set(expandedCategories);
      newExpanded.delete(category.id);
      setExpandedCategories(newExpanded);
    } else {
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(category.id);
      setExpandedCategories(newExpanded);
      
      const updateChildren = async (cats) => {
        for (let cat of cats) {
          if (cat.id === category.id && cat.children.length === 0) {
            cat.children = await fetchSubCategories(category.id);
            setCategories([...categories]);
            return true;
          }
          if (cat.children.length > 0) {
            if (await updateChildren(cat.children)) return true;
          }
        }
        return false;
      };
      
      await updateChildren(categories);
    }
  };

  const handleSubcategorySelect = (child, parent) => {
    setSelectedCategory(child);
    setSelectedParent(parent);
    onCategorySelect?.(child);
    setIsOpen(false);
  };

  const openCreatePopup = (mode = 'general', parentCategory = null) => {
    if (mode === 'child') {
      // Creating subcategory from link under parent
      setLockedParentForChild(parentCategory);
      setIsParentToggle(false);
    } else {
      // General create button
      setLockedParentForChild(null);
      setIsParentToggle(true);
    }
    
    setFormData({
      name: '',
      title: '',
      description: '',
      status: 'active',
      priority: 1,
      meta: {
        type: '',
        seo: ''
      }
    });
    setShowCreatePopup(true);
    setIsOpen(false);
  };

  const handleCreateCategory = async () => {
    try {
      const body = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        title: formData.title,
        priority: formData.priority,
        meta: formData.meta,
        ...(!isParentToggle && lockedParentForChild ? { parent_id: lockedParentForChild.id } : {}),
        ...(!isParentToggle && !lockedParentForChild && formData.parent_id ? { parent_id: formData.parent_id } : {})
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        const newCategory = result.data;
        
        setShowCreatePopup(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Refresh categories
        await fetchRootCategories();
        
        // If it's a subcategory, expand its parent and auto-select the new subcategory
        if (!isParentToggle && (lockedParentForChild || formData.parent_id)) {
          const parentId = lockedParentForChild?.id || formData.parent_id;
          const parent = categories.find(c => c.id === parentId) || lockedParentForChild;
          
          const newExpanded = new Set(expandedCategories);
          newExpanded.add(parentId);
          setExpandedCategories(newExpanded);
          
          // Auto-select the newly created subcategory
          setSelectedCategory(newCategory);
          setSelectedParent(parent);
          onCategorySelect?.(newCategory);
        } else {
          // Auto-select the newly created parent category
          setSelectedCategory(newCategory);
          setSelectedParent(null);
          onCategorySelect?.(newCategory);
        }
        
        setLockedParentForChild(null);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getDisplayValue = () => {
    if (!selectedCategory) return 'Select a category';
    if (selectedParent) {
      return `${selectedParent.name} >> ${selectedCategory.name}`;
    }
    return selectedCategory.name;
  };

  const isParentSelected = (categoryId) => {
    return selectedCategory?.id === categoryId && !selectedParent;
  };

  const isChildSelected = (childId, parentId) => {
    return selectedCategory?.id === childId && selectedParent?.id === parentId;
  };

  const renderCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const filtered = searchQuery ? category.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const parentSelected = isParentSelected(category.id);
    
    if (!filtered) return null;

    return (
      <div key={category.id} className="border-b border-gray-100 last:border-b-0">
        {/* Parent Category Row */}
        <div className="flex items-center hover:bg-gray-50 transition-colors">
          {/* Expand/Collapse Button with Plus/Minus */}
          <button
            onClick={(e) => toggleCategory(category, e)}
            className="p-3 hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? (
              <Minus className="w-4 h-4 text-gray-600" />
            ) : (
              <Plus className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Parent Category Name (No radio button) */}
          <div className={`flex-1 py-3 pr-3 text-sm font-medium ${parentSelected ? 'text-blue-600' : 'text-gray-900'}`}>
            {category.name}
          </div>
        </div>

        {/* Subcategories Section */}
        {isExpanded && (
          <div className="bg-gray-50 border-t border-gray-200">
            {hasChildren ? (
              <div className="py-1.5">
                {category.children.map(child => {
                  const childSelected = isChildSelected(child.id, category.id);
                  return (
                    <label
                      key={child.id}
                      className="flex items-center px-10 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={childSelected}
                        onChange={() => handleSubcategorySelect(child, category)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className={`ml-3 text-sm ${childSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                        {child.name}
                      </span>
                    </label>
                  );
                })}
                <div className="px-10 py-2 mt-0.5">
                  <button
                    onClick={() => openCreatePopup('child', category)}
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium"
                  >
                    + Create subcategory
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-10 py-2.5">
                <p className="text-sm text-gray-500 italic mb-2">
                  No subcategories yet.
                </p>
                <button
                  onClick={() => openCreatePopup('child', category)}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium"
                >
                  + Create subcategory
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = categories.filter(cat => 
    searchQuery ? cat.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <button
            type="button"
            onClick={() => openCreatePopup('general')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Create Category
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">Choose a category for your product.</p>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          >
            <div className="flex items-center justify-between">
              <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                {getDisplayValue()}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
                ) : (
                  <div>
                    {filteredCategories.map(cat => renderCategory(cat))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={() => openCreatePopup('general')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Popup */}
      {showCreatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Create Category
              </h3>
              <button
                onClick={() => {
                  setShowCreatePopup(false);
                  setLockedParentForChild(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Is Parent Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Is Parent Category</span>
                <button
                  onClick={() => {
                    if (!lockedParentForChild) {
                      setIsParentToggle(!isParentToggle);
                    }
                  }}
                  disabled={!!lockedParentForChild}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    lockedParentForChild 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : isParentToggle 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isParentToggle ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Parent Category Dropdown (when not parent and locked) */}
              {lockedParentForChild ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                    {lockedParentForChild.name}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Parent category is locked for this subcategory</p>
                </div>
              ) : !isParentToggle && (
                <SearchableDropdown
                  label="Parent Category"
                  required
                  options={categories}
                  value={formData.parent_id}
                  onChange={(value) => setFormData({ ...formData, parent_id: value })}
                  placeholder="Select parent category"
                  searchPlaceholder="Search parent categories..."
                  emptyMessage="No parent categories found"
                />
              )}

              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isParentToggle ? 'Parent Category Name' : 'Subcategory Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Wood"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Wood Products"
                />
              </div>

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
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="e.g., All wood based products"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreatePopup(false);
                    setLockedParentForChild(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!formData.name || !formData.title || (!isParentToggle && !lockedParentForChild && !formData.parent_id)}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create Category
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
          <span className="text-sm font-medium">Category created successfully!</span>
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

export default HierarchicalCategorySelector;