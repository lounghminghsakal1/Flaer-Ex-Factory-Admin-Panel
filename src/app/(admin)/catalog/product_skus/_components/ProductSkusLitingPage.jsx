import DataTable from "../../../../../../components/shared/DataTable";

export default function ProductSkusListingPage({ productSkusData, currentPage, setCurrentPage, totalPages }) {
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
          className={`px-2 py-1 rounded text-[11px] font-medium ${value === "active"
            ? "bg-green-50 text-green-600"
            : value === "inactive"
              ? "bg-yellow-50 text-yellow-600"
              : "bg-red-50 text-red-600"
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
      onPageChange={setCurrentPage}
      getDetailsLink={(row) =>
        `/product_skus/${row.id}`
      }
    />
  );
}