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
      key: "unit_price",
      label: "Unit Price",
      render: (value) =>
        value ? `₹${Number(value).toLocaleString("en-IN")}` : "—",
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
    {
      key: "sku_media",
      label: "Image",
      render: (_, row) => {
        const img = row.sku_media?.[0]?.media_url;
        return img ? (
          <img
            src={img}
            alt="sku"
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          "—"
        );
      },
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