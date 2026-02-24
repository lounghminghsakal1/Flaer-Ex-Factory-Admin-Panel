"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Minus, X } from 'lucide-react';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';
import { toast } from 'react-toastify';

const HierarchicalCategorySelector = ({ selectedParentCategory, selectedSubCategory, onCategorySelect, disabled, required=false }) => {
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
  const dropdownRef = useRef(null);
  const subcategoryCache = useRef({});
  const categoryRefs = useRef({});

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

  const [isCreated, setIsCreated] = useState(false);

  useEffect(() => {
    fetchRootCategories();
  }, []);

  useEffect(() => {
    if (selectedParentCategory && selectedSubCategory && categories.length > 0) {
      setSelectedParent(selectedParentCategory);
      setSelectedCategory(selectedSubCategory);

      setExpandedCategories(prev =>
        new Set([...prev, selectedParentCategory.id])
      );

      // preload children of selected parent 
      fetchSubCategories(selectedParentCategory.id).then(children => {
        setCategories(prev =>
          prev.map(p =>
            p.id === selectedParentCategory.id
              ? { ...p, children }
              : p
          )
        );
      });
    }
  }, [selectedParentCategory, selectedSubCategory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      // Auto-scroll to selected parent/subcategory when dropdown opens
      if (selectedParent && categoryRefs.current[selectedParent.id]) {
        setTimeout(() => {
          categoryRefs.current[selectedParent.id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedParent]);

  const fetchRootCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`);
      const result = await response.json();
      const categoriesWithChildren = (result.data || []).map(cat => ({
        ...cat,
        children: [],
        hasChildren: true
      }));
      setCategories(categoriesWithChildren);
    } catch (error) {
      console.error('Error fetching root categories:', error);
      toast.error("Error fetching root categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (parentId) => {
    if (!parentId) return [];

    if (subcategoryCache.current[parentId]) {
      return subcategoryCache.current[parentId];
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${parentId}&only_names=true`
      );

      const result = await response.json();

      const children = (result.data || []).map(cat => ({
        ...cat,
        children: [],
        hasChildren: false
      }));

      subcategoryCache.current[parentId] = children;

      return children;

    } catch(err) {
      console.log(err);
      toast.error("Failed to fetch sub categories");
      return [];
    }
  };

  const toggleCategory = async (category, event) => {
    event.stopPropagation();

    if (expandedCategories.has(category.id)) {
      // Collapse
      const newExpanded = new Set(expandedCategories);
      newExpanded.delete(category.id);
      setExpandedCategories(newExpanded);
    } else {
      // Expand
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(category.id);
      setExpandedCategories(newExpanded);

      // Load children if not already loaded
      if (category.children?.length === 0) {
        const children = await fetchSubCategories(category.id);
        setCategories(prev => prev.map(cat =>
          cat.id === category.id ? { ...cat, children } : cat
        ));
      }

      // Auto-scroll to this category
      setTimeout(() => {
        categoryRefs.current[category.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 100);
    }
  };

  const handleParentClick = async (category, event) => {
    event.stopPropagation();
    await toggleCategory(category, event);
  };

  const handleSubcategorySelect = (child, parent) => {
    setSelectedCategory(child);
    setSelectedParent(parent);
    onCategorySelect?.(child, parent);
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

      // if (isParentToggle && !formData.parent_id) {
      //   toast.error("Please select a parent category");
      //   return;
      // }

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

        const parentId = lockedParentForChild?.id || formData.parent_id;

        setShowCreatePopup(false);
        toast.success("Category created successfully");

        setCategories(prev => {
          // Parent category creation
          if (isParentToggle) {
            return [
              ...prev,
              { ...newCategory, children: [], hasChildren: true }
            ];
          }

          // Subcategory creation
          return prev.map(cat => {
            if (cat.id === parentId) {
              return {
                ...cat,
                children: [...(cat.children || []), newCategory]
              };
            }
            return cat;
          });
        });

        if (!isParentToggle && parentId) {
          subcategoryCache.current[parentId] = [
            ...(subcategoryCache.current[parentId] || []),
            newCategory
          ];
        }

        // For parent category: expand it to show empty subcategory section
        if (isParentToggle) {
          setExpandedCategories(prev => new Set([...prev, newCategory.id]));

          setSelectedCategory(null);
          setSelectedParent(null);

          // Reopen dropdown and scroll to new parent
          setTimeout(() => {
            setIsOpen(true);
            setTimeout(() => {
              categoryRefs.current[newCategory.id]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              });
            }, 100);
          }, 100);
        } else {
          // For subcategory: expand parent and select the subcategory
          setExpandedCategories(prev => new Set([...prev, parentId]));

          const parent = categories.find(c => c.id === parentId) || lockedParentForChild;
          setSelectedCategory(newCategory);
          setSelectedParent(parent);
          onCategorySelect?.(newCategory, parent);

          // Reopen dropdown and scroll to parent
          setTimeout(() => {
            setIsOpen(true);
            setTimeout(() => {
              categoryRefs.current[parentId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              });
            }, 100);
          }, 100);
        }

        setLockedParentForChild(null);
      }
      setIsCreated(true);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error("Error creating category");
    }
  };

  const getDisplayValue = () => {
    if (!selectedCategory) return 'Select a category';
    if (selectedParent) {
      return `${selectedParent.name} >> ${selectedCategory.name}`;
    }
    return selectedCategory.name;
  };

  const isChildSelected = (childId, parentId) => {
    return selectedCategory?.id === childId && selectedParent?.id === parentId;
  };

  const renderCategory = (category) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children?.length > 0;
    const filtered = searchQuery ? category.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;

    if (!filtered) return null;

    return (
      <div
        key={category.id}
        className="border-b border-gray-100 last:border-b-0"
        ref={el => categoryRefs.current[category.id] = el}
      >
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

          {/* Parent Category Name - Clickable to expand */}
          <div
            onClick={(e) => handleParentClick(category, e)}
            className="flex-1 py-3 pr-3 text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          >
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
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-secondary"
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
                    className="flex items-center text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium cursor-pointer"
                  >
                    <Plus size={16} /> Create subcategory
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
                  className="flex items-center text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium cursor-pointer"
                >
                  <Plus size={16} /> Create subcategory
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
            Category {required && (<span className='text-red-500'>*</span>)}
          </label>
          <button
            type="button"
            onClick={() => openCreatePopup('general')}
            disabled={disabled}
            className={`flex items-center text-sm text-primary hover:text-primary/80 hover:underline font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
          >
            <Plus size={16} /> Create Category
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">Choose a subcategory</p>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 transition-colors text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
                {getDisplayValue()}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
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
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium cursor-pointer"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Create Category
              </h3>
              <button
                onClick={() => {
                  setShowCreatePopup(false);
                  setLockedParentForChild(null);
                }}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {/* Is Parent Toggle */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Is Parent Category</span>
                <button
                  onClick={() => {
                    if (!lockedParentForChild) {
                      setIsParentToggle(!isParentToggle);
                    }
                  }}
                  disabled={!!lockedParentForChild}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-2 ${lockedParentForChild
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isParentToggle
                      ? 'bg-primary hover:bg-primary/90 cursor-pointer'
                      : 'bg-gray-300 hover:bg-gray-500 cursor-pointer'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isParentToggle ? 'translate-x-6' : 'translate-x-1'
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
                  {isParentToggle ? 'Parent Category Name' : 'Subcategory Name'} <span className='text-red-500'>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
                  placeholder="e.g., Wood"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className='text-red-500'>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
                  placeholder="e.g., Wood Products"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all hover:border-gray-400 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-4 h-4 cursor-pointer accent-green-600 focus:ring-green-500"
                    />
                    <span className={`text-sm font-medium ${formData.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                      Active
                    </span>
                  </label>

                  <label className="flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all hover:border-gray-400 has-[:checked]:border-gray-500 has-[:checked]:bg-gray-50">
                    <input
                      type="radio"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-4 h-4 cursor-pointer accent-gray-600 focus:ring-gray-500"
                    />
                    <span className={`text-sm font-medium ${formData.status === 'inactive' ? 'text-gray-700' : 'text-gray-700'}`}>
                      Inactive
                    </span>
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 resize-none"
                  placeholder="e.g., All wood based products"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowCreatePopup(false);
                    setLockedParentForChild(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!formData.name || !formData.title || (!isParentToggle && !lockedParentForChild && !formData.parent_id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {!isParentToggle ? 'Create Subcategory' : 'Create Category'}
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

export default HierarchicalCategorySelector;