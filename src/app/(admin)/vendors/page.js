"use client";

import { useEffect, useState } from "react";

import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import VendorsFilters from "./_components/VendorsFilters";
import VendorsListing from "./_components/VendorsListing";
import { toast } from "react-toastify";
import TablePageSkeleton from "../../../../components/shared/TablePageSkeleton";

export default function VendorsPage() {

  const [loading, setLoading] = useState(false);
  const [vendorsData, setVendorsData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVendorId, setLastVendorId] = useState(null);

  useEffect(() => {
    fetchVendorsData();
  }, []);

  const fetchVendorsData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.status !== "success") {
        throw result?.message || "Something went wrong";
      }
      setVendorsData(result.data);
      setCurrentPage(result.meta.current_page);
      setTotalPages(result.meta.total_pages);
      setLastVendorId(result.data[result.data.length-1].id);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch vendors data" + err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <TablePageSkeleton />

  return (
    <div className="px-2 py-4">
      <ListingPageHeader title="Vendors"  />
      <VendorsFilters />
      <VendorsListing vendorsData={vendorsData} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
    </div>
  );
}