"use client";
import DataTable from "../../../../../../components/shared/DataTable";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import TablePageSkeleton from "../../../../../../components/shared/TablePageSkeleton";
import ListingPageHeader from "../../../../../../components/shared/ListingPageHeader";
import ProductsFilter from "./ProductsFilter";

export default function ProductsListing() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const pageFromUrl = Number(searchParams.get("page")) || 1;

    const filtersFromUrl = {
      starts_with: searchParams.get("starts_with") || "",
      parent_category_id: searchParams.get("parent_category_id") || "",
      sub_category_id: searchParams.get("sub_category_id") || "",
      brand_id: searchParams.get("brand_id") || "",
      status: searchParams.get("status") || ""
    };

    setCurrentPage(pageFromUrl);
    setAppliedFilters(filtersFromUrl);
    setDraftFilters(filtersFromUrl);

    fetchProductDetails(pageFromUrl, filtersFromUrl);

  }, [searchParams]);

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
      setBrandOptions(result.data.map(b => ({...b, id: String(b.id)})));
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchCategoriesOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&only_names=true`);
      const result = await response.json();
      setParentCategoryOptions(result.data.map(c => ({...c, id: String(c.id)})));
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchSubCategoriesOptions(parentId) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?parent_id=${parentId}&only_names=true`);
      const result = await response.json();
      setSubCategoryOptions(result.data.map(subC => ({...subC, id: String(subC.id)})));
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchProductDetails(page = 1, filters = {}) {
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

  const handleApply = (override) => {
    const next = override ?? draftFilters;

    const query = new URLSearchParams({
      page: 1,
      ...(next.starts_with && { starts_with: next.starts_with }),
      ...(next.status && { status: next.status }),
      ...(next.brand_id && { brand_id: next.brand_id }),
      ...(next.sub_category_id && { sub_category_id: next.sub_category_id }),
      ...(next.parent_category_id && { parent_category_id: next.parent_category_id })
    });

    router.push(`?${query.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    router.push(`?page=1`, { scroll: false });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page);

    router.push(`?${params.toString()}`, { scroll: false });
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
              : value === 'inactive' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
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
    <div className="h-screen bg-gray-50 px-2 py-4">
      <ListingPageHeader title="Products" />
      {/* Table */}
      <ProductsFilter draftFilters={draftFilters} setDraftFilters={setDraftFilters} brandOptions={brandOptions} handleApply={handleApply} handleClear={handleClear} isDirty={isDirty} parentCategoryOptions={parentCategoryOptions} subCategoryOptions={subCategoryOptions} hasActiveFilters={hasActiveFilters} />
      <DataTable
        columns={columns}
        data={data}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        getDetailsLink={(row) => {
          const params = new URLSearchParams(searchParams.toString());
          return `/catalog/products/form?id=${row.id}&returnTo=${encodeURIComponent(params.toString())}`;
        }}
      />
    </div>
  );
}