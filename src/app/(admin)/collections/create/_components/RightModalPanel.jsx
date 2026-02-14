import React, { useState, useEffect } from 'react';
import { X, Package, Search } from 'lucide-react';
import SearchableDropdown from '../../../../../../components/shared/SearchableDropdown';
import { toast } from 'react-toastify';

const ProductCard = ({ product, isSelected, onToggle, isAlreadyAdded }) => {
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleImageClick = (e) => {
    e.stopPropagation();
    setShowImagePreview(true);
  };

  return (
    <div
      onClick={!isAlreadyAdded ? onToggle : undefined}
      className={`group w-full relative bg-white rounded-lg border p-2 transition-all duration-300 cursor-pointer ${isSelected
        ? 'border-blue-400 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:shadow-md hover:border-blue-200'
        }  ${isAlreadyAdded ? 'opacity-50' : ''} `}
    >
      {/* Horizontal Layout */}
      <div className="flex gap-1.5">
        {/* Checkbox - Left Side */}
        <div className="shrink-0 flex items-start pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            disabled={isAlreadyAdded}
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
            {isAlreadyAdded && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                Already Added
              </span>
            )}
          </div>

          {/* Pricing */}
          {product?.mrp && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600 font-medium">Selling:</span>
                <span className="text-sm font-bold text-green-700">
                  ₹{parseFloat(product.selling_price)}
                </span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-600 font-medium">MRP:</span>
                <span className="text-sm font-bold text-blue-700">
                  ₹{parseFloat(product.mrp)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Image Preview Popup */}
        <ImagePreviewPopup
          imageUrl={product?.media}
          productName={product?.name}
          showPopup={showImagePreview}
          setShowPopup={setShowImagePreview}
        />
      </div>
    </div>
  );
};

const ImagePreviewPopup = ({ imageUrl, productName, showPopup, setShowPopup }) => {
  if (!showPopup) return null;

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors z-10 cursor-pointer"
        >
          <X size={24} className="text-gray-700" />
        </button>

        {/* Image */}
        <div className="p-6">
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Image Name */}
        <div className="px-6 pb-6">
          <p className="text-center text-sm font-medium text-gray-700">{productName}</p>
        </div>
      </div>
    </div>
  );
};

