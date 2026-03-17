"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Info, ArrowDown } from "lucide-react";
import HeaderWithBack from "../../../../../../components/shared/HeaderWithBack";
import DataTable from "../../../../../../components/shared/DataTable";

const REFERENCE_TYPE_LABEL = {
  GoodsReceivedNote: "Goods Received Note",
  Shipment: "Stock Transfer Order",
  SkuInternalInventoryTransfer: "Sku Internal Inventory Transfer",
  StockAdjustment: "Stock Adjustment",
};

const REFERENCE_TYPE_PREFIX = {
  GoodsReceivedNote: "#FHGRN",
  Shipment: "#FHSTO",
  StockAdjustment: "#FHSA",
};

const ITEMS_PER_PAGE = 10;

function StatCard({ label, value, valueColor = "text-gray-800", showInfo = false }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`text-lg font-bold ${valueColor}`}>{value ?? 0}</span>
      <span className="text-[11px] text-gray-500 flex items-center gap-1">
        {label}
        {showInfo && <Info size={12} className="text-gray-400 cursor-pointer" />}
      </span>
    </div>
  );
}

function SourceDestCell({ source, destination }) {
  if (!source && !destination) return <span className="text-gray-400 text-[12px]">—</span>;
  return (
    <div className="flex flex-col items-start gap-1">
      {source && (
        <span className="px-3 py-1 rounded bg-red-300 text-red-900 text-[11px] font-medium min-w-[140px] text-center">
          {source.name ?? "—"}
        </span>
      )}
      {source && destination && (
        <ArrowDown size={14} className="text-green-600 ml-[60px]" />
      )}
      {destination && (
        <span className="px-3 py-1 rounded bg-green-300 text-green-900 text-[11px] font-medium min-w-[140px] text-center">
          {destination.name ?? "—"}
        </span>
      )}
    </div>
  );
}

export default function NodeDetailsPage() {
  const params = useParams();
  const nodeId = params.nodeId;

  const [nodeData, setNodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchNodeDetails();
  }, []);

  const fetchNodeDetails = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/inventory/node_inventories/${nodeId}`;
      const res = await fetch(url);
      const result = await res.json();
      if (!res.ok || result?.status === "failure")
        throw new Error(result?.errors[0] ?? "Something went wrong");
      setNodeData(result?.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch node details " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="px-4 py-6 text-sm text-gray-500">Loading...</p>;
  if (!nodeData) return null;

  const {
    product_sku,
    node,
    available_quantity,
    blocked_quantity,
    in_transit_quantity,
    total_quantity,
    node_inventory_transactions = [],
  } = nodeData;

  const totalPages = Math.max(1, Math.ceil(node_inventory_transactions.length / ITEMS_PER_PAGE));

  const paginatedTransactions = node_inventory_transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    {
      key: "reference_type",
      label: "Transaction Type",
      render: (_, txn) => {
        const refLabel  = REFERENCE_TYPE_LABEL[txn.reference_type] ?? txn.reference_type;
        const refPrefix = REFERENCE_TYPE_PREFIX[txn.reference_type] ?? "#REF";
        const refCode   = txn.reference_number
          ? `#${txn.reference_number}`
          : `${refPrefix}${String(txn.reference_id).padStart(5, "0")}`;
        return (
          <div>
            <div className="text-[12px] text-gray-600">{refLabel}</div>
            <div className="text-[12px] font-semibold text-blue-600 cursor-pointer hover:underline">{refCode}</div>
          </div>
        );
      },
    },
    {
      key: "prev_total_quantity",
      label: "Prev Qty.",
      render: (value) => <span className="text-[12px] text-gray-700">{value}</span>,
    },
    {
      key: "quantity",
      label: "Adjustment Qty.",
      render: (value, txn) => {
        const isIn = txn.movement_type === "stock_in";
        return (
          <span className={`text-[13px] font-bold ${isIn ? "text-green-600" : "text-red-500"}`}>
            {isIn ? `+${value}` : `-${value}`}
          </span>
        );
      },
    },
    {
      key: "new_total_quantity",
      label: "Current Qty.",
      render: (value) => (
        <span className="text-[12px] text-blue-600 font-medium">{value}</span>
      ),
    },
    {
      key: "source",
      label: "Source → Destination",
      render: (_, txn) => <SourceDestCell source={txn.source} destination={txn.destination} />,
    },
    // {
    //   key: "details",
    //   label: "Details",
    //   render: (value, txn) => {
    //     if (!value) return <span className="text-gray-400 text-[12px]">—</span>;
    //     return (
    //       <div className="flex flex-col gap-1">
    //         {Object.entries(value).map(([k, v]) => (
    //           <div key={`detail-${txn.id}-${k}`} className="text-[11px] text-gray-500">
    //             {k}
    //             <div className="text-[12px] font-semibold text-gray-800">{v ?? "—"}</div>
    //           </div>
    //         ))}
    //       </div>
    //     );
    //   },
    // },
    {
      key: "created_at",
      label: "Time Stamp",
      render: (value) => (
        <span className="text-[12px] text-gray-500 whitespace-nowrap">
          {new Date(value).toLocaleString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: false,
          }).replace(",", "")}
        </span>
      ),
    },
  ];

  return (
    <div className="px-3 py-5">
      <HeaderWithBack title="Node Details" defaultBackPath="/inventory/node_inventories" />

      {/* HEADER STATS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 mb-5 mt-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-0.5 min-w-[160px]">
            <span className="text-[13px] font-bold text-gray-900">{product_sku?.sku_name ?? "—"}</span>
            <span className="text-[11px] text-gray-500">SKU Name</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-gray-900 font-mono">{product_sku?.sku_code ?? "—"}</span>
            <span className="text-[11px] text-gray-500">SKU Code</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-gray-900">{node?.name ?? "—"}</span>
            <span className="text-[11px] text-gray-500">Node Name</span>
          </div>
          <div className="h-10 w-px bg-gray-200 hidden sm:block" />
          <StatCard label="Total Qty."      value={total_quantity}      valueColor="text-blue-600"   />
          <StatCard label="Available Qty."  value={available_quantity}  valueColor="text-green-600"  />
          <StatCard label="Blocked Qty."    value={blocked_quantity}    valueColor="text-gray-500"   showInfo />
          <StatCard label="In Transit Qty." value={in_transit_quantity} valueColor="text-red-500"    showInfo />
          <StatCard label="Damaged Qty."    value={nodeData.damaged_quantity ?? 0} valueColor="text-orange-500" showInfo />
          <StatCard label="Missing Qty."    value={nodeData.missing_quantity ?? 0} valueColor="text-purple-500" showInfo />
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <DataTable
        columns={columns}
        data={paginatedTransactions}
        rowKey="id"
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        hideActionColumn
      />
    </div>
  );
}