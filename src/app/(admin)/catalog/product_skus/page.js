"use client";

import { useState,useEffect } from "react";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import ProductSkusFilters from "./_components/ProductSkusFilters";
import ProductSkusListingPage from "./_components/ProductSkusLitingPage";
import { toast } from "react-toastify";
import { useSearchParams, usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function ProductSkusPage() {

  const [productSkusdata, setProductSkusData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();
  const starts_with = searchParams.get("starts_with") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page")) ?? 1;

  useEffect(() => {
    fetchProductSkusData();
  },[searchParams]);
  
  const updateFilters = (filter) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(filter).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    })
    router.push(`${pathName}?${params.toString()}`);
  }

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page);
    router.push(`${pathName}?${params.toString()}`);
  }

 
  const fetchProductSkusData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus?${searchParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Network error (${response.status})`);
      const result = await response.json();
      if (result.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setProductSkusData(result.data);
      setCurrentPage(result.meta.current_page);
      setTotalPages(result.meta.total_pages);
    } catch(err) {
      console.log(err);
      toast.error("Failed to fetch product skus data "+err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ListingPageHeader title="Product SKUs" />
      <ProductSkusFilters start_with={starts_with} status={status} onApply={(filters) => updateFilters({...filters, page: 1})} onClear={() => router.push(`${pathName}`)} />
      <ProductSkusListingPage productSkusData={productSkusdata} currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} handlePageChange={handlePageChange}  />
    </div>
  );
}