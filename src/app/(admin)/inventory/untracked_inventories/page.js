"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";

import UntrackedInventoryFilters from "./_components/UntrackedInventoryFilters";
import UntrackedInventoryListing from "./_components/UntrackedInventoryListing";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import TablePageSkeleton from "../../../../../components/shared/TablePageSkeleton";

export default function UntrackedInventoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [untrackedData, setUntrackedData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [totalPages, setTotalPages] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState({
    by_node:             searchParams.get("by_node")             || "",
    by_untracked_number: searchParams.get("by_untracked_number") || "",
    by_product_sku:      searchParams.get("by_product_sku")      || "",
    by_sku_code:         searchParams.get("by_sku_code")         || "",
  });

  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    const filtersFromUrl = {
      by_node:             searchParams.get("by_node")             || "",
      by_untracked_number: searchParams.get("by_untracked_number") || "",
      by_product_sku:      searchParams.get("by_product_sku")      || "",
      by_sku_code:         searchParams.get("by_sku_code")         || "",
    };

    setCurrentPage(pageFromUrl);
    setAppliedFilters(filtersFromUrl);
    setDraftFilters(filtersFromUrl);

    fetchUntrackedInventory(pageFromUrl, filtersFromUrl);
  }, [searchParams]);

  const fetchUntrackedInventory = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        ...(filters.by_node             && { by_node:             filters.by_node             }),
        ...(filters.by_untracked_number && { by_untracked_number: filters.by_untracked_number }),
        ...(filters.by_product_sku      && { by_product_sku:      filters.by_product_sku      }),
        ...(filters.by_sku_code         && { by_sku_code:         filters.by_sku_code.trim()  }),
      });

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/inventory/untracked_inventories?${query}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure")
        throw new Error(result?.errors?.[0] ?? "Something went wrong");

      setUntrackedData(result?.data ?? []);
      setTotalPages(result?.meta?.total_pages ?? 1);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch untracked inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildQuery = (filters, page) => {
    const query = new URLSearchParams({
      page,
      ...(filters.by_node             && { by_node:             filters.by_node             }),
      ...(filters.by_untracked_number && { by_untracked_number: filters.by_untracked_number }),
      ...(filters.by_product_sku      && { by_product_sku:      filters.by_product_sku      }),
      ...(filters.by_sku_code         && { by_sku_code:         filters.by_sku_code         }),
    });
    return query.toString();
  };

  const handleApplyFilters = () => {
    router.push(`?${buildQuery(draftFilters, 1)}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.push(`?page=1`, { scroll: false });
  };

  const handlePageChange = (page) => {
    router.push(`?${buildQuery(appliedFilters, page)}`, { scroll: false });
  };

  if (loading && currentPage === 1) {
    return <TablePageSkeleton columns={8} rows={10} />;
  }

  return (
    <div className="px-2 py-4">
      <ListingPageHeader title="Untracked Inventory" />
      <UntrackedInventoryFilters
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        appliedFilters={appliedFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
      <UntrackedInventoryListing
        untrackedData={untrackedData}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={handlePageChange}
      />
    </div>
  );
}