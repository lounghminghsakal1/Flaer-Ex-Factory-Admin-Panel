import DataTable from "../../../../../../components/shared/DataTable";

export default function NodeInventoryListing({ inventoryData, currentPage, totalPages, setCurrentPage }) {
  const columns = [
    {
      key: "node",
      label: "Node",
      render: (value) => value?.name ?? "—",
    },
    {
      key: "sku_name",
      label: "SKU Name",
      render: (_, row) => row.product_sku?.sku_name ?? "—",
    },
    {
      key: "sku_code",
      label: "SKU Code",
      render: (_, row) => (
        <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
          {row.product_sku?.sku_code ?? "—"}
        </span>
      ),
    },
    {
      key: "tracking_type",
      label: "Tracking",
      render: (_, row) => {
        const type = row.product_sku?.tracking_type;
        const styles = {
          serial: "text-blue-700 bg-blue-100",
          batch: "text-purple-700 bg-purple-100",
          untracked: "text-gray-600 bg-gray-100",
        };
        return (
          <span className={`inline-flex px-2.5 py-1 uppercase rounded-full text-[10px] font-semibold ${styles[type] ?? "text-gray-600 bg-gray-100"}`}>
            {type ?? "—"}
          </span>
        );
      },
    },
    {
      key: "available_quantity",
      label: "Available Qty",
      render: (value) => (
        <span className={`font-semibold ${value > 0 ? "text-green-700" : "text-red-500"}`}>
          {value}
        </span>
      ),
    },
    {
      key: "blocked_quantity",
      label: "Blocked Qty",
      render: (value) => (
        <span className={`font-semibold `}>
          {value}
        </span>
      ),
    },
    {
      key: "in_transit_quantity",
      label: "In Transit Qty",
      render: (value) => (
        <span className={value > 0 ? "text-amber-600 font-medium" : "text-gray-700"}>
          {value}
        </span>
      ),
    },
    {
      key: "total_quantity",
      label: "Total Qty",
      render: (value) => <span className="font-medium">{value}</span>,
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={inventoryData ?? []}
        rowKey="id"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getDetailsLink={(row) => `node_inventories/${row.id}?`}
      />
    </div>
  );
}