import DataTable from "../../../../../components/shared/DataTable";
import { useState } from "react";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const statusStyles = {
  placed: "bg-green-100 text-green-700 border border-green-200",
  partially_delivered: "bg-amber-100 text-amber-700 border border-amber-200",
  delivered: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  confirmed: "bg-blue-100 text-blue-700 border border-blue-200",
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border border-red-200",
};

const sourceStyles = {
  admin: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

export default function OrdersListing({ ordersData, currentPage, totalPages }) {

  const columns = [
    {
      key: "order_number",
      label: "Order Number",
      render: (val) => (
        <span className="font-mono font-semibold text-primary text-[10px]">
          {val}
        </span>
      ),
    },
    {
      key: "customer_name",
      label: "Customer",
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-800">{row?.customer?.name ?? "—"}</span>
          <span className="text-[10px] text-gray-400">{row?.customer?.mobile_number ?? ""}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusStyles[val] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
          {val ?? "—"}
        </span>
      ),
    },
    {
      key: "source_type",
      label: "Source",
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${sourceStyles[val] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
          {val ?? "—"}
        </span>
      ),
    },
    {
      key: "confirmed_at",
      label: "Confirmed At",
      render: (val) => {
        if (!val) return <span className="text-xs text-gray-300">—</span>;
        const d = new Date(val);
        return (
          <div className="flex flex-col w-20">
            <span className="text-xs text-gray-700 font-medium">
              {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-[10px] text-gray-400">
              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      key: "total_amount",
      label: "Item Total",
      render: (_, row) => (
        <span className="text-xs text-gray-700 tabular-nums">{fmt(row?.aggregates?.item_total)}</span>
      ),
    },
    {
      key: "discount_amount",
      label: "Discount",
      render: (_, row) => {
        const val = row?.aggregates?.discount_amount;
        return parseFloat(val) > 0
          ? <span className="text-xs font-medium text-red-500 tabular-nums">- {fmt(val)}</span>
          : <span className="text-xs text-gray-300">—</span>;
      },
    },
    {
      key: "tax_amount",
      label: "Tax",
      render: (_, row) => (
        <div className="flex flex-col w-20">
          <span className="text-xs text-gray-700 tabular-nums">{fmt(row?.aggregates?.tax_amount)}</span>
          {parseFloat(row?.aggregates?.cgst_amount) > 0 && (
            <span className="flex flex-col text-[10px] text-gray-400">
              <span className="flex">CGST {fmt(row?.aggregates?.cgst_amount)}</span>
              <span className="flex">SGST {fmt(row?.aggregates?.sgst_amount)}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "final_amount",
      label: "Final Amount",
      render: (_, row) => (
        <span className="text-xs font-bold text-primary tabular-nums">
          {fmt(row?.aggregates?.final_amount)}
        </span>
      ),
    },
    {
      key: "shipments",
      label: "Shipments",
      render: (_, row) => {
        const shipments = row?.shipments.sort((a, b) => b.id - a.id) || [];
        const [expanded, setExpanded] = useState(false);

        const typePrefix = {
          forward_shipment: { shortName: "FS", color: "text-green-700", cancelledColor: "text-red-700" },
          reverse_shipment: { shortName: "RS", color: "text-orange-700", cancelledColor: "text-red-700" },
          drop_shipment: { shortName: "DS", color: "text-purple-700", cancelledColor: "text-red-700" },
        };

        const statusConfig = {
          created: { label: "created" },
          packed: { label: "packed" },
          invoiced: { label: "invoiced" },
          dispatched: { label: "dispatched" },
          delivered: { label: "delivered" },
          return_initiated: { label: "r.initiated" },
          return_completed: { label: "r.completed" },
        };

        const LIMIT = 3;
        const visible = expanded ? shipments : shipments.slice(0, LIMIT);
        const hasMore = shipments.length > LIMIT;

        if (shipments.length === 0) return <p>—</p>;

        return (
          <div className="flex flex-col gap-[3px]">
            {visible.map((s) => {
              const sc = statusConfig[s.status] ?? { label: s.status };
              const tp = typePrefix[s.shipment_type];
              const colorClass = s.status === "cancelled" ? tp.cancelledColor : tp.color;
              return (
                <div key={s.id} className="flex items-center gap-1 whitespace-nowrap w-fit">
                  <span className={`text-[10px] font-medium ${colorClass}`}>
                    {tp.shortName}-{s.shipment_number}
                  </span>
                  <span className={`text-[10px] font-bold ${colorClass}`}>
                    {sc.label}
                  </span>
                </div>
              );
            })}

            {hasMore && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
                className="text-[10px] text-primary hover:opacity-80 hover:underline font-medium w-fit mt-0.5 cursor-pointer"
              >
                {expanded ? "show less" : `+${shipments.length - LIMIT} more`}
              </button>
            )}
          </div>
        );
      },
    }
  ];

  return (
    <DataTable
      data={ordersData}
      columns={columns}
      rowKey="id"
      currentPage={currentPage}
      totalPages={totalPages}
      getDetailsLink={(row) => `/orders/${row.id}`}
    />
  );
}