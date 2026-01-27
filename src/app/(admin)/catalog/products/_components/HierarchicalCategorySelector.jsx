import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Circle, X } from 'lucide-react';

const HierarchicalCategorySelector = ({ selectedCategoryId, onCategorySelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [createMode, setCreateMode] = useState(null); // 'parent' or 'child'
  const [selectedParentForChild, setSelectedParentForChild] = useState(null);
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

  const handleCategorySelect = (category, parent = null) => {
    setSelectedCategory(category);
    setSelectedParent(parent);
    onCategorySelect?.(category);
    setIsOpen(false);
  };

  const openCreatePopup = (mode, parentCategory = null) => {
    setCreateMode(mode);
    setSelectedParentForChild(parentCategory);
    setIsParentToggle(mode === 'parent');
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
        ...(!isParentToggle && selectedParentForChild ? { parent_id: selectedParentForChild.id } : {})
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`, {
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
        fetchRootCategories();
        // Reset expanded categories if needed
        if (!isParentToggle && selectedParentForChild) {
          const newExpanded = new Set(expandedCategories);
          newExpanded.delete(selectedParentForChild.id);
          setExpandedCategories(newExpanded);
        }
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getDisplayValue = () => {
    if (!selectedCategory) return 'Coffee';
    if (selectedParent) {
      return `${selectedParent.name} >> ${selectedCategory.name}`;
    }
    return selectedCategory.name;
  };

  const renderCategory = (category, level = 0, parent = null) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const filtered = searchQuery ? category.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    if (!filtered) return null;

    return (
      <div key={category.id}>
        <div 
          className="flex items-center hover:bg-gray-50 group relative"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* Vertical connecting line for children */}
          {level > 0 && (
            <div 
              className="absolute border-l border-gray-300"
              style={{ 
                left: `${(level - 1) * 20 + 18}px`,
                top: 0,
                height: '50%'
              }}
            />
          )}
          
          {/* Horizontal connecting line for children */}
          {level > 0 && (
            <div 
              className="absolute border-t border-gray-300"
              style={{ 
                left: `${(level - 1) * 20 + 18}px`,
                top: '50%',
                width: '12px'
              }}
            />
          )}

          {/* Expand/Collapse Icon */}
          <button
            onClick={(e) => toggleCategory(category, e)}
            className="p-1 hover:bg-gray-100 rounded mr-1 z-10 bg-white"
          >
            {hasChildren || (level === 0 && category.hasChildren) ? (
              <ChevronDown 
                className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
              />
            ) : (
              <div className="w-3 h-3" />
            )}
          </button>

          {/* Category Icon */}
          <Circle className={`w-3 h-3 mr-2 z-10 bg-white ${level === 0 ? 'fill-gray-300' : 'fill-none'} text-gray-400`} />

          {/* Category Name */}
          <button
            onClick={() => handleCategorySelect(category, parent)}
            className="flex-1 text-left py-1.5 text-sm text-gray-700 hover:text-blue-600"
          >
            {category.name}
          </button>
        </div>

        {/* Show "No subcategories" message when expanded but empty */}
        {isExpanded && !hasChildren && level === 0 && (
          <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="relative">
            <div 
              className="absolute border-l border-gray-300"
              style={{ 
                left: `${level * 20 + 18}px`,
                top: 0,
                bottom: 0
              }}
            />
            <div className="py-2 text-xs text-gray-500 italic">
              No subcategories.{' '}
              <button 
                onClick={() => openCreatePopup('child', category)}
                className="text-teal-600 hover:text-teal-700 underline"
              >
                Create subcategory
              </button>
            </div>
          </div>
        )}

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div className="relative">
            <div 
              className="absolute border-l border-gray-300"
              style={{ 
                left: `${level * 20 + 18}px`,
                top: 0,
                bottom: '12px'
              }}
            />
            {category.children.map(child => renderCategory(child, level + 1, category))}
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
            onClick={() => openCreatePopup('parent')}
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
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
                ) : (
                  <div>
                    <div className="px-2 py-1 flex items-center">
                      <Circle className="w-3 h-3 fill-gray-300 text-gray-400 mr-2" />
                      <span className="text-xs font-medium text-gray-500">ROOT</span>
                    </div>
                    {filteredCategories.map(cat => renderCategory(cat, 0))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={() => openCreatePopup('parent')}
                  className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors"
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
              <h3 className="text-lg font-semibold text-gray-900">
                Create Category
              </h3>
              <button
                onClick={() => setShowCreatePopup(false)}
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
                    setIsParentToggle(!isParentToggle);
                    if (!isParentToggle) {
                      setSelectedParentForChild(null);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isParentToggle ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isParentToggle ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Parent Category Dropdown (for subcategory) */}
              {!isParentToggle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category *
                  </label>
                  <select
                    value={selectedParentForChild?.id || ''}
                    onChange={(e) => {
                      const parent = categories.find(cat => cat.id === Number(e.target.value));
                      setSelectedParentForChild(parent);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select parent category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="e.g., All wood based products"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreatePopup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
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
          <span className="font-medium">Category created successfully!</span>
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