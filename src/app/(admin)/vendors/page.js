"use client";

import { useEffect, useState } from "react";

import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import VendorsFilters from "./_components/VendorsFilters";
import VendorsListing from "./_components/VendorsListing";
import { toast } from "react-toastify";
import TablePageSkeleton from "../../../../components/shared/TablePageSkeleton";
import { useParams,useRouter,usePathname, useSearchParams } from "next/navigation";

const defaultFilters = {
  starts_with: "",
  by_status: "",
  vendor_type: ""
};

export default function VendorsPage() {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [vendorsData, setVendorsData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  useEffect(() => {
    const starts_with = searchParams.get("starts_with") || "";
    const by_status = searchParams.get("by_status") || "";
    const vendor_type = searchParams.get("vendor_type") || "";
    const page = Number(searchParams.get("page")) || 1;

    const urlFilters = {starts_with, by_status, vendor_type };
    setDraftFilters(urlFilters);
    setAppliedFilters(urlFilters);
    setCurrentPage(page);
  },[searchParams.toString()]);

  useEffect(() => {
    fetchVendorsData();
  }, [searchParams.toString()]);

  const fetchVendorsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.get("page")) {
        params.set("page", "1");
      }
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.status !== "success") {
        throw result?.errors[0] || "Something went wrong";
      }
      setVendorsData(result.data);
      //setCurrentPage(result.meta.current_page);
      setTotalPages(result.meta.total_pages);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch vendors data" + err);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (draftFilters.starts_with) {
      params.append("starts_with",draftFilters.starts_with);
    }
    if (draftFilters.by_status) {
      params.append("by_status",draftFilters.by_status);
    }
    if (draftFilters.vendor_type) {
      params.append("vendor_type",draftFilters.vendor_type);
    }
    params.append("page", "1");
    router.push(`${pathName}?${params.toString()}`);
  }

  const handleClearFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
    router.push(pathName);
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = new URLSearchParams();
    if (appliedFilters.starts_with) {
      params.append("starts_with",appliedFilters.starts_with);
    }
    if (appliedFilters.by_status) {
      params.append("by_status",appliedFilters.by_status);
    }
    if (appliedFilters.vendor_type) {
      params.append("vendor_type",appliedFilters.vendor_type);
    }
    params.append("page", page);
    router.push(`${pathName}?${params.toString()}`);
  }

  const isDirty = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const hasActiveFilters = appliedFilters.starts_with || appliedFilters.by_status || appliedFilters.vendor_type;

  if (loading) return <TablePageSkeleton />

  return (
    <div className="px-2 py-4">
      <ListingPageHeader title="Vendors"  />
      <VendorsFilters
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isDirty={isDirty}
        hasActiveFilters={hasActiveFilters}
      />
      <VendorsListing vendorsData={vendorsData} currentPage={currentPage} totalPages={totalPages} setCurrentPage={handlePageChange} />
    </div>
  );
}