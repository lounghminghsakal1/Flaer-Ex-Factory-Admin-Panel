"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";

import CategoriesFilter from "./_components/CategoriesFilter";
import CategoriesListing from "./_components/CategoriesListing";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import TablePageSkeleton from "../../../../../components/shared/TablePageSkeleton";

export default function CategoriesPage() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  //  Pagination from URL
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  const [totalPages, setTotalPages] = useState(1);

  //  Applied filters (API source of truth)
  const [appliedFilters, setAppliedFilters] = useState({
    starts_with: searchParams.get("starts_with") || "",
    status: searchParams.get("status") || ""
  });

  //  Draft filters (UI editing)
  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  //  Fetch when page or applied filters change
  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage, appliedFilters]);

  //  Sync applied filters to URL
  useEffect(() => {
    const query = new URLSearchParams({
      page: currentPage,
      ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with }),
      ...(appliedFilters.status && { status: appliedFilters.status })
    });

    router.replace(`?${query.toString()}`, { scroll: false });

  }, [currentPage, appliedFilters]);

  const fetchCategories = async (page = 1) => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page,
        ...(appliedFilters.starts_with && { starts_with: appliedFilters.starts_with.trim() }),
        ...(appliedFilters.status && { status: appliedFilters.status })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&${query}`
      );

      if (!response.ok) throw new Error();

      const result = await response.json();

      setCategories(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  // APPLY filters
  const handleApplyFilters = (override) => {
    const next = override ?? draftFilters;

    setCurrentPage(1);
    setAppliedFilters(next);
  };

  //  CLEAR filters
  const handleClearFilters = () => {
    const empty = { starts_with: "", status: "" };

    setDraftFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  if (loading && currentPage === 1) {
    return (
      <TablePageSkeleton columns={7} rows={10} />
    );
  }

  return (
    <div className="px-2 py-4">

      <ListingPageHeader title="Categories" />

      <CategoriesFilter
        filters={draftFilters}
        appliedFilters={appliedFilters}
        setFilters={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <CategoriesListing
        categories={categories}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

    </div>
  );
}
