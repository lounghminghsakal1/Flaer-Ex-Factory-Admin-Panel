"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Info, ArrowRight, ArrowDown } from "lucide-react";
import HeaderWithBack from "../../../../../../components/shared/HeaderWithBack";

const REFERENCE_TYPE_LABEL = {
  GoodsReceivedNote: "Goods Received Note",
  Shipment: "Stock Transfer Order",
  SkuInternalInventoryTransfer: "Sku Internal Inventory Transfer",
  StockAdjustment: "Stock Adjustment",
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

function SourceDestination({ source, destination }) {
  if (!source && !destination) return <span className="text-gray-400 text-[12px]">—</span>;
  return (
    <div className="flex flex-col items-center gap-1">
      {source && (
        <span className="px-3 py-1 rounded bg-red-200 text-red-800 text-[11px] font-medium whitespace-nowrap">
          {source.name ?? "—"}
        </span>
      )}
      {source && destination && (
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500 shrink-0">
          <ArrowDown size={12} className="text-white" />
        </span>
      )}
      {destination && (
        <span className="px-3 py-1 rounded bg-green-200 text-green-800 text-[11px] font-medium whitespace-nowrap">
          {destination.name ?? "—"}
        </span>
      )}
    </div>
  );
}

function DetailsCell({ txn }) {
  const hasContent = txn.initiated_by || txn.approved_by || txn.direct_grn !== undefined || txn.details;
  if (!hasContent) return <span className="text-gray-400 text-[12px]">—</span>;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {txn.initiated_by && (
        <div className="text-[11px] text-gray-500">
          Initiated
          <div className="text-[12px] font-semibold text-gray-800">{txn.initiated_by}</div>
          {txn.initiated_at && (
            <div className="text-[11px] text-gray-400">
              {new Date(txn.initiated_at).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: false,
              })}
            </div>
          )}
        </div>
      )}
      {txn.approved_by && (
        <div className="text-[11px] text-gray-500">
          Approved
          <div className="text-[12px] font-semibold text-gray-800">{txn.approved_by}</div>
          {txn.approved_at && (
            <div className="text-[11px] text-gray-400">
              {new Date(txn.approved_at).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: false,
              })}
            </div>
          )}
        </div>
      )}
      {txn.direct_grn !== undefined && (
        <div className="text-[11px] text-gray-500">
          Direct GRN
          <div className="text-[12px] font-semibold text-gray-800">
            {txn.direct_grn ? "Yes" : "No"}
          </div>
        </div>
      )}
      {txn.details && Object.entries(txn.details).map(([k, v]) => (
        <div key={`detail-${txn.id}-${k}`} className="text-[11px] text-gray-500">
          {k}
          <div className="text-[12px] font-semibold text-gray-800">{v ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 10) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 6) {
      for (let i = 1; i <= 8; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 5) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 7; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-4 border-t border-gray-200 bg-gray-50/50">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-all ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}
      >
        «
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-all ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}
      >
        ‹
      </button>
      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 text-sm">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-9 h-9 px-3 rounded-lg text-[11px] font-medium transition-all ${currentPage === page ? "bg-primary text-white shadow-md" : "text-gray-700 hover:bg-gray-200"}`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}
      >
        »
      </button>
    </div>
  );
}

