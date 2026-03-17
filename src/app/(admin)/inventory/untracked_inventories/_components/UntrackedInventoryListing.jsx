import DataTable from "../../../../../../components/shared/DataTable";

export default function UntrackedInventoryListing({ untrackedData, currentPage, totalPages, setCurrentPage }) {
  const columns = [
    {
      key: "untracked_number",
      label: "Untracked Number",
      render: (value) => (
        <span className="font-mono text-[11px] text-nowrap font-semibold text-gray-800">{value ?? "—"}</span>
      ),
    },
    {
      key: "node_name",
      label: "Node",
      render: (_, row) => row.node_inventory?.node?.name ?? "—",
    },
    {
      key: "sku_name",
      label: "SKU Name",
      render: (_, row) => row.node_inventory?.product_sku?.sku_name ?? "—",
    },
    {
      key: "sku_code",
      label: "SKU Code",
      render: (_, row) => (
        <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
          {row.node_inventory?.product_sku?.sku_code ?? "—"}
        </span>
      ),
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
        data={untrackedData ?? []}
        rowKey="id"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getDetailsLink={(row) => `untracked_inventories/${row.id}?`}
      />
    </div>
  );
}