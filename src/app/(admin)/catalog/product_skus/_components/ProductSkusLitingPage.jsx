import DataTable from "../../../../../../components/shared/DataTable";

export default function ProductSkusListingPage({ productSkusData, currentPage, handlePageChange, totalPages }) {
  const columns = [
    {
      key: "sku_name",
      label: "SKU Name",
    },
    {
      key: "sku_code",
      label: "SKU Code",
    },
    {
      key: "uom",
      label: "UOM",
    },
    {
      key: "mrp",
      label: "MRP",
      render: (value) =>
        value ? `₹${Number(value).toLocaleString("en-IN")}` : "—",
    },
    {
      key: "selling_price",
      label: "Selling Price"
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-semibold ${value === "active"
            ? "bg-green-100 text-green-700"
            : value === "inactive"
              ? "bg-gray-100 text-gray-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={productSkusData}
      rowKey="id"
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      getDetailsLink={(row) =>
        `/catalog/product_skus/${row.id}`
      }
    />
  );
}