function computeQuantities(transactions) {
  if (!transactions?.length) return [];
  const result = new Array(transactions.length);
  let runningQty = 0;
  for (let i = transactions.length - 1; i >= 0; i--) {
    const txn = transactions[i];
    const prevQty = runningQty;
    const currentQty = txn.movement_type === "stock_in"
      ? runningQty + txn.quantity
      : runningQty - txn.quantity;
    result[i] = { ...txn, computed_prev_qty: prevQty, computed_current_qty: currentQty };
    runningQty = currentQty;
  }
  return result;
}

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params.batchId;

  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBatchDetails();
  }, []);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/inventory/batch_inventories/${batchId}`;
      const res = await fetch(url);
      const result = await res.json();
      if (!res.ok || result?.status === "failure")
        throw new Error(result?.errors?.[0] ?? "Something went wrong");
      setBatchData(result?.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch batch details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="px-4 py-6 text-sm text-gray-500">Loading...</p>;
  if (!batchData) return null;

  const {
    batch_code,
    manufacture_date,
    expiry_date,
    available_quantity,
    blocked_quantity,
    in_transit_quantity,
    total_quantity,
    node_inventory,
    batch_inventory_transactions,
  } = batchData;

  const product_sku = node_inventory?.product_sku;
  const node        = node_inventory?.node;

  const transactions = computeQuantities(batch_inventory_transactions);
  const totalPages   = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const startIndex   = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated    = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const HEADERS = [
    "S.No",
    "Transaction Type",
    "Prev Qty.",
    "Adjustment Qty.",
    "Current Qty.",
    "Source → Destination",
    "Details",
    "Time Stamp",
  ];

  return (
    <div className="px-2 py-4">
      <HeaderWithBack title="Batch Inventory Details" defaultBackPath="/inventory/batch_inventories" />

      {/* HEADER STATS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 my-5">
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
            <span className="text-[13px] font-bold text-gray-900">{batch_code ?? "—"}</span>
            <span className="text-[11px] text-gray-500">Batch Code</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-gray-900">{manufacture_date ?? "—"}</span>
            <span className="text-[11px] text-gray-500">Mfg. Date</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {expiry_date ? (
              <span className={`text-[13px] font-bold ${new Date(expiry_date) < new Date() ? "text-red-500" : "text-gray-900"}`}>
                {expiry_date}
              </span>
            ) : (
              <span className="text-[13px] font-bold text-gray-900">—</span>
            )}
            <span className="text-[11px] text-gray-500">Expiry Date</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-gray-900">{node?.name ?? "—"}</span>
            <span className="text-[11px] text-gray-500">Node</span>
          </div>
          <div className="h-10 w-px bg-gray-200 hidden sm:block" />
          <StatCard label="Total Qty."      value={total_quantity}      valueColor="text-blue-600"   />
          <StatCard label="Available Qty."  value={available_quantity}  valueColor="text-green-600"  />
          <StatCard label="Blocked Qty."    value={blocked_quantity}    valueColor="text-gray-500"   showInfo />
          <StatCard label="In Transit Qty." value={in_transit_quantity} valueColor="text-red-500"    showInfo />
          <StatCard label="Damaged Qty."    value={batchData.damaged_quantity ?? 0} valueColor="text-orange-500" showInfo />
          <StatCard label="Missing Qty."    value={batchData.missing_quantity ?? 0} valueColor="text-purple-500" showInfo />
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50 border-b border-blue-100">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {!paginated.length ? (
                <tr>
                  <td colSpan={HEADERS.length} className="px-5 py-10 text-center text-sm text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginated.map((txn, index) => {
                  const isIn      = txn.movement_type === "stock_in";
                  const refLabel  = REFERENCE_TYPE_LABEL[txn.reference_type] ?? txn.reference_type;
                  const formatted = new Date(txn.created_at).toLocaleString("en-IN", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: false,
                  }).replace(",", "");

                  return (
                    <tr key={`txn-${txn.id}`} className="hover:bg-blue-50/30 border-b border-gray-300 transition-colors">

                      {/* S.No */}
                      <td className="px-5 py-4 text-[12px] font-medium text-gray-800 align-top">
                        {startIndex + index + 1}
                      </td>

                      {/* Transaction Type */}
                      <td className="px-5 py-4 align-top">
                        <div className="text-[12px] text-gray-600 mb-1">{refLabel}</div>
                        <div className="text-[12px] font-semibold text-blue-600 cursor-pointer hover:underline">
                          {txn.reference_number ?? txn.reference_id}
                        </div>
                        {txn.from_sku && txn.to_sku && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2.5 py-0.5 rounded bg-red-200 text-red-800 text-[11px] font-medium">
                              {txn.from_sku}
                            </span>
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shrink-0">
                              <ArrowRight size={10} className="text-white" />
                            </span>
                            <span className="px-2.5 py-0.5 rounded bg-green-200 text-green-800 text-[11px] font-medium">
                              {txn.to_sku}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Prev Qty */}
                      <td className="px-5 py-4 text-[12px] text-gray-700 align-top">
                        {txn.computed_prev_qty}
                      </td>

                      {/* Adjustment Qty */}
                      <td className="px-5 py-4 align-top">
                        <span className={`text-[13px] font-bold ${isIn ? "text-green-600" : "text-red-500"}`}>
                          {isIn ? `+${txn.quantity}` : `-${txn.quantity}`}
                        </span>
                      </td>

                      {/* Current Qty */}
                      <td className="px-5 py-4 align-top">
                        <span className="text-[12px] text-blue-600 font-medium">
                          {txn.computed_current_qty}
                        </span>
                      </td>

                      {/* Source -> Destination */}
                      <td className="px-5 py-1 align-top">
                        <SourceDestination source={txn.source} destination={txn.destination} />
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 align-top">
                        <DetailsCell txn={txn} />
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-4 text-[12px] text-gray-500 whitespace-nowrap align-top">
                        {formatted}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}