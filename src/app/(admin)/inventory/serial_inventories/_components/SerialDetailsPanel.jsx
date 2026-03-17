"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ArrowLeft,ArrowRight, X } from "lucide-react";

const STATUS_STYLES = {
  available:  { dot: "bg-green-500",  badge: "text-green-700 bg-green-100"  },
  delivered:  { dot: "bg-blue-500",   badge: "text-blue-700 bg-blue-100"    },
  reserved:   { dot: "bg-yellow-500", badge: "text-yellow-700 bg-yellow-100"},
  in_transit: { dot: "bg-orange-500", badge: "text-orange-700 bg-orange-100"},
  blocked:    { dot: "bg-red-500",    badge: "text-red-700 bg-red-100"      },
  damaged:    { dot: "bg-rose-500",   badge: "text-rose-700 bg-rose-100"    },
};

const REFERENCE_TYPE_LABEL = {
  GoodsReceivedNote:            "Goods Received Note",
  Shipment:                     "Shipment",
  SkuInternalInventoryTransfer: "SKU Internal Inventory Transfer",
  StockAdjustment:              "Stock Adjustment",
};

function getStatusStyle(status) {
  return STATUS_STYLES[status] ?? { dot: "bg-gray-400", badge: "text-gray-600 bg-gray-100" };
}

function getTimelineLabel(txn) {
  const { new_status, previous_status } = txn.meta;
  const refType = REFERENCE_TYPE_LABEL[txn.ledger?.reference_type] ?? txn.ledger?.reference_type;
  const refNum  = txn.ledger?.reference_number ?? txn.ledger?.reference_id;

  if (!previous_status) return `Stock Added Via ${refType} #${refNum}`;

  const actionMap = {
    available:  "Marked Available",
    delivered:  "Delivered",
    reserved:   "Reserved",
    in_transit: "Moved to In Transit",
    blocked:    "Blocked",
    damaged:    "Marked Damaged",
  };

  const action = actionMap[new_status] ?? `Status changed to ${new_status}`;
  return `${action} Via ${refType} #${refNum}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function SerialDetailsPanelContent({ serialData }) {
  const router = useRouter();
  const { serial_number, status, node_inventory, serial_inventory_transactions } = serialData;
  const product_sku = node_inventory?.product_sku;
  const node        = node_inventory?.node;

  const timeline  = [...(serial_inventory_transactions ?? [])].reverse();
  const latestTxn = serial_inventory_transactions?.[0];
  const currentStyle = getStatusStyle(status);

  return (
    <>
      {/* BACK and TITLE */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <button
          onClick={() => router.push(`/inventory/serial_inventories`)}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition shrink-0 cursor-pointer"
        >
          <ArrowRight size={15} className="text-white" />
        </button>
        <h1 className="text-[14px] font-bold text-gray-800">SKU Item Details</h1>
      </div>

      <div className="px-5 py-5 overflow-y-auto flex-1">

        <hr className="border-gray-100 mb-5" />

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-3 mb-7">

          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">SKU Item No.</p>
            <p className="text-[12px] font-bold text-gray-900 break-all">{serial_number ?? "—"}</p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Current Node</p>
            <p className="text-[12px] font-bold text-gray-900">{node?.name ?? "—"}</p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">SKU Name</p>
            <p className="text-[12px] font-bold text-gray-900">{product_sku?.sku_name ?? "—"}</p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">SKU Code</p>
            <p className="text-[12px] font-bold text-gray-900 font-mono break-all">{product_sku?.sku_code ?? "—"}</p>
          </div>

          {latestTxn && (
            <div className="">
              <p className="text-[10px] text-gray-400 mb-0.5">Latest Inv. Trxn.</p>
              <p className="text-[12px] font-bold text-gray-900">
                {REFERENCE_TYPE_LABEL[latestTxn.ledger?.reference_type] ?? latestTxn.ledger?.reference_type}
                {" – "}
                {latestTxn.ledger?.reference_type}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Status</p>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${currentStyle.badge}`}>
              {status ?? "—"}
            </span>
          </div>

        </div>

        {/* TRACKER */}
        <h2 className="text-[13px] font-bold text-gray-800 mb-4">SKU Item Tracker</h2>

        <div className="relative">
          {timeline.map((txn, index) => {
            const { new_status } = txn.meta;
            const style          = getStatusStyle(new_status);
            const isLast         = index === timeline.length - 1;
            const label          = getTimelineLabel(txn);

            return (
              <div key={`txn-${txn.id}`} className="flex gap-3">
                {/* Dot and line */}
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${style.dot}`} />
                  {!isLast && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[20px]" />}
                </div>

                {/* Content */}
                <div className={`${isLast ? "pb-0" : "pb-5"}`}>
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${style.badge}`}>
                      {new_status?.replace(/_/g, " ") ?? "—"}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(txn.created_at)}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 leading-snug">{label}</p>
                  {node?.name && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{node.name}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}

function SerialDetailsPanel({ serialId, onClose }) {
  const [serialData, setSerialData] = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!serialId) return;
    fetchSerialDetails();
  }, [serialId]);

  const fetchSerialDetails = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/inventory/serial_inventories/${serialId}`;
      const res    = await fetch(url);
      const result = await res.json();
      if (!res.ok || result?.status === "failure")
        throw new Error(result?.errors?.[0] ?? "Something went wrong");
      setSerialData(result?.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch serial details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition z-10"
        >
          <X size={14} className="text-gray-600" />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : serialData ? (
          <SerialDetailsPanelContent serialData={serialData} />
        ) : null}

      </div>
    </>
  );
}

export default function SerialDetailsPage() {
  const params   = useParams();
  const router   = useRouter();
  const serialId = params.serialId;

  return (
    <SerialDetailsPanel
      serialId={serialId}
      onClose={() => router.back()}
    />
  );
}

export { SerialDetailsPanel };