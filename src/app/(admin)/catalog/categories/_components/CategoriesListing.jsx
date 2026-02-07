"use client";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import DataTable from "../../../../../../components/shared/DataTable";
import { errorToast } from "../../../../../../components/ui/toast";

export default function CategoryListing({ tab }) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage(1); // Reset when tab changes
  }, [tab]);

  useEffect(() => {
    fetchData(tab, currentPage);
  }, [tab, currentPage]);

  const fetchData = async (tab, page = 1) => {
    try {
      setLoading(true);

      const baseUrl =
        tab === "parent"
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?subcategories=true`;

      const url = `${baseUrl}&page=${page}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch categories");

      const result = await response.json();

      setData(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      errorToast("Failed to fetch categories");
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

  if (tab !== "parent") {
    columns.push({
      key: "parent",
      label: "Parent",
      render: (value) =>
        value ? (
          <span className="inline-flex px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">
            {value.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    });
  }

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
            `/catalog/categories/form?id=${row.id}&tab=${tab}`
          }
        />
      </div>
    </div>
  );
}


