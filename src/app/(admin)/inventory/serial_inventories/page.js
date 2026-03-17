"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";

import SerialInventoryFilters from "./_components/SerialInventoryFilters";
import SerialInventoryListing from "./_components/SerialInventoryListing";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import TablePageSkeleton from "../../../../../components/shared/TablePageSkeleton";

export default function SerialInventoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [serialData, setSerialData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [totalPages, setTotalPages] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState({
    by_node:          searchParams.get("by_node")          || "",
    by_status:        searchParams.get("by_status")        || "",
    by_product_sku:   searchParams.get("by_product_sku")   || "",
    by_sku_code:      searchParams.get("by_sku_code")      || "",
    by_serial_number: searchParams.get("by_serial_number") || "",
  });

  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    const filtersFromUrl = {
      by_node:          searchParams.get("by_node")          || "",
      by_status:        searchParams.get("by_status")        || "",
      by_product_sku:   searchParams.get("by_product_sku")   || "",
      by_sku_code:      searchParams.get("by_sku_code")      || "",
      by_serial_number: searchParams.get("by_serial_number") || "",
    };

    setCurrentPage(pageFromUrl);
    setAppliedFilters(filtersFromUrl);
    setDraftFilters(filtersFromUrl);

    fetchSerialInventory(pageFromUrl, filtersFromUrl);
  }, [searchParams]);

  const fetchSerialInventory = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        ...(filters.by_node          && { by_node:          filters.by_node          }),
        ...(filters.by_status        && { by_status:        filters.by_status        }),
        ...(filters.by_product_sku   && { by_product_sku:   filters.by_product_sku   }),
        ...(filters.by_sku_code      && { by_sku_code:      filters.by_sku_code.trim()  }),
        ...(filters.by_serial_number && { by_serial_number: filters.by_serial_number.trim() }),
      });

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/inventory/serial_inventories?${query}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure")
        throw new Error(result?.errors?.[0] ?? "Something went wrong");

      setSerialData(result?.data ?? []);
      setTotalPages(result?.meta?.total_pages ?? 1);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch serial inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildQuery = (filters, page) => {
    return new URLSearchParams({
      page,
      ...(filters.by_node          && { by_node:          filters.by_node          }),
      ...(filters.by_status        && { by_status:        filters.by_status        }),
      ...(filters.by_product_sku   && { by_product_sku:   filters.by_product_sku   }),
      ...(filters.by_sku_code      && { by_sku_code:      filters.by_sku_code      }),
      ...(filters.by_serial_number && { by_serial_number: filters.by_serial_number }),
    }).toString();
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
    return <TablePageSkeleton columns={5} rows={10} />;
  }

  return (
    <div className="px-2 py-4">
      <ListingPageHeader title="Serial Inventory" />
      <SerialInventoryFilters
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        appliedFilters={appliedFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
      <SerialInventoryListing
        serialData={serialData}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={handlePageChange}
      />
    </div>
  );
}