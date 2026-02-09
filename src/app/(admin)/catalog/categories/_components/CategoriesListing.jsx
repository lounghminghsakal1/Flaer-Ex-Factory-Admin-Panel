"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import DataTable from "../../../../../../components/shared/DataTable";
import { toast } from "react-toastify";

export default function CategoryListing({ tab }) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);

      const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true`;

      const url = `${baseUrl}&page=${page}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch categories");

      const result = await response.json();

      setData(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      console.log("Failed to fetch categories",err);
      toast.error("Failed to fetch categories");
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

  let columns = [
    {
      key: "name",
      label: "Category Name",
      render: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      key: "code",
      label: "Category Code",
      render: (value) => (
        <span className="font-mono text-gray-600">{value}</span>
      ),
    },
    {
      key: "slug",
      label: "Slug",
    },
    {
      key: "description",
      label: "Description",
      render: (value) => (
        <span className="max-w-xs truncate block">
          {value?.trim() ? value : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) =>
        value === "active" ? (
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
            INACTIVE
          </span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-full mx-auto">
        <DataTable
          columns={columns}
          data={data}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          getDetailsLink={(row) =>
            `/catalog/categories/form?id=${row.id}`
          }
        />
      </div>
    </div>
  );
}


