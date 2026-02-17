"use client";
import DataTable from "../../../../../../components/shared/DataTable";
import { useState, useEffect } from "react";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import useDebounce from "../../../../../../components/hooks/useDebounce";
import { FilterX, SearchIcon } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import TablePageSkeleton from "../../../../../../components/shared/TablePageSkeleton";

export default function ProductsListing() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [totalPages, setTotalPages] = useState(1);

  const defaultFilters = {
    starts_with: "",
    parent_category_id: "",
    sub_category_id: "",
    brand_id: "",
    status: ""
  };

  const [appliedFilters, setAppliedFilters] = useState({
    starts_with: searchParams.get("starts_with") || "",
    parent_category_id: searchParams.get("parent_category_id") || "",
    sub_category_id: searchParams.get("sub_category_id") || "",
    brand_id: searchParams.get("brand_id") || "",
    status: searchParams.get("status") || ""
  });

  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [brandOptions, setBrandOptions] = useState([]);
  const [parentCategoryOptions, setParentCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  const isDirty =
    draftFilters.starts_with !== appliedFilters.starts_with ||
    draftFilters.status !== appliedFilters.status ||
    draftFilters.brand_id !== appliedFilters.brand_id ||
    draftFilters.sub_category_id !== appliedFilters.sub_category_id ||
    draftFilters.parent_category_id !== appliedFilters.parent_category_id;

  const hasActiveFilters =
    appliedFilters.starts_with ||
    appliedFilters.status ||
    appliedFilters.brand_id ||
    appliedFilters.sub_category_id ||
    appliedFilters.parent_category_id;

  useEffect(() => {
    fetchProductDetails(currentPage);
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    const query = new URLSearchParams({
      page: currentPage,
      ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with }),
      ...(appliedFilters.status && { status: appliedFilters.status }),
      ...(appliedFilters.brand_id && { brand_id: appliedFilters.brand_id }),
      ...(appliedFilters.sub_category_id && { sub_category_id: appliedFilters.sub_category_id }),
      ...(appliedFilters.parent_category_id && { parent_category_id: appliedFilters.parent_category_id })
    });

    router.replace(`?${query.toString()}`, { scroll: false });

  }, [currentPage, appliedFilters]);

  useEffect(() => {
    fetchBrandsOptions();
    fetchCategoriesOptions();
  }, []);

  useEffect(() => {
    if (!draftFilters.parent_category_id) {
      setSubCategoryOptions([]);
      return;
    }
    fetchSubCategoriesOptions(draftFilters.parent_category_id);
  }, [draftFilters.parent_category_id])

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
        ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with.trim() }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        ...(appliedFilters.brand_id && { brand_id: appliedFilters.brand_id }),
        ...(appliedFilters.sub_category_id && { sub_category_id: appliedFilters.sub_category_id }),
        ...(appliedFilters.parent_category_id && { parent_category_id: appliedFilters.parent_category_id })

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

  const handleApply = (override) => {
    const next = override ?? draftFilters;
    setCurrentPage(1);
    setAppliedFilters(next);
  };

  const handleClear = () => {
    const empty = {
      starts_with: "",
      parent_category_id: "",
      sub_category_id: "",
      brand_id: "",
      status: ""
    };

    setDraftFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

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
          className={`px-2 py-1 rounded-full text-[10px] font-semibold
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

  if (loading) {
    return (
      <TablePageSkeleton columns={7} rows={15} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-5 p-2 bg-white shadow-sm border border-gray-200
 rounded-lg ">
          {/* Search */}
          <div className="flex justify-center items-center">
            <input
              type="text"
              placeholder="Search product by name..."
              className="border border-gray-300 text-sm px-2 h-8 w-48 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500"
              value={draftFilters.starts_with}
              onChange={(e) => {
                const value = e.target.value;
                const nextFilters = {...draftFilters, starts_with: value};
                setDraftFilters(nextFilters);
                if (value.trim() === "") handleApply(nextFilters);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply(draftFilters);
              }}
            />
            <span className="h-8 px-2 flex items-center border border-gray-300 border-l-0 bg-primary text-white rounded-r cursor-pointer hover:scale-105 transition" onClick={() => handleApply(draftFilters)}><SearchIcon color="white" /></span>
          </div>

          {/* Status */}
          <select
            className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500"
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters(prev => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </select>

          {/* Brand */}
          <div className="w-36">
            <SearchableDropdown
              placeholder="Select Brand"
              options={brandOptions}
              value={draftFilters.brand_id}
              onChange={(value) =>
                setDraftFilters(prev => ({ ...prev, brand_id: value }))
              }
            />
          </div>

          {/* Category */}
          <div className="flex gap-2 items-center ">
            {/* Parent Category */}
            <div className="w-41">
              <SearchableDropdown
                placeholder="Select Category"
                options={parentCategoryOptions}
                value={draftFilters.parent_category_id}
                onChange={(value) =>
                  setDraftFilters(prev => ({
                    ...prev,
                    parent_category_id: value,
                    sub_category_id: ""
                  }))
                }
              />
            </div>
            {/* Sub Category */}
            {draftFilters.parent_category_id && (
              <div className="w-41">
                <SearchableDropdown
                  placeholder="Select sub category"
                  options={subCategoryOptions}
                  value={draftFilters.sub_category_id}
                  onChange={(value) =>
                    setDraftFilters(prev => ({ ...prev, sub_category_id: value }))
                  }
                  emptyMessage="No sub categories for the selected parent category "
                />
              </div>
            )}
          </div>

          {isDirty && (
            <button className="flex text-sm items-center gap-1 h-8 px-3 border border-primary text-primary rounded hover:scale-105 transition cursor-pointer" onClick={handleApply}>
              Apply
            </button>
          )}

          <div>
            {hasActiveFilters && (
              <button className="flex text-sm items-center gap-1 h-8 px-3 border border-gray-500 text-gray-500 rounded hover:scale-105 transition cursor-pointer" onClick={() => {
                handleClear();
              }}
              >
                <FilterX size={16} />
                Clear Filters
              </button>
            )}
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
        getDetailsLink={(row) => {
          const params = new URLSearchParams(window.location.search);
          return `/catalog/products/form?id=${row.id}&returnTo=${encodeURIComponent(params.toString())}`;
        }}
      />
    </div>
  );
}