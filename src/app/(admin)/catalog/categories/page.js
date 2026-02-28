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

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;

    const filtersFromUrl = {
      starts_with: searchParams.get("starts_with") || "",
      status: searchParams.get("status") || ""
    };

    setCurrentPage(pageFromUrl);
    setAppliedFilters(filtersFromUrl);
    setDraftFilters(filtersFromUrl);

    fetchCategories(pageFromUrl, filtersFromUrl);

  }, [searchParams]);

  const fetchCategories = async (page = 1, filters = {}) => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page,
        ...(filters.starts_with && { starts_with: filters.starts_with.trim() }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true&${query}`
      );

      const result = await response.json();

      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");

      setCategories(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch(err) {
      console.log(err);
      toast.error("Failed to fetch categories "+err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (override) => {
    const next = override ?? draftFilters;

    const query = new URLSearchParams({
      page: 1,
      ...(next.starts_with && { starts_with: next.starts_with }),
      ...(next.status && { status: next.status })
    });

    router.push(`?${query.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.push(`?page=1`, { scroll: false });
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