export default function RightModalPanelCreate({ onClose, productsList, setProductsList, collectionId = null, existingProducts = [], setCollectionData = null }) {
  const [filterType, setFilterType] = useState(null);
  const [filterTypeOptions] = useState([
    { id: 1, name: 'Brand' },
    { id: 2, name: "Category" },
  ]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMappingProducts, setIsMappingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  const existingProductIds = new Set(productsList.map(p => p.id));
  const isProductAlreadyAdded = (productId) => {
    return existingProductIds.has(productId);
  };

  // Fetch options when filter type changes
  useEffect(() => {
    if (filterType === 1) {
      fetchBrandOptions();
    } else if (filterType === 2) {
      fetchParentCategoriesOptions();
    }
  }, [filterType]);

  // Fetch subcategories when parent category changes
  useEffect(() => {
    if (selectedParentCategory) {
      fetchSubCategoriesOptionsOfAParent(selectedParentCategory);
    } else {
      setSubCategoryOptions([]);
      setSelectedSubCategory(null);
    }
  }, [selectedParentCategory]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  },[selectedBrand, selectedParentCategory, selectedSubCategory]);

  useEffect(() => {
    if (searchText === "") {
      fetchProducts(1);
    }
  },[searchText])

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

  async function fetchProducts(page = 1) {
    setIsLoading(true);
    try {
      // Build URL with all active filters
      let url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?page=${page}`;
      
      if (collectionId) {
        url += `&collection_id=${collectionId}`;
      }
      
      if (searchText.trim()) {
        url += `&starts_with=${encodeURIComponent(searchText.trim())}`;
      }
      
      if (filterType === 1 && selectedBrand) {
        url += `&brand_id=${selectedBrand}`;
      } else if (filterType === 2) {
        if (selectedSubCategory) {
          url += `&sub_category_id=${selectedSubCategory}`;
        } else if (selectedParentCategory) {
          url += `&parent_category_id=${selectedParentCategory}`;
        }
      }

      if (!selectedBrand && !selectedParentCategory && !searchText) return;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const result = await response.json();
      setProducts(result.data);
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

  const handleToggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    const selectableProducts = products.filter(
      p => !existingProductIds.has(p.id)
    );

    const selectableIds = selectableProducts.map(p => p.id);

    const allSelectableSelected = selectableIds.length > 0 && 
      selectableIds.every(id => selectedProducts.includes(id));

    if (allSelectableSelected) {
      // Deselect all selectable products from current page
      setSelectedProducts(prev =>
        prev.filter(id => !selectableIds.includes(id))
      );
    } else {
      // Select all selectable products from current page
      setSelectedProducts(prev => {
        const newSelected = [...prev];
        selectableIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const handleMapProducts = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setIsMappingProducts(true);
    try {
      const selectedProductObjects = products.filter(product =>
        selectedProducts.includes(product.id)
      );

      const existingProductIds = productsList.map(p => p.id);
      const newProducts = selectedProductObjects.filter(
        product => !existingProductIds.includes(product.id)
      );

      const duplicateCount = selectedProductObjects.length - newProducts.length;

      if (newProducts.length === 0) {
        toast.warning("All selected products are already added!");
        setIsMappingProducts(false);
        return;
      }

      const updatedProductsList = [...productsList, ...newProducts];
      setProductsList(updatedProductsList);

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
    setSelectedProducts([]);
    fetchProducts(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1);
  };

  const handleClearAll = () => {
    setSearchText('');
    setFilterType(null);
    setSelectedBrand(null);
    setSelectedParentCategory(null);
    setSelectedSubCategory(null);
    setProducts([]);
    setSelectedProducts([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalProducts(0);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMapProductsToBackend = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const newIndex = existingProducts[existingProducts.length - 1]?.sequence || 0;
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) throw new Error("Failed to map products");

      const newlyMappedProducts = products.filter(p =>
        selectedProducts.includes(p.id)
      );

      setProductsList(prev => [...prev, ...newlyMappedProducts]);
      setSelectedProducts([]);
      toast.success("Product(s) mapped successfully!");
      
      setCurrentPage(1);
      fetchProducts(1);
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

  const hasActiveFilters = searchText.trim() || filterType || selectedBrand || selectedParentCategory || selectedSubCategory;
  
  // Check if there are selectable products (not already added)
  const selectableProducts = products.filter(p => !existingProductIds.has(p.id));
  const selectableIds = selectableProducts.map(p => p.id);
  const allSelectableSelected = selectableIds.length > 0 && 
    selectableIds.every(id => selectedProducts.includes(id));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
      <div
        className="w-[42vw] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right"
        style={{
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Products</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Bar - Always Visible */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Search Products
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Enter product name..."
                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-white border border-primary text-primary text-sm font-medium rounded-lg hover:scale-105 transition-transform cursor-pointer flex items-center gap-1.5"
              >
                <Search size={16} />
                Search
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 bg-white border border-gray-400 text-gray-600 text-sm font-medium rounded-lg hover:scale-105 transition-transform cursor-pointer flex items-center gap-1.5"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Optional Filters */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Filters
            </label>
            <div className="flex gap-3 items-end flex-wrap">
              {/* Filter Type Dropdown */}
              <div className="w-44">
                <SearchableDropdown
                  label="Filter Type"
                  placeholder="Choose a type"
                  options={filterTypeOptions}
                  value={filterType}
                  onChange={(value) => {
                    setFilterType(value);
                    setSelectedBrand(null);
                    setSelectedParentCategory(null);
                    setSelectedSubCategory(null);
                  }}
                  searchPlaceholder="Search type..."
                />
              </div>

              {/* Brand Dropdown */}
              {filterType === 1 && (
                <div className="w-44">
                  <SearchableDropdown
                    label="Select Brand"
                    placeholder="Choose a brand"
                    options={brandOptions}
                    value={selectedBrand}
                    onChange={(value) => {
                      setSelectedBrand(value);
                    }}
                    searchPlaceholder="Search brands..."
                  />
                </div>
              )}

              {/* Category Dropdowns */}
              {filterType === 2 && (
                <>
                  <div className="w-44">
                    <SearchableDropdown
                      label="Parent Category"
                      placeholder="Choose parent category"
                      options={parentCategoryOptions}
                      value={selectedParentCategory}
                      onChange={(value) => {
                        setSelectedParentCategory(value);
                        setSelectedSubCategory(null);
                      }}
                      searchPlaceholder="Search categories..."
                    />
                  </div>
                  <div className="w-44">
                    <SearchableDropdown
                      label="Sub Category"
                      placeholder="Choose sub category"
                      options={subCategoryOptions}
                      value={selectedSubCategory}
                      onChange={(value) => {
                        setSelectedSubCategory(value);
                      }}
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
              {/* Select All - Only show when more than 1 product and there are selectable products */}
              {products.length > 1 && selectableProducts.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Products ({totalProducts})
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    {allSelectableSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}

              {/* Show product count when select all is not shown */}
              {(products.length === 1 || selectableProducts.length === 0) && (
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Products ({totalProducts})
                  </h3>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Products List */}
              {!isLoading && (
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={selectedProducts.includes(product.id)}
                      onToggle={() => handleToggleProduct(product.id)}
                      isAlreadyAdded={isProductAlreadyAdded(product.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-end items-center gap-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${currentPage === 1
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    title="Previous page"
                  >
                    &lt;
                  </button>

                  {/* Page Numbers */}
                  {(() => {
                    let startPage = Math.max(1, currentPage - 1);
                    let endPage = Math.min(totalPages, startPage + 2);

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
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${currentPage === page
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${currentPage === totalPages
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${currentPage === totalPages
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

          {/* Empty State */}
          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package size={48} className="mb-3 text-gray-400" />
              <p className="text-sm font-medium">
                {hasActiveFilters ? 'No products found matching your criteria' : 'Enter a search term or apply filters to find products'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={collectionId ? handleMapProductsToBackend : handleMapProducts}
                disabled={selectedProducts.length === 0 || isMappingProducts}
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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