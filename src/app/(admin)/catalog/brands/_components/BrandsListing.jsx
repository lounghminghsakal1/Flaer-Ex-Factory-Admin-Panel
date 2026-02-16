"use client";

import DataTable from "../../../../../../components/shared/DataTable";

export default function BrandsListing({
  brands,
  currentPage,
  totalPages,
  setCurrentPage
}) {

  const getReturnTo = () => {
    if (typeof window === "undefined") return "";
    return encodeURIComponent(window.location.search.replace("?", ""));
  };

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
    { key: "code", label: "Brand Code" },
    { key: "priority", label: "Priority" },
    { key: "description", label: "Description" },
    { key: "slug", label: "Slug" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold
          ${value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
            }`}
        >
          {value?.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={brands}
      rowKey="id"
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}

      // ⭐ FIX HERE
      getDetailsLink={(row) =>
        `/catalog/brands/form?id=${row.id}&returnTo=${getReturnTo()}`
      }
    />
  );
}
