"use client";

import DataTable from "../../../../../../components/shared/DataTable";
import { useRouter, useSearchParams } from "next/navigation";


export default function CategoriesListing({
  categories,
  currentPage,
  totalPages,
  setCurrentPage
}) {

  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const getReturnTo = () => {
    return encodeURIComponent(searchParams.toString());
  };

  const columns = [
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
          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
            INACTIVE
          </span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      rowKey="id"
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}

      // Pass returnTo so filters and page are preserved
      getDetailsLink={(row) =>
        `/catalog/categories/form?id=${row.id}&returnTo=${getReturnTo()}`
      }
    />
  );
}
