"use client";


import { useEffect, useState } from "react";
import ListingPageHeader from "../../../../components/shared/ListingPageHeader";
import PurchaseOrdersFilters from "./_components/PurchaseOrdersFilters";
import PurchaseOrdersListing from "./_components/PurchaseOrdersListing";
import { toast } from "react-toastify";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function PurchaseOrders() {

  const [purchaseOrdersData, setPurchaseOrdersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const defaultFilters = {
    by_purchase_order: "",
    by_status: "",
    by_vendor: "",
  };

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const searchParams = useSearchParams();
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    const by_status = searchParams.get("by_status") || "";
    const by_vendor = searchParams.get("by_vendor") || "";
    const by_purchase_order = searchParams.get("by_purchase_order") || "";
    const page = searchParams.get("page") || 1;

    const urlFilters = { by_purchase_order, by_status, by_vendor };
    setDraftFilters(prev => {
      if (JSON.stringify(prev) === JSON.stringify(urlFilters)) return prev;
      return urlFilters;
    });

    setAppliedFilters(prev => {
      if (JSON.stringify(prev) === JSON.stringify(urlFilters)) return prev;
      return urlFilters;
    });
    setCurrentPage(page);
    
  }, [searchParams.toString()]);



  useEffect(() => {
    fetchPurchaseOrdersData();
  }, [searchParams.toString()]);

  const fetchPurchaseOrdersData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.get("page")) {
        params.set("page", "1");
      }
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders?${params.toString()}`;
      const response = await fetch(url);
      const json = await response.json();
      if (!response.ok || json.status === "failure") throw new Error(json.errors[0] ?? "Something went wrong ");
      setPurchaseOrdersData(json.data);
      if (!response.ok || json.status === "failure") {
        if (json?.errors.length > 0) {
          setErrors(json.errors[0]);
        }
        throw new Error(json?.errors[0]);
      }
      setCurrentPage(json?.meta?.current_page);
      setTotalPages(json?.meta?.total_pages);

    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch purchase orders data " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (draftFilters.by_purchase_order) params.append("by_purchase_order", draftFilters.by_purchase_order);
    if (draftFilters.by_status) params.append("by_status", draftFilters.by_status);
    if (draftFilters.by_vendor) params.append("by_vendor", draftFilters.by_vendor);
    params.append("page", "1");
    router.push(`${pathName}?${params.toString()}`);
  }

  const handleClearFilters = () => {
    setAppliedFilters(defaultFilters);
    setDraftFilters(defaultFilters);
    setCurrentPage(1);
    router.push(pathName);
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    if (appliedFilters.by_purchase_order) params.append("by_purchase_order", appliedFilters.by_purchase_order);
    if (appliedFilters.by_status) params.append("by_status", appliedFilters.by_status);
    if (appliedFilters.by_vendor) params.append("by_vendor", appliedFilters.by_vendor);
    params.append("page", page);
    router.push(`${pathName}?${params.toString()}`);
  }

  const isDirty = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  const hasActiveFilters = appliedFilters.by_purchase_order || appliedFilters.by_status || appliedFilters.by_vendor;

  return (
    <div>
      <ListingPageHeader title="Purchase Orders" />
      <PurchaseOrdersFilters
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        isDirty={isDirty}
        hasActiveFilters={hasActiveFilters}
      />
      <PurchaseOrdersListing data={purchaseOrdersData} currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
    </div>
  );
}