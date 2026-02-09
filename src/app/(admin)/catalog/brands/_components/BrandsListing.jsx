"use client";

import { lazy, useEffect, useState } from "react";
import DataTable from "../../../../../../components/shared/DataTable";
import { Loader2 } from "lucide-react";

export default function BrandsListing() {

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBrands(currentPage);
  }, [currentPage]);

  const fetchBrands = async (page = 1) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands?page=${page}`
      );

      if (!response.ok) throw new Error("Failed to fetch brands");

      const result = await response.json();

      setBrands(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      console.log("Failed to fetch brands",err);
      toast.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const columns = [
    {
      key: "name",
      label: "Brand Name",
      render: (value) => (
        <span className="font-medium text-gray-900">
          {value}
        </span>
      ),
    },
    {
      key: "code",
      label: "Brand Code",
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => (
        <span className="ml-4">
          {value}
        </span>
      )
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "slug",
      label:"Slug"
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold
            ${value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {value?.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <DataTable
        columns={columns}
        data={brands}
        rowKey="id"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getDetailsLink={(row) => `/catalog/brands/form?id=${row.id}`}
      />
    </div>
  );
}
