"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";

import BatchInventoryFilters from "./_components/BatchInventoryFilters";
import BatchInventoryListing from "./_components/BatchInventoryListing";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import TablePageSkeleton from "../../../../../components/shared/TablePageSkeleton";

export default function BatchInventoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [batchData, setBatchData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [totalPages, setTotalPages] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState({
    by_node: searchParams.get("by_node") || "",
    by_batch: searchParams.get("by_batch") || "",
    by_product_sku: searchParams.get("by_product_sku") || "",
    by_sku_code: searchParams.get("by_sku_code") || "",
  });

  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    const filtersFromUrl = {
      by_node: searchParams.get("by_node") || "",
      by_batch: searchParams.get("by_batch") || "",
      by_product_sku: searchParams.get("by_product_sku") || "",
      by_sku_code: searchParams.get("by_sku_code") || "",
    };

    setCurrentPage(pageFromUrl);
    setAppliedFilters(filtersFromUrl);
    setDraftFilters(filtersFromUrl);

    fetchBatchInventory(pageFromUrl, filtersFromUrl);
  }, [searchParams]);

  const fetchBatchInventory = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        ...(filters.by_node && { by_node: filters.by_node }),
        ...(filters.by_batch && { by_batch: filters.by_batch }),
        ...(filters.by_product_sku && { by_product_sku: filters.by_product_sku }),
        ...(filters.by_sku_code && { by_sku_code: filters.by_sku_code.trim() }),
      });

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/inventory/batch_inventories?${query}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure")
        throw new Error(result?.errors?.[0] ?? "Something went wrong");

      setBatchData(result?.data ?? []);
      setTotalPages(result?.meta?.total_pages ?? 1);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch batch inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const query = new URLSearchParams({
      page: 1,
      ...(draftFilters.by_node && { by_node: draftFilters.by_node }),
      ...(draftFilters.by_batch && { by_batch: draftFilters.by_batch }),
      ...(draftFilters.by_product_sku && { by_product_sku: draftFilters.by_product_sku }),
      ...(draftFilters.by_sku_code && { by_sku_code: draftFilters.by_sku_code }),
    });
    router.push(`?${query.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.push(`?page=1`, { scroll: false });
  };

  const handlePageChange = (page) => {
    const query = new URLSearchParams({
      page,
      ...(appliedFilters.by_node && { by_node: appliedFilters.by_node }),
      ...(appliedFilters.by_batch && { by_batch: appliedFilters.by_batch }),
      ...(appliedFilters.by_product_sku && { by_product_sku: appliedFilters.by_product_sku }),
      ...(appliedFilters.by_sku_code && { by_sku_code: appliedFilters.by_sku_code }),
    });
    router.push(`?${query.toString()}`, { scroll: false });
  };

  if (loading && currentPage === 1) {
    return <TablePageSkeleton columns={10} rows={10} />;
  }

  return (
    <div className="px-2 py-4">
      <ListingPageHeader title="Batch Inventory" />
      <BatchInventoryFilters
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        appliedFilters={appliedFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
      <BatchInventoryListing
        batchData={batchData}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={handlePageChange}
      />
    </div>
  );
}