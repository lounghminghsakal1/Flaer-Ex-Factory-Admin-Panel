"use client";

import { toast } from "react-toastify";
import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import AddToCart from "./[custId]/_components/AddToCart";
import CustomersFilters from "./_components/CustomersFilters";
import { useEffect, useState } from "react";
import CustomersListing from "./_components/CustomersListing";


export default function CustomersPage() {
  const [customersData, setCustomersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomersData();
  },[]);

  const fetchCustomersData = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/customers`;
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setCustomersData(result?.data ?? null);
      setCurrentPage(result?.meta?.current_page ?? 1);
      setTotalPages(result?.meta?.total_pages ?? 1);
    } catch(err) {
      console.log(err);
      toast.error("Failed to fetch customers data "+err);
    } finally {
      setLoading(false);
    }
  }


  return(
    <div className="px-2 py-4">
      <ListingPageHeader title="Customers"  />
      <CustomersFilters /> 
      <CustomersListing customersData={customersData} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
      
    </div>
  );
}