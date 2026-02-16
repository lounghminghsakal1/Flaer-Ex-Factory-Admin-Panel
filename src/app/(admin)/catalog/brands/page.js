"use client";

import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import BrandsFilter from "./_components/BrandsFilter";
import BrandsListing from "./_components/BrandsListing";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";

export default function BrandsPage() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination from URL
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  const [totalPages, setTotalPages] = useState(1);

  // Applied filters (API source of truth)
  const [appliedFilters, setAppliedFilters] = useState({
    starts_with: searchParams.get("starts_with") || "",
    status: searchParams.get("status") || ""
  });

  // Draft filters (UI editing)
  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  // Fetch when page or applied filters change
  useEffect(() => {
    fetchBrands(currentPage);
  }, [currentPage, appliedFilters]);

  // Sync applied filters → URL
  useEffect(() => {
    const query = new URLSearchParams({
      page: currentPage,
      ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with }),
      ...(appliedFilters.status && { status: appliedFilters.status })
    });

    router.replace(`?${query.toString()}`, { scroll: false });

  }, [currentPage, appliedFilters]);

  const fetchBrands = async (page = 1) => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page,
        ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with.trim() }),
        ...(appliedFilters.status && { status: appliedFilters.status })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands?${query}`
      );

      if (!response.ok) throw new Error("Failed to fetch brands");

      const result = await response.json();

      setBrands(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  // APPLY filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters(draftFilters);
  };

  // CLEAR filters
  const handleClearFilters = () => {
    const empty = { starts_with: "", status: "" };

    setDraftFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
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
