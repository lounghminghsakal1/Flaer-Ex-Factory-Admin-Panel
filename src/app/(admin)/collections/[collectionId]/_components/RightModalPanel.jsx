import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';
import { toast } from 'react-toastify';

const ProductCard = ({ product, isSelected, onToggle }) => {
  const handleImageClick = (e) => {
    e.stopPropagation();
    // Optional: Add image preview functionality here
  };

  return (
    <div
      onClick={onToggle}
      className={`group w-92 relative bg-white rounded-lg border p-2 transition-all duration-300 cursor-pointer ${isSelected
        ? 'border-blue-400 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:shadow-md hover:border-blue-200'
        }`}
    >
      {/* Horizontal Layout */}
      <div className="flex gap-1.5">
        {/* Checkbox - Left Side */}
        <div className="shrink-0 flex items-start pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Image Section */}
        <div
          className={`shrink-0 ${product?.master_sku_media ? 'cursor-pointer' : ''}`}
          onClick={handleImageClick}
        >
          {product?.master_sku_media ? (
            <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group/image">
              <img
                src={product.master_sku_media}
                alt={product?.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
              <Package size={20} className="text-gray-400 mb-0.5" />
              <p className="text-xs font-medium text-gray-500">No Media</p>
            </div>
          )}
        </div>

        {/* Content Section - Middle */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
            {product?.name}
          </h3>

          {/* Product Code */}
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs text-gray-600 font-mono">
              {product?.code}
            </p>
          </div>

          {/* Pricing */}
          {product?.master_sku && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600 font-medium">MRP:</span>
                <span className="text-sm font-bold text-green-700">
                  ₹{parseFloat(product.master_sku.mrp)}
                </span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-600 font-medium">Selling:</span>
                <span className="text-sm font-bold text-blue-700">
                  ₹{parseFloat(product.master_sku.selling_price)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RightModalPanel({ onClose, collectionId, setCollectionData }) {
  const [filterType, setFilterType] = useState(null);
  const [filterTypeOptions, setFilterTypeOptions] = useState([{ id: 1, name: 'Brand' }, { id: 2, name: "Category" }]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMappingProducts, setIsMappingProducts] = useState(false);

  // Temporary category options 
  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  useEffect(() => {
    if (filterType === 1) {
      fetchBrandOptions();
      // Clear category selections
      setSelectedParentCategory(null);
      setSelectedSubCategory(null);
    } else if (filterType === 2) { // 2 = Category
      // Clear brand selection
      setSelectedBrand(null);
      // Optionally fetch parent categories here if needed
      fetchParentCategoriesOptions();
    }
    // Clear products when filter type changes
    setProducts([]);
    setSelectedProducts([]);
  }, [filterType]);

  // Single effect to handle product fetching for both brand and category
  useEffect(() => {
    const shouldFetchProducts =
      (filterType === 1 && selectedBrand) || // Brand selected
      (filterType === 2 && selectedSubCategory); // Subcategory selected

    if (shouldFetchProducts) {
      if (filterType === 1) {
        fetchProducts(selectedBrand);
      } else if (filterType === 2) {
        fetchProductsByCategory(selectedParentCategory, selectedSubCategory);
      }
    } else {
      // Clear products if conditions not met
      setProducts([]);
      setSelectedProducts([]);
    }
  }, [selectedBrand, selectedSubCategory, filterType]);

  useEffect(() => {
    if (selectedParentCategory) {
      fetchSubCategoriesOptionsOfAParent(selectedParentCategory);
    }
  }, [selectedParentCategory]);

  async function fetchBrandOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands?only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch brands list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setBrandOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands list");
    }
  }

  async function fetchParentCategoriesOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch brands list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setParentCategoryOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands list");
    }
  }

  async function fetchSubCategoriesOptionsOfAParent(parentId) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${parentId}&only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch brands list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setSubCategoryOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands list");
    }
  }

  async function fetchProducts(brandId) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}/filter_products?brand_id=${brandId}`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      setProducts(result.data || []);
      setSelectedProducts([]);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductsByCategory(parentCategoryId, subCategoryId) {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}/filter_products?category_id=${subCategoryId}`);
      const result = await response.json();
      setProducts(result.data || []);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleMapProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setIsMappingProducts(true);
    try {
      const payload = {
        collection_items: {
          items: selectedProducts.map((productId, index) => ({
            product_id: productId,
            sequence: index + 1,
            active: true
          }))
        }
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}/collection_item_mapping`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error("Failed to map products");

      const result = await response.json();
      toast.success("Products mapped successfully!");
      refreshProductsList();
      onClose();
    } catch (err) {
      console.log(err);
      toast.error("Failed to map products");
    } finally {
      setIsMappingProducts(false);
    }
  };

  async function refreshProductsList() {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setCollectionData(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  let emptyStateMessage = null;

  if (!filterType) {
    emptyStateMessage = "Select Filter Type";
  }

  else if (filterType === 1) { // Brand
    if (!selectedBrand) {
      emptyStateMessage = "Select Brand";
    }
    else if (!isLoading && products.length === 0) {
      emptyStateMessage = "No Products Found";
    }
  }

  else if (filterType === 2) { // Category
    if (!selectedParentCategory) {
      emptyStateMessage = "Select Parent Category";
    }
    else if (!selectedSubCategory) {
      emptyStateMessage = "Select Sub Category";
    }
    else if (!isLoading && products.length === 0) {
      emptyStateMessage = "No Products Found";
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
      <div
        className="w-[50vw] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right"
        style={{
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Mapping Products</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {/* All Filters in One Row */}
          <div className="mb-6">
            <div className="flex gap-4 items-end">
              {/* Filter Type Dropdown */}
              <div className="w-64">
                <SearchableDropdown
                  label="Filter Type"
                  placeholder="Choose a type"
                  options={filterTypeOptions}
                  value={filterType}
                  onChange={(value) => {
                    setFilterType(value);
                    setProducts([]);
                    setSelectedProducts([]);
                  }}
                  searchPlaceholder="Search type..."
                />
              </div>

              {/* Brand Dropdown - Only show when filter type is 'brand' (id: 1) */}
              {filterType === 1 && (
                <div className="w-64">
                  <SearchableDropdown
                    label="Select Brand"
                    placeholder="Choose a brand"
                    options={brandOptions}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    searchPlaceholder="Search brands..."
                  />
                </div>
              )}

              {/* Category Dropdowns - Only show when filter type is 'category' (id: 2) */}
              {filterType === 2 && (
                <>
                  <div className="flex-1">
                    <SearchableDropdown
                      label="Parent Category"
                      placeholder="Choose parent category"
                      options={parentCategoryOptions}
                      value={selectedParentCategory}
                      onChange={setSelectedParentCategory}
                      searchPlaceholder="Search categories..."
                    />
                  </div>
                  <div className="flex-1">
                    <SearchableDropdown
                      label="Sub Category"
                      placeholder="Choose sub category"
                      options={subCategoryOptions}
                      value={selectedSubCategory}
                      onChange={setSelectedSubCategory}
                      searchPlaceholder="Search sub categories..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Products Section */}
          {products.length > 0 && (
            <div>
              {/* Select All */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Products ({products.length})
                </h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Products List */}
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.includes(product.id)}
                    onToggle={() => handleToggleProduct(product.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && emptyStateMessage && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package size={48} className="mb-3 text-gray-400" />
              <p className="text-sm font-medium">{emptyStateMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleMapProducts}
                disabled={selectedProducts.length === 0 || isMappingProducts}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isMappingProducts ? 'Mapping...' : 'Map Products'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}