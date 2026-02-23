import DataTable from "../../../../../components/shared/DataTable";
import { useSearchParams } from "next/navigation";

export default function PurchaseOrdersLiting({ data, currentPage, totalPages, handlePageChange }) {
  const columns = [
    {
      key: "purchase_order_number",
      label: "PO No",
    },
    {
      key: "total_units",
      label: "Total Units",
    },
    {
      key: "total_price",
      label: "Total Price",
      render: (value) => `₹ ${Number(value).toLocaleString()}`
    },
    {
      key: "final_amount",
      label: "Final Amount",
      render: (value) => `₹ ${Number(value).toLocaleString()}`
    },
    {
      key: "vendor",
      label: "Vendor Name",
      render: (_, row) => row.vendor?.firm_name || "—"
    },
    {
      key: "expiry_date",
      label: "Expiry Date",
      render: (value) => value || "—"
    },
    {
      key: "delivery_date",
      label: "Delivery Date",
      render: (value) => value || "—"
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const statusColors = {
          created: "text-gray-600",
          "waiting for approval": "text-yellow-600",
          approved: "text-blue-600",
          completed: "text-green-600",
          rejected: "text-red-600",
          cancelled: "text-red-500"
        };

        return (
          <span className={`font-semibold capitalize ${statusColors[value] || "text-gray-600"}`}>
            {value}
          </span>
        );
      }
    }
  ];

  const searchParams = useSearchParams();
  const getReturnTo = () => encodeURIComponent(searchParams.toString());

  return (
    <DataTable
      columns={columns}
      data={data || []}
      currentPage={currentPage || 1}
      totalPages={totalPages || 1}
      getDetailsLink={(row) => `/purchase_orders/${row.id}?returnTo=${getReturnTo()}`}
      onPageChange={handlePageChange}
    />
  );
}