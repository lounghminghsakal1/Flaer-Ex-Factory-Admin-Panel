"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import TaxFilters from "./_components/TaxFilters";
import TaxesListing from "./_components/TaxesListing";

export default function TaxesPage() {
  const [taxesData, setTaxesData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const starts_with = "";

  useEffect(() => {
    fetchTaxesData();
  }, []);

  const fetchTaxesData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setTaxesData(result?.data);
      setCurrentPage(result?.meta?.current_page);
      setTotalPages(result?.meta?.total_pages);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch taxes data "+err.message);
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = () => {

  }

  return (
    <div className="px-2 py-4">
      <ListingPageHeader title="Tax Types" />
      <TaxFilters startss_with={starts_with} onApply={() => {}} onClear={() => {}} />  
      <TaxesListing taxesData={taxesData} currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange}  />
    </div>
  );
}