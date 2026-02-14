"use client";
import DataTable from "../../../../../../components/shared/DataTable";
import { useState, useEffect } from "react";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import useDebounce from "../../../../../../components/hooks/useDebounce";
import { SearchIcon } from "lucide-react";

export default function ProductsListing() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const defaultFilters = {
    starts_with: "",
    parent_category_id: "",
    sub_category_id: "",
    brand_id: "",
    status: ""
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [brandOptions, setBrandOptions] = useState([]);
  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [parentCategory, setParentCategory] = useState("");
  const [isSearch, setIsSearch] = useState(false);

  const hasActiveFilters =
    filters.starts_with ||
    filters.status ||
    filters.brand_id ||
    filters.sub_category_id ||
    searchInput ||
    parentCategory;

  useEffect(() => {
    fetchProductDetails(currentPage);
  }, [currentPage, isSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    fetchBrandsOptions();
    fetchCategoriesOptions();
  }, []);

  useEffect(() => {
    if (!parentCategory) {
      setSubCategoryOptions([]);
    }
    fetchSubCategoriesOptions(parentCategory);
  }, [parentCategory])

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      starts_with: debouncedSearch
    }))
  }, [debouncedSearch]);

  async function fetchBrandsOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands?only_names=true`);
      const result = await response.json();
      setBrandOptions(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchCategoriesOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`);
      const result = await response.json();
      setParentCategoryOptions(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchSubCategoriesOptions(parentId) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${parentId}&only_names=true`);
      const result = await response.json();
      setSubCategoryOptions(result.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchProductDetails(page = 1) {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page,
        ...(filters.starts_with && { starts_with: filters.starts_with.trim() }),
        ...(filters.status && { status: filters.status }),
        ...(filters.brand_id && { brand_id: filters.brand_id }),
        ...(filters.sub_category_id && { sub_category_id: filters.sub_category_id }),
        ...(filters.parent_category_id && { parent_category_id: filters.parent_category_id })

      }).toString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products?${query}`
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const result = await response.json();

      setData(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'display_name',
      label: 'Product Name',
      render: (value) => (
        <div className="font-medium text-gray-900">
          {value}
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Product Code',
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, row) => (<span>{row.parent_category?.name ?? "-"} {'>>'} {row.sub_category?.name} </span>),
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (_, row) => row.brand?.name ?? '—',
    },
    {
      key: 'hsn_code',
      label: 'HSN Code',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-[11px] font-semibold
            ${value === 'active'
              ? 'bg-green-100 text-green-700'
              : value === 'inactive' ? 'bg-gray-300 text-gray-700' : 'bg-red-100 text-red-700'
            }`}
        >
          {value === "active" ? "ACTIVE" : value === "inactive" ? "INACTIVE" : "DELETED"}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap items-end gap-4 mb-5 p-4 bg-white shadow-sm border border-gray-200
 rounded-lg ">
          <div className="flex justify-center items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search product by name..."
              className="border text-gray-600 text-sm border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition px-3 h-9 w-52 rounded-l"
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, starts_with: value }));
                setSearchInput(value);
                if (value.trim() === "") {
                  setIsSearch(!isSearch);
                }
              }
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearch(!isSearch);
                }
              }}
            />
            <span className="h-9 px-2 py-1 rounded-r border bg-blue-500 border-gray-300 focus:border-blue-700 hover:bg-blue-700 cursor-pointer" onClick={() => setIsSearch(!isSearch)} ><SearchIcon color="white" /></span>
          </div>

          {/* Status */}
          <select
            className="border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition px-3 h-9 w-32 rounded"
            value={filters.status}
            onChange={(e) => {
              const value = e.target.value;
              setFilters(prev => ({ ...prev, status: value }));
              if (value === "") setIsSearch(!isSearch);
            }
            }
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </select>

          {/* Brand */}
          <div className="w-48">
            <SearchableDropdown
              placeholder="Select Brand"
              options={brandOptions}
              value={filters.brand_id}
              onChange={(value) =>
                setFilters(prev => ({ ...prev, brand_id: value }))
              }
            />
          </div>
          {/* Category */}
          <div className="flex gap-2 items-center ">
            {/* Parent Category */}
            <div className="w-52">
              <SearchableDropdown
                placeholder="Select Category"
                options={parentCategoryOptions}
                value={parentCategory}
                onChange={(value) => { setParentCategory(value); setFilters(prev => ({ ...prev, sub_category_id: "", parent_category_id: value })) }}
              />
            </div>
            {/* Sub Category */}
            {parentCategory && (
              <div className="w-52">
                <SearchableDropdown
                  placeholder="Select sub category"
                  options={subCategoryOptions}
                  value={filters.sub_category_id}
                  onChange={(value) => setFilters((prev) => ({ ...prev, sub_category_id: value }))}
                  emptyMessage="No sub categories for the selected parent category "
                />
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <button className="h-10 px-4 bg-blue-700 text-gray-100 border rounded-md hover:bg-gray-100 hover:text-blue-600 hover:scale-110 cursor-pointer transition-all duration-200 ease-in-out" onClick={() => setIsSearch(!isSearch)}>
              Apply
            </button>
          )}

          <div>
            {hasActiveFilters && (<button className="h-10 px-4 bg-red-700 border text-gray-100 hover:bg-gray-100 hover:text-red-700 rounded cursor-pointer hover:scale-110 transition-all duration-200 ease-in-out" onClick={() => { setFilters(defaultFilters); setParentCategory(""); setSearchInput(""); setIsSearch(!isSearch) }} >
              Clear
            </button>)}
          </div>

        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getDetailsLink={(row) => `/catalog/products/form?id=${row.id}`}
      />
    </div>
  );
}