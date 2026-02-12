import React, { useState, useEffect } from 'react';
import { X, Package, Search } from 'lucide-react';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';
import { toast } from 'react-toastify';

const ProductCard = ({ product, isSelected, onToggle }) => {
  const handleImageClick = (e) => {
    e.stopPropagation();
    //image preview functionality
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
          className={`shrink-0 ${product?.media ? 'cursor-pointer' : ''}`}
          onClick={handleImageClick}
        >
          {product?.media ? (
            <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group/image">
              <img
                src={product.media}
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
          {product?.mrp && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600 font-medium">MRP:</span>
                <span className="text-sm font-bold text-green-700">
                  ₹{parseFloat(product.mrp)}
                </span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-600 font-medium">Selling:</span>
                <span className="text-sm font-bold text-blue-700">
                  ₹{parseFloat(product.selling_price)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RightModalPanelCreate({ onClose, productsList, setProductsList, collectionId = null, existingProducts = [], setCollectionData = null }) {
  const [filterType, setFilterType] = useState(null);
  const [filterTypeOptions, setFilterTypeOptions] = useState([
    { id: 1, name: 'Brand' },
    { id: 2, name: "Category" },
    { id: 3, name: "Product Name" }
  ]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [productNameSearch, setProductNameSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMappingProducts, setIsMappingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(1);

  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  useEffect(() => {
    if (filterType === 1) {
      fetchBrandOptions();
      // Clear category selections and search
      setSelectedParentCategory(null);
      setSelectedSubCategory(null);
      setProductNameSearch('');
    } else if (filterType === 2) { // 2 = Category
      // Clear brand selection and search
      setSelectedBrand(null);
      setProductNameSearch('');
      // Fetch parent categories
      fetchParentCategoriesOptions();
    } else if (filterType === 3) { // 3 = Product Name
      // Clear brand and category selections
      setSelectedBrand(null);
      setSelectedParentCategory(null);
      setSelectedSubCategory(null);
      setProductNameSearch('');
    }
    // Clear products when filter type changes
    setProducts([]);
    setSelectedProducts([]);
    setCurrentPage(1);
  }, [filterType]);

  // Use effect to handle product fetching for brand and category
  useEffect(() => {
    const shouldFetchProducts =
      (filterType === 1 && selectedBrand) || // Brand selected
      (filterType === 2 && selectedParentCategory); // Parent category selected

    if (shouldFetchProducts) {
      if (filterType === 1) {
        fetchProducts(selectedBrand, currentPage);
      } else if (filterType === 2) {
        if (selectedSubCategory) {
          fetchProductsBySubCategory(selectedSubCategory, currentPage);
        } else {
          fetchProductsByParentCategory(selectedParentCategory, currentPage);
        }
      }
    } else {
      // Clear products if conditions not met
      if (filterType !== 3) {
        setProducts([]);
        setSelectedProducts([]);
      }
    }
  }, [selectedBrand, selectedParentCategory, selectedSubCategory, filterType, currentPage]);

  useEffect(() => {
    if (selectedParentCategory) {
      fetchSubCategoriesOptionsOfAParent(selectedParentCategory);
    } else {
      setSubCategoryOptions([]);
      setSelectedSubCategory(null);
    }
  }, [selectedParentCategory]);

  const getRemainingProducts = (allProducts, productsList) => {
    const existingIds = new Set(productsList.map(product => product.id));
    const remainingProducts = allProducts.filter(product => !existingIds.has(product.id));
    return remainingProducts;
  };

  async function fetchBrandOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands?only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch brands list");
      const result = await response.json();
      const namesArray = result.data;
      setBrandOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands list");
    }
  }

  async function fetchParentCategoriesOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch categories list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setParentCategoryOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch categories list");
    }
  }

  async function fetchSubCategoriesOptionsOfAParent(parentId) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${parentId}&only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch sub-categories list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setSubCategoryOptions(namesArray);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch sub-categories list");
    }
  }

  async function fetchProducts(brandId, page = 1) {
    setIsLoading(true);
    try {
      const url = collectionId ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?collection_id=${collectionId}&brand_id=${brandId}&page=${page}` : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?brand_id=${brandId}&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      const remainingProducts = getRemainingProducts(result.data, productsList);
      setProducts(remainingProducts);
      setTotalPages(result.meta.total_pages || 1);
      setTotalProducts(result.meta.total_data_count || 0);
      setSelectedProducts([]);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductsByParentCategory(parentCategoryId, page = 1) {
    setIsLoading(true);
    try {
      const url = collectionId ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?collection_id=${collectionId}&parent_category_id=${parentCategoryId}&page=${page}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?parent_category_id=${parentCategoryId}&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      setProducts(result.data || []);
      setTotalPages(result.meta.total_pages || 1);
      setTotalProducts(result.meta.total_data_count || 0);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error fetching products by parent category:', error);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductsBySubCategory(subCategoryId, page = 1) {
    setIsLoading(true);
    try {
      const url = collectionId ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?collection_id=${collectionId}&sub_category_id=${subCategoryId}&page=${page}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?sub_category_id=${subCategoryId}&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      setProducts(result.data || []);
      setTotalPages(result.meta.total_pages || 1);
      setTotalProducts(result.meta.total_data_count || 0);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductsByName(page = 1) {
    if (!productNameSearch.trim()) {
      toast.error("Please enter a product name to search");
      return;
    }

    setIsLoading(true);
    try {
      const url = collectionId ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?collection_id=${collectionId}&starts_with=${productNameSearch}&page=${page}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?starts_with=${productNameSearch}&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      setProducts(result.data || []);
      setTotalPages(result.meta.total_pages || 1);
      setTotalProducts(result.meta.total_data_count || 0);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error fetching products by name:', error);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

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

  const handleMapProducts = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setIsMappingProducts(true);
    try {
      // Get the selected product objects
      const selectedProductObjects = products.filter(product =>
        selectedProducts.includes(product.id)
      );

      // Get existing product IDs
      const existingProductIds = productsList.map(p => p.id);

      // Filter out products that are already in the list
      const newProducts = selectedProductObjects.filter(
        product => !existingProductIds.includes(product.id)
      );

      // Count how many were duplicates
      const duplicateCount = selectedProductObjects.length - newProducts.length;

      if (newProducts.length === 0) {
        toast.warning("All selected products are already added!");
        setIsMappingProducts(false);
        return;
      }

      // Append only new products to existing productsList
      const updatedProductsList = [...productsList, ...newProducts];
      setProductsList(updatedProductsList);

      // Show appropriate success message
      if (duplicateCount > 0) {
        toast.success(
          `${newProducts.length} product(s) added successfully! ${duplicateCount} duplicate(s) skipped.`
        );
      } else {
        toast.success("Product(s) added successfully!");
      }

    } catch (err) {
      console.log(err);
      toast.error("Failed to add products");
    } finally {
      setIsMappingProducts(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedProducts([]); // Clear selections when changing page

    // Re-fetch based on current filter
    if (filterType === 1 && selectedBrand) {
      fetchProducts(selectedBrand, page);
    } else if (filterType === 2) {
      if (selectedSubCategory) {
        fetchProductsBySubCategory(selectedSubCategory, page);
      } else if (selectedParentCategory) {
        fetchProductsByParentCategory(selectedParentCategory, page);
      }
    } else if (filterType === 3 && productNameSearch.trim()) {
      fetchProductsByName(page);
    }
  };

  const handleProductNameSearch = () => {
    setCurrentPage(1);
    fetchProductsByName(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleProductNameSearch();
    }
  };

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
    else if (!isLoading && products.length === 0) {
      emptyStateMessage = "No Products Found";
    }
  }
  else if (filterType === 3) { // Product Name
    if (!isLoading && products.length === 0) {
      emptyStateMessage = "Enter product name and click search";
    }
  }

  const handleMapProductsToBackend = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const newIndex = existingProducts[existingProducts.length-1]?.sequence || 0;

    setIsMappingProducts(true);
    try {
      const payload = {
        collection_items: {
          items: selectedProducts.map((productId, index) => ({
            product_id: productId,
            sequence: newIndex + index + 1,
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
      toast.success("Product(s) mapped successfully!");
      refreshProductsList();

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
          <h2 className="text-xl font-bold text-gray-900">Add Products</h2>
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
                    setCurrentPage(1);
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
                    onChange={(value) => {
                      setSelectedBrand(value);
                      setCurrentPage(1);
                    }}
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
                      onChange={(value) => {
                        setSelectedParentCategory(value);
                        setSelectedSubCategory(null);
                        setCurrentPage(1);
                      }}
                      searchPlaceholder="Search categories..."
                    />
                  </div>
                  <div className="flex-1">
                    <SearchableDropdown
                      label="Sub Category (Optional)"
                      placeholder="Choose sub category"
                      options={subCategoryOptions}
                      value={selectedSubCategory}
                      onChange={(value) => {
                        setSelectedSubCategory(value);
                        setCurrentPage(1);
                      }}
                      searchPlaceholder="Search sub categories..."
                    />
                  </div>
                </>
              )}

              {/* Product Name Search - Only show when filter type is 'product name' (id: 3) */}
              {filterType === 3 && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search by Product Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={productNameSearch}
                      onChange={(e) => setProductNameSearch(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      placeholder="Enter product name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleProductNameSearch}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Search size={18} />
                      Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Section */}
          {products.length > 0 && (
            <div>
              {/* Select All */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Products ({totalProducts})
                </h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Products List */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.includes(product.id)}
                    onToggle={() => handleToggleProduct(product.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-end items-center gap-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    title="First page"
                  >
                    &lt;&lt;
                  </button>

                  {/* Previous Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    title="Previous page"
                  >
                    &lt;
                  </button>

                  {/* Page Numbers (showing 3 at a time) */}
                  {(() => {
                    let startPage = Math.max(1, currentPage - 1);
                    let endPage = Math.min(totalPages, startPage + 2);

                    // Adjust if we're near the end
                    if (endPage - startPage < 2) {
                      startPage = Math.max(1, endPage - 2);
                    }

                    return Array.from(
                      { length: endPage - startPage + 1 },
                      (_, i) => startPage + i
                    ).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}

                  {/* Next Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    title="Next page"
                  >
                    &gt;
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    title="Last page"
                  >
                    &gt;&gt;
                  </button>
                </div>
              )}
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
                onClick={collectionId ? handleMapProductsToBackend : handleMapProducts}
                disabled={selectedProducts.length === 0 || isMappingProducts}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isMappingProducts ? 'Adding...' : 'Add Products'}
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