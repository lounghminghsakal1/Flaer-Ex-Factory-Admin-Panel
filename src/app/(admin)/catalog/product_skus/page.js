"use client";

import { useState,useEffect } from "react";
import ListingPageHeader from "../../../../../components/shared/ListingPageHeader";
import ProductSkusFilters from "./_components/ProductSkusFilters";
import ProductSkusListingPage from "./_components/ProductSkusLitingPage";
import { toast } from "react-toastify";

export default function ProductSkusPage() {

  const [productSkusdata, setProductSkusData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchProductSkusData(currentPage);
  },[currentPage]);

  const fetchProductSkusData = async (page = 1) => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus?page=${page}`;
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
      <ProductSkusFilters />
      <ProductSkusListingPage productSkusData={productSkusdata} currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
    </div>
  );
}