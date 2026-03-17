"use client";

import { toast } from "react-toastify";
import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import OrdersListing from "./_components/OrdersListing";
import { useState,useEffect } from "react";

export default function OrdersPage() {
  
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrdersData();
  },[currentPage]);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/orders?page=${currentPage}`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setOrdersData(result?.data || []);
      setCurrentPage(result?.meta?.current_page);
      setTotalPages(result?.meta?.total_pages);
    } catch(err) {
      console.log(err);
      toast.error("Failed to fetch orders data, "+err.message);
    } finally {
      setLoading(false);
    }
  }

  return(
    <div className="px-2 py-4">
      <ListingPageHeader title="Orders" />
      {/* <OrdersFilters />     */}
      <OrdersListing ordersData={ordersData} currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
    </div>
  );
}