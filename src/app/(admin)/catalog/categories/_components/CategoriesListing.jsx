"use client";
import { useState, useEffect } from "react";
import { Loader2, SearchIcon } from "lucide-react";
import DataTable from "../../../../../../components/shared/DataTable";
import { toast } from "react-toastify";

export default function CategoryListing({ tab }) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const defaultFilters = {
    starts_with: "",
    status: ""
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [isSearch, setIsSearch] = useState(false);
  const hasActiveFilters = filters.starts_with || filters.status;

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, isSearch]);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page,
        ...(filters.starts_with && { starts_with: filters.starts_with }),
        ...(filters.status && { status: filters.status })
      });

      const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories?categories=true`;

      const url = `${baseUrl}?${query}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch categories");

      const result = await response.json();

      setData(result.data || []);
      setTotalPages(result.meta?.total_pages || 1);

    } catch (err) {
      console.log("Failed to fetch categories", err);
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
        <div className="flex flex-wrap items-end gap-4 mb-5 p-4 bg-white shadow-sm border border-gray-200
 rounded-lg ">

          <div className="flex justify-center items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search product by name..."
              className="border text-gray-600 text-sm border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition px-3 h-9 w-52 rounded-l"
              value={filters.starts_with}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, starts_with: value }));
                if (value.trim() === "") {
                  setIsSearch(!isSearch);
                }
              }
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearch(!isSearch);
                }
              }}
            />
            <span className="h-9 px-2 py-1 rounded-r border bg-blue-500 border-gray-300 focus:border-blue-700 hover:bg-blue-700 cursor-pointer" onClick={() => setIsSearch(!isSearch)} ><SearchIcon color="white" /></span>
          </div>

          {/* Status */}
          <select
            className="border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition px-3 h-9 w-32 rounded"
            value={filters.status}
            onChange={(e) => {
              const value = e.target.value;
              setFilters(prev => ({ ...prev, status: value }));
              if (value === "") setIsSearch(!isSearch);
            }
            }
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {hasActiveFilters && (
            <button className="h-10 px-6 bg-blue-700 text-gray-100 border rounded-md hover:bg-gray-100 hover:text-blue-600 hover:scale-110 cursor-pointer transition-all duration-200 ease-in-out" onClick={() => setIsSearch(!isSearch)}>
              Apply
            </button>
          )}

          <div>
            {hasActiveFilters && (<button className="h-10 px-4 bg-red-700 border text-gray-100 hover:bg-gray-100 hover:text-red-700 rounded cursor-pointer hover:scale-110 transition-all duration-200 ease-in-out" onClick={() => { setFilters(defaultFilters); setIsSearch(!isSearch); }} >
              Clear
            </button>)}
          </div>
        </div>

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


