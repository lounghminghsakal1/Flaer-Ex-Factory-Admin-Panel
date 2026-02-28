"use client";

import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import BrandsFilter from "./_components/BrandsFilter";
import BrandsListing from "./_components/BrandsListing";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";
import TablePageSkeleton from "../../../../../components/shared/TablePageSkeleton";

export default function BrandsPage() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination from URL
  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  // Applied filters (API source of truth)
  const [appliedFilters, setAppliedFilters] = useState({
    starts_with: "",
    status: ""
  });

  // Draft filters (UI editing)
  const [draftFilters, setDraftFilters] = useState({
    starts_with: "",
    status: ""
  });

  // Fetch when page or applied filters change
  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;

    const filtersFromUrl = {
      starts_with: searchParams.get("starts_with") || "",
      status: searchParams.get("status") || ""
    };

    fetchBrands(pageFromUrl, filtersFromUrl);

  }, [searchParams]);

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;

    const filtersFromUrl = {
      starts_with: searchParams.get("starts_with") || "",
      status: searchParams.get("status") || ""
    };

    setCurrentPage(pageFromUrl);
    setAppliedFilters(filtersFromUrl);
    setDraftFilters(filtersFromUrl);

  }, [searchParams]);


  const fetchBrands = async (page = 1, filters = {}) => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page,
        ...(filters.starts_with && { starts_with: filters.starts_with.trim() }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands?${query}`
      );
      const result = await response.json();
      if (!response.ok || result?.status === "failure") {
        throw new Error(result?.errors[0] ?? "Something went wrong");
      }
      setBrands(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // APPLY filters
  const handleApplyFilters = (override) => {
    const next = override ?? draftFilters;

    const query = new URLSearchParams({
      page: 1,
      ...(next.starts_with && { starts_with: next.starts_with }),
      ...(next.status && { status: next.status })
    });

    router.push(`?${query.toString()}`, { scroll: false });
  };

  // CLEAR filters
  const handleClearFilters = () => {
    const empty = { starts_with: "", status: "" };

    setDraftFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
    router.push(`?page=1`, { scroll: false });
  };

  if (loading && currentPage === 1) {
    return (
      <TablePageSkeleton columns={7} rows={8} showFilter showSearch />
    );
  }

  return (
    <div className="px-2 py-4">

      <ListingPageHeader title="Brands" />

      <BrandsFilter
        filters={draftFilters}
        appliedFilters={appliedFilters}
        setFilters={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <BrandsListing
        brands={brands}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

    </div>
  );
}
