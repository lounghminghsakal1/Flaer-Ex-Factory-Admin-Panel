"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2, ArrowLeft, ArrowRight, Pencil, Info, Plus, Check,
  ChevronDown, Search, X, CheckCircle2, AlertCircle,
  Layers, Sparkles, Package, Save, MoreVertical,
  BaggageClaimIcon,
  PackageCheckIcon,
  FormIcon,
  ExternalLink,
  Dices,
  SendIcon,
  EditIcon,
  Eye,
  Edit2,
  RotateCcwSquare
} from "lucide-react";
import { toast } from "react-toastify";
import ShipmentTrackerBar from "./ShipmentTrackerBar";
import ReturnShipment from "./ReturnShipment";
import ShipmentCancelModal from "./ShipmentCancelModal";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const TRACKER_STEPS = [
  { step: 1, label: "Created", position: "top" },
  { step: 2, label: "Assign Allocation", position: "bottom" },
  { step: 3, label: "Packed", position: "top" },
  { step: 4, label: "Invoiced", position: "bottom" },
  { step: 5, label: "Dispatched", position: "top" },
  { step: 6, label: "Delivered", position: "bottom" },
];

const STATUS_STEP_MAP = {
  created: 1,
  packed: 3,
  invoiced: 4,
  dispatched: 5,
  delivered: 6,
};


const getCurrentStep = (shipment) => {
  const statusStep = STATUS_STEP_MAP[shipment?.status] ?? 1;
  if (statusStep === 1 && shipment?.fully_allocated) return 2;
  return statusStep;
};

const SELECTION_TYPES = ["fifo", "lifo", "fefo", "manual"];

// ── Return status set — statuses where the forward shipment tracker is irrelevant ──
const RETURN_STATUSES = new Set([
  "return_initiated",
  "return_processing",
  "return_received",
  "return_completed",
]);

export default function ShipmentDetail({ shipmentId, onBack }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [shippableItems, setShippableItems] = useState([]);
  const [updating, setUpdating] = useState(false);

  const [selectionTypes, setSelectionTypes] = useState({});
  const [manualBatches, setManualBatches] = useState({});
  const [manualSerials, setManualSerials] = useState({});
  const [manualUntracked, setManualUntracked] = useState({});

  const [changeTypePanel, setChangeTypePanel] = useState(null);
  const [batchModal, setBatchModal] = useState(null);
  const [serialModal, setSerialModal] = useState(null);
  const [untrackedModal, setUntrackedModal] = useState(null);
  const [unassignedPopup, setUnassignedPopup] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [openOptions, setOpenOptions] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [packing, setPacking] = useState(false);
  const [sendingToGetInvoice, setSendingToGetInvoice] = useState(false);
  const [sendingToDispatch, setSendingToDispatch] = useState(false);
  const [delivering, setDelivering] = useState(false);
  // Controls whether the ReturnShipment panel is expanded below the main content
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [expandedChildId, setExpandedChildId] = useState(null);

  const [cancelShipmentModalOpen, setCancelShipmentModalOpen] = useState(false);
  const [rejection_reason, setRejection_reason] = useState("");

  const fetchShipment = async (preserveSelectionTypes = false, shipmentID = shipmentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentID}`);
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load shipment");
      const data = json.data;
      setShipment(data);
      setSelectionTypes((prev) => {
        const next = { ...prev };
        (data.line_items ?? []).forEach((li) => {
          if (!preserveSelectionTypes || !(li.id in next)) {
            next[li.id] = li.product_sku?.selection_type ?? "fifo";
          }
        });
        return next;
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipmentForRefresh = async (shipmentID) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentID}`);
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load shipment");
      const data = json.data;
      setShipment(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipment(); }, [shipmentId]);

  useEffect(() => {
    if (shipment?.child_shipments?.length) {
      const latest = [...shipment.child_shipments].sort((a, b) => b.id - a.id)[0];
      setExpandedChildId(latest.id);
    }
  }, [shipment?.id]);

  const enterEdit = async () => {
    try {
      const orderId = shipment?.order?.id;
      if (orderId) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/shippable_line_items?order_id=${orderId}`);
        const json = await res.json();
        if (json.status !== "failure") setShippableItems(json.data ?? []);
      }
    } catch (err) { }
    setEditRows(
      (shipment?.line_items ?? []).map((li) => ({
        id: li.id,
        order_line_item_id: li.order_line_item?.id,
        sku_name: li.product_sku?.sku_name,
        sku_code: li.product_sku?.sku_code,
        quantity: String(li.quantity ?? 1),
        isNew: false,
      }))
    );
    setEditMode(true);
  };

  const cancelEdit = () => { setEditMode(false); setEditRows([]); };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if (editRows.length === 0) throw new Error("Add atleast one line item");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment: {
            order_id: shipment?.order?.id,
            node_id: shipment?.node?.id,
            shipment_type: shipment?.shipment_type,
            line_items: editRows.map((r) => ({
              ...(r.isNew ? {} : { id: r.id }),
              order_line_item_id: r.order_line_item_id,
              quantity: Math.max(1, parseInt(r.quantity) || 1),
            })),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Update failed");
      toast.success("Shipment updated!");
      setEditMode(false);
      await fetchShipment(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectionTypeSave = (lineItemId, newType) => {
    setSelectionTypes((prev) => ({ ...prev, [lineItemId]: newType }));
    setChangeTypePanel(null);
    toast.success("Selection type updated.");
  };

  const handleAssignAllocations = async () => {
    const lineItems = shipment?.line_items ?? [];
    const unassigned = [];

    lineItems.forEach((li) => {
      const sType = selectionTypes[li.id] ?? "fifo";
      if (sType === "manual") {
        const trackingType = li.product_sku?.tracking_type ?? "untracked";
        if (trackingType === "batch" && !(manualBatches[li.id]?.length)) {
          unassigned.push(`${li.product_sku?.sku_name} — batch not assigned`);
        } else if (trackingType === "serial" && !(manualSerials[li.id]?.length)) {
          unassigned.push(`${li.product_sku?.sku_name} — serials not assigned`);
        } else if (trackingType === "untracked" && !(manualUntracked[li.id]?.length)) {
          unassigned.push(`${li.product_sku?.sku_name} — untracked numbers not assigned`);
        }
      }
    });

    if (unassigned.length) {
      setUnassignedPopup(unassigned);
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        line_items: lineItems.map((li) => {
          const sType = selectionTypes[li.id] ?? "fifo";
          const trackingType = li.product_sku?.tracking_type ?? "untracked";
          const item = { shipment_line_item_id: li.id, selection_type: sType };
          if (sType === "manual") {
            if (trackingType === "batch") item.batch_codes = (manualBatches[li.id] ?? []).map((b) => ({ batch_code: b.batch_code, quantity: Number(b.quantity) }));
            else if (trackingType === "serial") item.serials = (manualSerials[li.id] ?? []);
            else if (trackingType === "untracked") item.untracked_numbers = (manualUntracked[li.id] ?? []).map((u) => ({ untracked_number: u.untracked_number, quantity: Number(u.quantity) }));
          }
          return item;
        }),
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/allocations/assign_allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Assignment failed");
      toast.success("Allocations assigned successfully!");
      await fetchShipment(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleProceedToPacking = async () => {
    try {
      setPacking(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/pack`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      toast.success("Shipment proceeded to packing");
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to proceed shipment to packing " + err.message);
    } finally {
      setPacking(false);
    }
  };

  const handleProceedToInvoice = async () => {
    try {
      setSendingToGetInvoice(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/invoice`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Shipment proceeded for invoice");
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to proceed shipment to invoice " + err.message);
    } finally {
      setSendingToGetInvoice(false);
    }
  };

  const handleProceedToDispatch = async () => {
    try {
      setSendingToDispatch(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/mark_dispatched`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Shipment marked as dispatched successfully");
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to mark shipment as dispatched " + err.message);
    } finally {
      setSendingToDispatch(false);
    }
  };

  const handleDelivering = async () => {
    try {
      setDelivering(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/deliver`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Shipment marked as delivered successfully");
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to mark shipment as delivered " + err.message);
    } finally {
      setDelivering(false);
    }
  };

  const canDoReturnShipment = () => {
    if (shipment) {
      const hasUnfinished = shipment?.child_shipments.some(childShipment => childShipment.status === "return_initiated");
      if (hasUnfinished) return false;
      return true;
    }
  }

  const handleCancelShipment = async () => {
    try {
      setIsCancelling(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/cancel?cancellation_reason=${rejection_reason}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      toast.success("Shipment cancelled successfully");
      await fetchShipment();
    } catch(err) {
      console.log(err);
      toast.error("Failed to cancel shipment "+err.message); 
    } finally {
      setIsCancelling(false);
    }
  }

  const lineItems = shipment?.line_items ?? [];
  const agg = shipment?.aggregates ?? {};

  // ── Derived flags ────────────────────────────────────────────────────────────
  // True when this shipment IS the return shipment (opened directly, not via the "Return Shipment" button)
  const isReturnShipment = shipment && RETURN_STATUSES.has(shipment.status);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs text-gray-400">Loading shipment...</p>
      </div>
    );
  }

  if (!shipment) return null;

  // CASE A: This shipment IS a return shipment (status is one of the return statuses).
  // We skip the normal forward shipment UI entirely and render only the return view
  if (isReturnShipment) {
    return (
      <div className="flex flex-col gap-4" onClick={() => setOpenOptions(false)}>
        {/* Back button bar */}
        {/* <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="flex-1 text-sm font-bold text-primary capitalize">
              Return Shipment
            </h2>
          </div>
        </div> */}

        {/* ReturnShipment component handles its own 4-step tracker + line items */}
        <ReturnShipment
          shipment={null}
          return_shipment_id={shipment.id}
          onCancel={onBack}
          onSuccess={() => fetchShipment()}
          backRoute={onBack}
        />
      </div>
    );
  }

  // CASE B: Normal forward shipment. Show full detail with optional return panel
  return (
    <div className="flex flex-col gap-4" onClick={() => setOpenOptions(false)}>

      {/* ── Top Bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <h2 className="flex-1 text-sm font-bold text-primary text-center capitalize">
            {shipment.shipment_type?.replace(/_/g, " ")}
          </h2>
        </div>

        <ShipmentTrackerBar currShipment={shipment} />
      </div>

      {/* ── Line Items ── */}
      <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm">

        {/* Options kebab menu — only for statuses that have actions */}
        {(shipment?.status === "created" || shipment?.status === "delivered") && (
          <div className="absolute top-3 right-3">
            <div
              className="cursor-pointer p-1 rounded-md hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setOpenOptions((prev) => !prev);
              }}
            >
              <MoreVertical size={16} />
            </div>

            {openOptions && (
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-white rounded-md shadow-lg border border-gray-100 p-1 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Edit — only for created */}
                {!editMode && shipment?.status === "created" && (
                  <div
                    role="button"
                    onClick={() => {
                      setOpenOptions(false);
                      enterEdit();
                    }}
                    className="flex items-center gap-2.5 px-2.5 rounded-md py-2 border-b border-gray-200 text-xs text-gray-700 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Shipment
                  </div>
                )}

                {/* Cancel — only for created */}
                {shipment?.status === "created" && (
                  <div
                    role="button"
                    onClick={() => {
                      setOpenOptions(false);
                      // TODO: hook up actual cancel API
                      setCancelShipmentModalOpen(prev => !prev);
                    }}
                    className="flex items-center gap-2.5 px-2.5 rounded-md py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {isCancelling ? "Cancelling..." : "Cancel Shipment"}
                  </div>
                )}

                {/* Return Shipment — only for delivered */}
                {shipment?.status === "delivered" && (
                  <div
                    role="button"
                    onClick={() => {
                      if (!canDoReturnShipment()) {
                        toast.error("Finish existing return shipments first ");
                        return;
                      };
                      setOpenOptions(false);
                      setShowReturnPanel((prev) => !prev);
                    }}
                    className="flex items-center gap-2.5 px-2.5 rounded-md py-2 text-xs text-cyan-700 hover:bg-cyan-50 cursor-pointer transition-colors"
                  >
                    <RotateCcwSquare className="w-3.5 h-3.5" />
                    {showReturnPanel ? "Hide Return Panel" : "Return Shipment"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* href={shipment?.shipment_packing_slip} target="_blank" rel="noopener noreferrer" className="flex gap-1 text-primary font-semibold text-xs" */}
        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-gray-100 divide-x divide-gray-100">
          <MetaCell label="Shipment Number" value={<span className="font-bold text-gray-800">{shipment.shipment_number}</span>} />
          <MetaCell label="Status" value={<StatusBadge status={shipment.status} />} />
          <MetaCell label="Shipment packing slip" value={<span className="gap-1">{shipment?.shipment_packing_slip ? (<a href={shipment?.shipment_packing_slip} target="_blank" rel="noopener noreferrer" className="flex gap-1 text-primary font-semibold text-xs"><ExternalLink size={14} /> Download</a>) : (<p>—</p>)}</span>} />
          <MetaCell label="Invoice" value={<span className="flex flex-col gap-1"><span>{shipment.invoices?.length ? shipment.invoices[0].invoice_number : "—"}</span>{shipment?.invoices?.[0]?.invoice_url && (<a href={shipment?.invoices[0]?.invoice_url} target="_blank" rel="noopener noreferrer" className="flex gap-1 text-primary font-semibold text-xs"><ExternalLink size={14} /> Download</a>)}</span>} />
          <MetaCell label="Node" value={<span className="font-semibold text-gray-800">{shipment.node?.name ?? "—"}</span>} />
          <MetaCell label="Mark Dispatch Details" value={shipment.dispatched_at ? fmtDate(shipment.dispatched_at) : "—"} />
          <MetaCell label="Mark Delivered Details" value={shipment.delivered_at ? fmtDate(shipment.delivered_at) : "—"} />
          <MetaCell label="Final Amount" value={<span className="font-bold text-gray-800">{fmt(agg.final_amount)}</span>} />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-primary">Shipment Line Items</h3>
          {editMode ? (
            <div className="flex items-center gap-2">
              <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Update
              </button>
            </div>
          ) : (
            <>
              {(shipment?.status === "created" && !shipment?.fully_allocated) ? (
                <button
                  onClick={handleAssignAllocations}
                  disabled={assigning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BaggageClaimIcon className="w-3.5 h-3.5" />}
                  Assign Allocations
                </button>
              ) : shipment?.status === "created" ? (
                <button
                  onClick={handleProceedToPacking}
                  disabled={packing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-amber-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {packing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheckIcon className="w-3.5 h-3.5" />}
                  Proceed to packing
                </button>
              ) : shipment?.status === "packed" ? (
                <button
                  onClick={handleProceedToInvoice}
                  disabled={sendingToGetInvoice}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-purple-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {sendingToGetInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FormIcon className="w-3.5 h-3.5" />}
                  Get Invoice
                </button>
              ) : shipment?.status === "invoiced" ? (
                <button
                  onClick={handleProceedToDispatch}
                  disabled={sendingToDispatch}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-sky-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {sendingToDispatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Dices className="w-3.5 h-3.5" />}
                  Mark as Dispatched
                </button>
              ) : shipment?.status === "dispatched" ? (
                <button
                  onClick={handleDelivering}
                  disabled={delivering}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {delivering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendIcon className="w-3.5 h-3.5" />}
                  Mark as Delivered
                </button>
              ) : ""}
            </>
          )}
        </div>

        <div className="overflow-visible">
          <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: editMode ? "22%" : "24%" }} />
              <col style={{ width: editMode ? "10%" : "7%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: editMode ? "16%" : "16%" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["SKU Name", "Quantity", "MRP", "Selling Price", "Discount Amt.", "Tax Amt.", "Total Amt.", "Final Amt.", "Batch/Serial"].map((col) => (
                  <th key={col} className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(editMode ? editRows.filter((r) => !r.isNew) : lineItems).map((row) => {
                const li = editMode
                  ? lineItems.find((l) => l.id === row.id) ?? {}
                  : row;
                const sType = selectionTypes[li.id] ?? "fifo";
                const trackingType = li.product_sku?.tracking_type ?? "untracked";
                const isManual = sType === "manual";
                const hasBatches = manualBatches[li.id]?.length > 0;
                const hasSerials = manualSerials[li.id]?.length > 0;
                const hasUntracked = manualUntracked[li.id]?.length > 0;
                const isAssigned = shipment?.fully_allocated ? true : isManual ? (hasBatches || hasSerials || hasUntracked) : true;
                const rowId = editMode ? (row.id ?? row.tempId) : li.id;

                return (
                  <tr key={rowId} className="hover:bg-gray-50/50 transition-colors align-top">
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-gray-800 leading-snug break-words whitespace-normal">{li.product_sku?.sku_name ?? row.sku_name ?? "—"}</span>
                        <span className="text-[10px] text-gray-400 font-mono truncate">{li.product_sku?.sku_code ?? row.sku_code}</span>
                        {(li.line_item_type ?? row.line_item_type) === "bundle" && (
                          <span className="inline-flex items-center gap-0.5 w-fit px-1 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            <Layers className="w-2 h-2" />Bundle
                          </span>
                        )}
                        {(li.line_item_type ?? row.line_item_type) === "loose" && (
                          <span className="inline-flex items-center gap-0.5 w-fit px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <Sparkles className="w-2 h-2" />Loose
                          </span>
                        )}
                        {editMode && (
                          <button
                            onClick={() => setEditRows((prev) => prev.filter((r) => r.id !== row.id))}
                            className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors w-fit cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 tabular-nums">
                      {editMode ? (
                        <input
                          type="number" min={1}
                          value={row.quantity}
                          onChange={(e) => {
                            setEditRows((prev) => prev.map((r) => r.id === row.id
                              ? { ...r, quantity: e.target.value }
                              : r));
                          }}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value);
                            if (isNaN(v) || v < 1) {
                              const original = lineItems.find((l) => l.id === row.id);
                              setEditRows((prev) => prev.map((r) => r.id === row.id
                                ? { ...r, quantity: String(original?.quantity ?? 1) }
                                : r));
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center"
                        />
                      ) : (
                        <span className="text-xs text-gray-700">{li.quantity}</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.mrp)}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.selling_price)}</td>
                    <td className="px-3 py-3 text-xs tabular-nums">
                      {parseFloat(li.discount_amount) > 0
                        ? <span className="text-red-500">-{fmt(li.discount_amount)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.tax_amount)}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.total_amount)}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-primary tabular-nums">{fmt(li.final_amount)}</td>

                    <td className="px-3 py-3">
                      <div className={`flex flex-col gap-1 ${editMode ? "opacity-40 pointer-events-none select-none" : ""}`}>
                        <div className="flex items-center gap-1">
                          {!isAssigned
                            ? <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                          <span className="text-[10px] text-gray-600 font-medium capitalize truncate">
                            {trackingType} – {sType.toUpperCase()}
                          </span>
                          {shipment.status === "created" && (
                            <button
                              onClick={() => setChangeTypePanel(li)}
                              className="ml-auto text-gray-400 hover:text-primary transition-colors shrink-0 cursor-pointer"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {isManual && (
                          <div className="flex flex-col gap-0.5">
                            {trackingType === "batch" && (
                              <button onClick={() => setBatchModal(li)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                                {(shipment?.fully_allocated && shipment?.status === "created") ? <><EditIcon className="w-3 h-3" /> View/Edit Batches</> : shipment?.status !== "created" ? <><Eye className="w-3 h-3" /> View Batches</> : <>{hasBatches ? <span className="flex gap-1"><Edit2 className="w-2.5 h-2.5" />Edit Batches</span> : <span className="flex gap-1"><Plus className="w-2.5 h-2.5" />Add Batch</span>} </>}
                              </button>
                            )}
                            {trackingType === "serial" && (
                              <button onClick={() => setSerialModal(li)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                                {(shipment?.fully_allocated && shipment?.status === "created") ? <><EditIcon className="w-3 h-3" /> View/Edit Serials</> : shipment?.status !== "created" ? <><Eye className="w-3 h-3" /> View Serials</> : <>{hasSerials ? <span className="flex gap-1"><Edit2 className="w-2.5 h-2.5" />Edit Serials</span> : <span className="flex gap-1"><Plus className="w-2.5 h-2.5" />Add Serials</span>} </>}
                              </button>
                            )}
                            {trackingType === "untracked" && (
                              <button onClick={() => setUntrackedModal(li)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                                {(shipment?.fully_allocated && shipment?.status === "created") ? <><EditIcon className="w-3 h-3" /> View/Edit Untracked</> : shipment?.status !== "created" ? <><Eye className="w-3 h-3" /> View Untracked</> : <>{hasUntracked ? <span className="flex gap-1"><Edit2 className="w-2.5 h-2.5" />Edit Untracked</span> : <span className="flex gap-1"><Plus className="w-2.5 h-2.5" />Add Untracked</span>} </>}
                              </button>
                            )}
                          </div>
                        )}
                        {hasBatches && <span className="text-[9px] text-gray-400">{manualBatches[li.id].length} batch(es)</span>}
                        {hasSerials && <span className="text-[9px] text-gray-400">{manualSerials[li.id].length} serial(s)</span>}
                        {hasUntracked && <span className="text-[9px] text-gray-400">{manualUntracked[li.id].length} untracked</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {editMode && editRows.filter((r) => r.isNew).map((row) => {
                const takenIds = editRows
                  .filter((r) => r.tempId !== row.tempId)
                  .map((r) => String(r.order_line_item_id));
                const availableOptions = shippableItems.filter(
                  (si) => !takenIds.includes(String(si.oli_id))
                );
                return (
                  <tr key={row.tempId} className="bg-blue-50/30 align-middle">
                    <td className="px-3 py-3">
                      <InlineDropdown
                        placeholder="Select SKU…"
                        options={availableOptions}
                        value={row.order_line_item_id ?? null}
                        onChange={(val) => {
                          const item = shippableItems.find((i) => i.oli_id === val);
                          setEditRows((prev) => prev.map((r) => r.tempId === row.tempId
                            ? {
                              ...r,
                              order_line_item_id: item?.oli_id,
                              sku_name: item?.sku_name,
                              sku_code: item?.sku_code,
                              mrp: item?.mrp,
                              selling_price: item?.selling_price,
                              discount_amount: item?.discount_amount,
                              tax_amount: item?.tax_amount,
                              total_amount: item?.total_amount,
                              final_amount: item?.final_amount,
                            }
                            : r));
                        }}
                        valueKey="oli_id"
                        labelKey="sku_name"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number" min={1}
                        value={row.quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setEditRows((prev) => prev.map((r) => r.tempId === row.tempId
                            ? { ...r, quantity: isNaN(v) || v < 1 ? "" : v }
                            : r));
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.mrp ? fmt(row.mrp) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.selling_price ? fmt(row.selling_price) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs tabular-nums">
                      {parseFloat(row.discount_amount) > 0
                        ? <span className="text-red-500">-{fmt(row.discount_amount)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.tax_amount ? fmt(row.tax_amount) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.total_amount ? fmt(row.total_amount) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-primary tabular-nums">{row.final_amount ? fmt(row.final_amount) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setEditRows((prev) => prev.filter((r) => r.tempId !== row.tempId))}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {editMode && (() => {
                const takenIds = editRows.map((r) => String(r.order_line_item_id));
                const available = shippableItems.filter((si) => !takenIds.includes(String(si.oli_id)));
                if (!available.length) return null;
                return (
                  <tr>
                    <td colSpan={9} className="px-3 py-2.5">
                      <button
                        onClick={() => {
                          setEditRows((prev) => [...prev, {
                            tempId: Date.now(),
                            order_line_item_id: null,
                            sku_name: null,
                            sku_code: null,
                            quantity: 1,
                            isNew: true,
                          }]);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />Add another Item
                      </button>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Child Shipments Accordion ── */}
      {(shipment?.child_shipments ?? []).length > 0 && (
        <ChildShipmentsAccordion
          childShipments={shipment.child_shipments}
          expandedChildId={expandedChildId}
          onToggle={(id) => setExpandedChildId((prev) => (prev === id ? null : id))}
          parentShipment={shipment}
          onRefresh = {() => fetchShipmentForRefresh(shipmentId)}
        />
      )}

      {/* ── Return Shipment Panel (shown inline below when triggered from delivered shipment) ── */}
      {showReturnPanel && (
        <ReturnShipment
          shipment={shipment}
          return_shipment_id={null}
          onCancel={() => setShowReturnPanel(false)}
          onSuccess={() => {
            fetchShipmentForRefresh(shipmentId);
            // Keep panel open so user can see the return_completed state
          }}
          setShowReturnPanel={setShowReturnPanel}
          fromChild={true}
        />
      )}

      {/* ── Change Selection Type Panel ── */}
      {changeTypePanel && (
        <ChangeSelectionTypePanel
          lineItem={changeTypePanel}
          currentType={selectionTypes[changeTypePanel.id] ?? "fifo"}
          onClose={() => setChangeTypePanel(null)}
          onSave={handleSelectionTypeSave}
        />
      )}

      {/* ── Batch Modal ── */}
      {batchModal && (
        <BatchEntryModal
          isOpen={!!batchModal}
          onClose={() => setBatchModal(null)}
          shipmentId={shipmentId}
          lineItem={batchModal}
          totalQty={batchModal.quantity}
          savedData={manualBatches[batchModal.id] ?? []}
          onSave={(rows) => {
            setManualBatches((prev) => ({ ...prev, [batchModal.id]: rows }));
            setBatchModal(null);
          }}
          shipment={shipment}
        />
      )}

      {/* ── Serial Modal ── */}
      {serialModal && (
        <SerialEntryModal
          isOpen={!!serialModal}
          onClose={() => setSerialModal(null)}
          shipmentId={shipmentId}
          lineItem={serialModal}
          totalQty={serialModal.quantity}
          savedData={manualSerials[serialModal.id] ?? []}
          onSave={(serials) => {
            setManualSerials((prev) => ({ ...prev, [serialModal.id]: serials }));
            setSerialModal(null);
          }}
          shipment={shipment}
        />
      )}

      {/* ── Untracked Modal ── */}
      {untrackedModal && (
        <UntrackedEntryModal
          isOpen={!!untrackedModal}
          onClose={() => setUntrackedModal(null)}
          shipmentId={shipmentId}
          lineItem={untrackedModal}
          totalQty={untrackedModal.quantity}
          savedData={manualUntracked[untrackedModal.id] ?? []}
          onSave={(rows) => {
            setManualUntracked((prev) => ({ ...prev, [untrackedModal.id]: rows }));
            setUntrackedModal(null);
          }}
          shipment={shipment}
        />
      )}

      {/* ── Unassigned Popup ── */}
      {unassignedPopup && (
        <UnassignedPopup items={unassignedPopup} onClose={() => setUnassignedPopup(null)} />
      )}

      {cancelShipmentModalOpen && (
        <ShipmentCancelModal isOpen={cancelShipmentModalOpen} onClose={() => setCancelShipmentModalOpen(false)} onCancel={handleCancelShipment} rejection_reason={rejection_reason} setRejection_reason={setRejection_reason} />
      )}

    </div>
  );
}

// ─── Change Selection Type — Right Panel ──────────────────────────────────────
function ChangeSelectionTypePanel({ lineItem, currentType, onClose, onSave }) {
  const [selected, setSelected] = useState(currentType);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shrink-0 cursor-pointer">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <h2 className="text-base font-bold text-gray-800">Change Selection Type</h2>
        </div>
        <div className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">SKU Name</p>
              <p className="text-sm font-semibold text-gray-800 break-words">{lineItem.product_sku?.sku_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">SKU Code</p>
              <p className="text-sm font-mono text-gray-700 break-words">{lineItem.product_sku?.sku_code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Display Name</p>
              <p className="text-sm text-gray-700 break-words">{lineItem.product_sku?.display_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Tracking Type</p>
              <p className="text-sm font-semibold text-gray-700 capitalize">{lineItem.product_sku?.tracking_type ?? "—"}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Selection Type</p>
            <div className="flex flex-col gap-1.5">
              {SELECTION_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer
                    ${selected === t
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                >
                  {t.toUpperCase()}
                  {selected === t && <Check className="w-3.5 h-3.5 inline ml-2 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => onSave(lineItem.id, selected)}
            className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:opacity-80 transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}


// ─── Batch Entry Modal ─────────────────────────────────────────────────────────
function BatchEntryModal({ isOpen, onClose, shipmentId, lineItem, totalQty, savedData, onSave, shipment }) {
  const skuName = lineItem?.product_sku?.sku_name;
  const skuId = lineItem?.product_sku?.id;

  const [availableBatches, setAvailableBatches] = useState([]);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  const [rows, setRows] = useState([]);
  const [viewMode, setViewMode] = useState(shipment?.status !== "created");
  const [currentLineItemData, setCurrentLineItemData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    if (savedData?.length) {
      setRows(savedData.map((r) => ({ ...r, id: Math.random(), availableQty: null })));
      setViewMode(true);
    }

    setCurrentLineItemData(shipment?.line_items?.find(item => item.product_sku.sku_name === lineItem?.product_sku?.sku_name));

    const fetchBatches = async () => {
      if (viewMode) return;
      setFetchingBatches(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/allocations/batch_availability?product_sku_id=${skuId}`);
        const json = await res.json();
        if (json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load batches");
        setAvailableBatches(json.data ?? []);
        if (!savedData?.length && json.data?.length) {
          setRows([{ id: Date.now(), batch_code: "", quantity: "", availableQty: null }]);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setFetchingBatches(false);
      }
    };
    fetchBatches();
  }, [isOpen]);

  useEffect(() => {
    if (savedData?.length) return;

    if (Object.keys(currentLineItemData?.meta || {}).length > 0) {
      setRows(
        currentLineItemData?.meta?.allocated_batches?.map((batch) => ({
          id: Date.now() + Math.random(),
          batch_code: batch?.batch_code,
          quantity: Number(batch?.quantity),
          availableQty: null,
        })) || []
      );

      setViewMode(true);
    }
  }, [currentLineItemData, savedData]);

  const selectedBatchCodes = rows.map((r) => r.batch_code).filter(Boolean);

  const totalEntered = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const isValid = totalEntered === Number(totalQty) && rows.every((r) => r.batch_code && Number(r.quantity) > 0);

  const updateRow = (id, field, val) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));

  const handleBatchSelect = (rowId, batchCode) => {
    const batch = availableBatches.find((b) => b.batch_code === batchCode);
    setRows((prev) => prev.map((r) =>
      r.id === rowId
        ? { ...r, batch_code: batchCode, quantity: "", availableQty: batch?.available_quantity ?? null }
        : r
    ));
  };

  const handleQtyChange = (rowId, val) => {
    const parsed = parseInt(val);
    const row = rows.find((r) => r.id === rowId);
    if (row?.availableQty != null && parsed > row.availableQty) {
      toast.error(`Cannot exceed available quantity of ${row.availableQty} for this batch.`);
      updateRow(rowId, "quantity", row.availableQty);
      return;
    }
    updateRow(rowId, "quantity", isNaN(parsed) || parsed < 1 ? "" : parsed);
  };

  const addRow = () =>
    setRows((prev) => [...prev, { id: Date.now(), batch_code: "", quantity: "", availableQty: null }]);

  const removeRow = (id) =>
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  const handleSave = () => {
    if (!isValid) return;
    onSave(rows.map(({ id, availableQty, ...rest }) => rest));
  };

  if (!isOpen) return null;

  if (viewMode) {
    return (
      <ModalOverlay onClose={onClose}>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Assigned Batches</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-700 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-3">
            <SkuSummaryBar skuName={skuName} label="Total Qty" value={totalQty} entered={rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} />
          </div>
          <div className="px-6 pb-4 max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Batch Code</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono font-semibold text-blue-700">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        {r.batch_code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-700">{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
            {shipment?.status === "created" && (
              <button
                onClick={() => setViewMode(false)}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Batches
              </button>
            )}
          </div>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <ModalHeader title="Assign Batches" onClose={onClose} />
        <div className="px-6 py-3">
          <SkuSummaryBar skuName={skuName} label="Total Qty" value={totalQty} entered={totalEntered} />
        </div>

        {fetchingBatches ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-gray-400">Loading available batches…</span>
          </div>
        ) : (
          <div className="px-6 pb-4 max-h-80 overflow-visible">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Batch</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Quantity</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td className="text-center h-20" colSpan={4}>
                      <p className="font-bold text-gray-700">NO BATCHES FOUND</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => {
                    const otherSelected = selectedBatchCodes.filter((c) => c !== r.batch_code);
                    const dropdownOptions = availableBatches.filter((b) => !otherSelected.includes(b.batch_code));
                    const selectedBatch = availableBatches.find((b) => b.batch_code === r.batch_code);

                    return (
                      <tr key={r.id} className="align-top">
                        <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-3">
                          <BatchDropdown
                            options={dropdownOptions}
                            value={r.batch_code}
                            onChange={(code) => handleBatchSelect(r.id, code)}
                            placeholder="Select batch…"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min={1}
                            max={r.availableQty ?? undefined}
                            value={r.quantity}
                            disabled={!r.batch_code}
                            onChange={(e) => handleQtyChange(r.id, e.target.value)}
                            placeholder="Qty"
                            onWheel={(e) => e.target.blur()}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-300"
                          />
                          {selectedBatch && (
                            <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                              Available: {selectedBatch.available_quantity}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 pt-3.5">
                          <button onClick={() => removeRow(r.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {availableBatches.length > selectedBatchCodes.filter(Boolean).length && (
              <button onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer">
                <Plus className="w-3.5 h-3.5" />Add Batch
              </button>
            )}
          </div>
        )}

        {!fetchingBatches && totalEntered !== Number(totalQty) && (
          <p className="px-6 text-[11px] text-red-500">
            Total entered ({totalEntered}) must equal required quantity ({totalQty}).
          </p>
        )}

        <ModalFooter
          onClose={onClose}
          onSave={handleSave}
          saveLabel="Confirm"
          saveDisabled={!isValid || fetchingBatches}
        />
      </div>
    </ModalOverlay>
  );
}

// ── Batch Dropdown ────────────────────────────────────────────────────────────
function BatchDropdown({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const selected = options.find((o) => o.batch_code === value);
  const filtered = options.filter((o) =>
    o.batch_code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border rounded-lg bg-white transition-colors
          ${open ? "border-primary ring-2 ring-primary/15" : "border-gray-200 hover:border-gray-300"}
          ${!selected ? "text-gray-400" : "text-gray-800 font-medium"} cursor-pointer`}
      >
        <span className="truncate">
          {selected ? `${selected.batch_code} (Avail: ${selected.available_quantity})` : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary transition-colors">
              <Search className="w-3 h-3 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search batch…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              {query && <button onClick={() => setQuery("")}><X className="w-3 h-3 text-gray-400" /></button>}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No batches found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.batch_code}
                  type="button"
                  onClick={() => { onChange(opt.batch_code); setOpen(false); setQuery(""); }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between gap-2
                    ${opt.batch_code === value
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono font-semibold">{opt.batch_code}</span>
                    <span className="text-[10px] text-gray-400">
                      Avail: {opt.available_quantity}
                      {opt.expiry_date && ` · Exp: ${fmtDate(opt.expiry_date)}`}
                    </span>
                  </div>
                  {opt.batch_code === value && <Check className="w-3 h-3 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Serial Entry Modal ────────────────────────────────────────────────────────
function SerialEntryModal({ isOpen, onClose, shipmentId, lineItem, totalQty, savedData, onSave, shipment }) {
  const skuName = lineItem?.product_sku?.sku_name;
  const skuId = lineItem?.product_sku?.id;

  const [availableSerials, setAvailableSerials] = useState([]);
  const [fetchingSerials, setFetchingSerials] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSerials, setSelectedSerials] = useState(new Set());
  const [viewMode, setViewMode] = useState(shipment?.status !== "created");
  const [currentLineItemData, setCurrentLineItemData] = useState(null);

  const total = Number(totalQty);
  const entered = selectedSerials.size;
  const remaining = total - entered;
  const isFull = remaining <= 0;

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");

    if (savedData?.length) {
      setSelectedSerials(new Set(savedData));
      setViewMode(true);
    } else {
      // setSelectedSerials(new Set());
      // setViewMode(false);
    }
    setCurrentLineItemData(shipment?.line_items.find(item => item?.product_sku?.sku_name === lineItem?.product_sku?.sku_name));

    const fetchSerials = async () => {
      if (viewMode) return;
      setFetchingSerials(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/allocations/serial_availability?product_sku_id=${skuId}`);
        const json = await res.json();
        if (json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load serials");
        setAvailableSerials(json.data?.map((s) => s.serial_number) ?? []);
        if (!savedData?.length && json.data?.length) {
          setSelectedSerials(new Set());
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setFetchingSerials(false);
      }
    };
    fetchSerials();
  }, [isOpen]);

  useEffect(() => {
    if (savedData.length) return;
    if (Object.keys(currentLineItemData?.meta || {}).length > 0) {
      setSelectedSerials(new Set(currentLineItemData?.meta?.allocated_serials));
      setViewMode(true);
    }
  }, [currentLineItemData, savedData]);

  const filteredSerials = availableSerials.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSerial = (serial) => {
    setSelectedSerials((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) {
        next.delete(serial);
      } else {
        if (next.size >= total) {
          toast.error(`You can only select ${total} serial(s).`);
          return prev;
        }
        next.add(serial);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (entered !== total) return;
    onSave([...selectedSerials]);
    onClose();
  };

  if (!isOpen) return null;

  if (viewMode) {
    return (
      <ModalOverlay onClose={onClose}>
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-bold text-gray-900">Assigned Serials</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-700 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded">{total} Qty</span>
          </div>
          <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {[...selectedSerials].map((s, i) => (
                <div key={s} className="inline-flex items-center gap-1 pl-2 pr-2 py-1 rounded-md border bg-blue-50 border-blue-200 text-xs font-mono font-semibold text-blue-700">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded px-1 font-mono">#{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
            {shipment?.status === "created" && (
              <button
                onClick={() => setViewMode(false)}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Serials
              </button>
            )}
          </div>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Select Serial Numbers</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-700 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
            <span className="text-sm font-semibold text-gray-800">{skuName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded">{total}</span>
            <span className="text-sm text-gray-500 font-medium">Quantity</span>
          </div>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-700">Select Serials ({entered} / {total})</span>
            <div className="flex items-center gap-2">
              {isFull
                ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> All done!</span>
                : <span className="text-amber-500">{remaining} remaining</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-colors">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search serial numbers…"
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-6 pb-4 overflow-y-auto">
          {fetchingSerials ? (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-gray-400">Loading serials…</span>
            </div>
          ) : filteredSerials.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No serials found</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {filteredSerials.map((serial) => {
                const isChecked = selectedSerials.has(serial);
                const isDisabled = !isChecked && isFull;
                return (
                  <label
                    key={serial}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
                      ${isChecked
                        ? "bg-blue-50 border-blue-300"
                        : isDisabled
                          ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed"
                          : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && toggleSerial(serial)}
                      className="w-3.5 h-3.5 accent-primary shrink-0"
                    />
                    <span className={`text-xs font-mono ${isChecked ? "text-blue-700 font-semibold" : "text-gray-700"}`}>
                      {serial}
                    </span>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-auto shrink-0" />}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            Go Back
          </button>
          <button
            onClick={handleSave}
            disabled={entered !== total}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2
              ${entered === total
                ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            {entered === total && <CheckCircle2 className="w-4 h-4" />}
            {entered === total ? "Save Serials" : `Select ${remaining} more`}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Untracked Entry Modal ─────────────────────────────────────────────────────
function UntrackedEntryModal({ isOpen, onClose, shipmentId, lineItem, totalQty, savedData, onSave, shipment }) {
  const skuName = lineItem?.product_sku?.sku_name;
  const skuId = lineItem?.product_sku?.id;

  const [availableUntracked, setAvailableUntracked] = useState([]);
  const [fetchingUntracked, setFetchingUntracked] = useState(false);
  const [currentLineItemData, setCurrentLineItemData] = useState(null);

  const [rows, setRows] = useState([]);
  const [viewMode, setViewMode] = useState(shipment?.status !== "created");

  useEffect(() => {
    if (!isOpen) return;

    if (savedData?.length) {
      setRows(savedData.map((r) => ({ ...r, id: Math.random(), availableQty: null })));
      setViewMode(true);
    } else {
      // setRows([{ id: Date.now(), untracked_number: "", quantity: "", availableQty: null }]);
      // setViewMode(false);
    }
    setCurrentLineItemData(shipment?.line_items.find(item => item?.product_sku?.sku_name === lineItem?.product_sku?.sku_name));

    const fetchUntracked = async () => {
      if (viewMode) return;
      setFetchingUntracked(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/allocations/untracked_availability?product_sku_id=${skuId}`);
        const json = await res.json();
        if (json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load untracked");
        setAvailableUntracked(json.data ?? []);
        if (!savedData?.length && json.data?.length) {
          setRows([{ id: Date.now(), untracked_number: "", quantity: "", availableQty: null }]);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setFetchingUntracked(false);
      }
    };
    fetchUntracked();
  }, [isOpen]);

  useEffect(() => {
    if (savedData.length) return;
    if (Object.keys(currentLineItemData?.meta || {}).length > 0) {
      setRows(currentLineItemData?.meta?.allocated_untracked.map(untracked => ({ id: Date.now() + Math.random(), untracked_number: untracked?.untracked_number, quantity: untracked?.quantity, availableQty: null })));
      setViewMode(true);
    }
  }, [currentLineItemData, savedData]);

  const selectedNumbers = rows.map((r) => r.untracked_number).filter(Boolean);

  const totalEntered = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const isValid = totalEntered === Number(totalQty) && rows.every((r) => r.untracked_number && Number(r.quantity) > 0);

  const updateRow = (id, field, val) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));

  const handleUntrackedSelect = (rowId, untrackedNumber) => {
    const item = availableUntracked.find((u) => u.untracked_number === untrackedNumber);
    setRows((prev) => prev.map((r) =>
      r.id === rowId
        ? { ...r, untracked_number: untrackedNumber, quantity: "", availableQty: item?.available_quantity ?? null }
        : r
    ));
  };

  const handleQtyChange = (rowId, val) => {
    const parsed = parseInt(val);
    const row = rows.find((r) => r.id === rowId);
    if (row?.availableQty != null && parsed > row.availableQty) {
      toast.error(`Cannot exceed available quantity of ${row.availableQty} for this untracked number.`);
      updateRow(rowId, "quantity", row.availableQty);
      return;
    }
    updateRow(rowId, "quantity", isNaN(parsed) || parsed < 1 ? "" : parsed);
  };

  const addRow = () =>
    setRows((prev) => [...prev, { id: Date.now(), untracked_number: "", quantity: "", availableQty: null }]);

  const removeRow = (id) =>
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  const handleSave = () => {
    if (!isValid) return;
    onSave(rows.map(({ id, availableQty, ...rest }) => rest));
  };

  if (!isOpen) return null;

  if (viewMode) {
    return (
      <ModalOverlay onClose={onClose}>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Assigned Untracked Numbers</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-700 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-3">
            <SkuSummaryBar skuName={skuName} label="Total Qty" value={totalQty} entered={rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0)} />
          </div>
          <div className="px-6 pb-4 max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Untracked Number</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-semibold text-amber-700">
                        <CheckCircle2 className="w-3 h-3 text-amber-500" />
                        {r.untracked_number}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-700">{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
            {shipment?.status === "created" && (
              <button
                onClick={() => setViewMode(false)}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <ModalHeader title="Assign Untracked Numbers" onClose={onClose} />
        <div className="px-6 py-3">
          <SkuSummaryBar skuName={skuName} label="Total Qty" value={totalQty} entered={totalEntered} />
        </div>

        {fetchingUntracked ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-gray-400">Loading available untracked numbers…</span>
          </div>
        ) : (
          <div className="px-6 pb-4 max-h-80 overflow-visible">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Untracked Number</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Quantity</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                  <tr>
                    <td className="text-center h-20" colSpan={4}>
                      <p className="font-bold text-gray-700">NO UNTRACKED FOUND</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => {
                    const otherSelected = selectedNumbers.filter((n) => n !== r.untracked_number);
                    const dropdownOptions = availableUntracked.filter((u) => !otherSelected.includes(u.untracked_number));
                    const selectedItem = availableUntracked.find((u) => u.untracked_number === r.untracked_number);

                    return (
                      <tr key={r.id} className="align-top">
                        <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-3">
                          <UntrackedDropdown
                            options={dropdownOptions}
                            value={r.untracked_number}
                            onChange={(num) => handleUntrackedSelect(r.id, num)}
                            placeholder="Select untracked number…"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number" min={1}
                            max={r.availableQty ?? undefined}
                            value={r.quantity}
                            disabled={!r.untracked_number}
                            onChange={(e) => handleQtyChange(r.id, e.target.value)}
                            placeholder="Qty"
                            onWheel={(e) => e.target.blur()}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-300"
                          />
                          {selectedItem && (
                            <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                              Available: {selectedItem.available_quantity}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 pt-3.5">
                          <button onClick={() => removeRow(r.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {availableUntracked.length > selectedNumbers.filter(Boolean).length && (
              <button onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer">
                <Plus className="w-3.5 h-3.5" />Add Row
              </button>
            )}
          </div>
        )}

        {!fetchingUntracked && totalEntered !== Number(totalQty) && (
          <p className="px-6 text-[11px] text-red-500">
            Total entered ({totalEntered}) must equal required quantity ({totalQty}).
          </p>
        )}

        <ModalFooter
          onClose={onClose}
          onSave={handleSave}
          saveLabel="Confirm"
          saveDisabled={!isValid || fetchingUntracked}
        />
      </div>
    </ModalOverlay>
  );
}

// ── Untracked Dropdown ────────────────────────────────────────────────────────
function UntrackedDropdown({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const selected = options.find((o) => o.untracked_number === value);
  const filtered = options.filter((o) =>
    o.untracked_number.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border rounded-lg bg-white transition-colors
          ${open ? "border-primary ring-2 ring-primary/15" : "border-gray-200 hover:border-gray-300"}
          ${!selected ? "text-gray-400" : "text-gray-800 font-medium"} cursor-pointer`}
      >
        <span className="truncate">
          {selected ? `${selected.untracked_number} (Avail: ${selected.available_quantity})` : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary transition-colors">
              <Search className="w-3 h-3 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search untracked number…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              {query && <button onClick={() => setQuery("")}><X className="w-3 h-3 text-gray-400" /></button>}
            </div>
          </div>
          <div className="h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No options found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.untracked_number}
                  type="button"
                  onClick={() => { onChange(opt.untracked_number); setOpen(false); setQuery(""); }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between gap-2
                    ${opt.untracked_number === value
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono font-semibold">{opt.untracked_number}</span>
                    <span className="text-[10px] text-gray-400">Avail: {opt.available_quantity}</span>
                  </div>
                  {opt.untracked_number === value && <Check className="w-3 h-3 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Unassigned Popup ──────────────────────────────────────────────────────────
function UnassignedPopup({ items, onClose }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800">Unassigned Items</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4 flex flex-col gap-2">
          <p className="text-xs text-gray-500 mb-2">Please assign the following before proceeding:</p>
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
              {item}
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
            OK, Got it
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Shared modal primitives ───────────────────────────────────────────────────
function ModalOverlay({ children, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full flex justify-center">{children}</div>
      </div>
    </>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saveLabel = "Save", saveDisabled = false }) {
  return (
    <div className="flex justify-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100">
      <button onClick={onClose} className="w-36 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
        Go Back
      </button>
      <button
        onClick={onSave}
        disabled={saveDisabled}
        className={`w-36 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2
          ${saveDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"}`}
      >
        <CheckCircle2 className="w-4 h-4" />
        {saveLabel}
      </button>
    </div>
  );
}

function SkuSummaryBar({ skuName, label, value, entered }) {
  const match = entered === Number(value);
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
        <span className="text-sm font-semibold text-gray-800">{skuName}</span>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span className="text-gray-500">{label}: <span className="text-gray-800">{value}</span></span>
        <span className={match ? "text-emerald-600" : "text-orange-500"}>Entered: {entered}</span>
      </div>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="text-xs text-gray-700">{value ?? "—"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    created: "bg-gray-100 text-gray-700",
    packed: "bg-amber-100 text-amber-700",
    invoiced: "bg-purple-100 text-purple-700",
    dispatched: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    return_initiated: "bg-orange-100 text-orange-700",
    return_processing: "bg-amber-100 text-amber-700",
    return_received: "bg-blue-100 text-blue-700",
    return_completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
      {status?.replace(/_/g, " ") ?? "—"}
    </span>
  );
}

// ─── Inline Searchable Dropdown ───────────────────────────────────────────────
function InlineDropdown({
  placeholder = "Select…",
  options = [],
  value,
  onChange,
  valueKey = "id",
  labelKey = "name",
  searchPlaceholder = "Search…",
  emptyMessage = "No options found",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const selected = options.find((o) => o[valueKey] === value);
  const filtered = options.filter((o) =>
    (o[labelKey] ?? "").toString().toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs border rounded-lg bg-white transition-colors
          ${open ? "border-primary ring-2 ring-primary/15" : "border-gray-200 hover:border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
          ${!selected ? "text-gray-400" : "text-gray-800 font-medium"}`}
      >
        <span className="leading-snug whitespace-normal break-words text-left">
          {selected ? selected[labelKey] : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-max min-w-full max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-colors">
              <Search className="w-3 h-3 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="h-40 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">{emptyMessage}</p>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt[valueKey] === value;
                return (
                  <button
                    key={opt[valueKey]}
                    type="button"
                    onClick={() => { onChange(opt[valueKey]); setOpen(false); setQuery(""); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-start justify-between gap-2
                      ${isSelected ? "bg-primary/8 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <span className="leading-snug whitespace-normal break-words">{opt[labelKey]}</span>
                    {isSelected && <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Child Shipments Accordion ────────────────────────────────────────────────
function ChildShipmentsAccordion({ childShipments, expandedChildId, onToggle, parentShipment, onRefresh }) {
  // Sort: latest (highest id) first
  const sorted = [...childShipments].sort((a, b) => b.id - a.id);

  const STATUS_COLORS = {
    return_initiated: "bg-orange-100 text-orange-700",
    return_completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-primary">
            Child Shipments
            <span className="ml-2 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {childShipments.length}
            </span>
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {sorted.map((child, idx) => {
            const isOpen = expandedChildId === child.id;
            const isLatest = idx === 0;

            return (
              <div key={child.id}>
                {/* Accordion Header */}
                <button
                  onClick={() => onToggle(child.id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-100 ${isOpen ? "bg-gray-300" : ""} transition-colors cursor-pointer text-left`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${child.status === "return_completed" ? "bg-green-500" :
                      child.status === "return_initiated" ? "bg-orange-400" :
                        child.status === "return_processing" ? "bg-amber-400" :
                          "bg-blue-400"
                      }`} />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">
                          Shipment #{child.shipment_number}
                        </span>
                        {isLatest && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 capitalize">
                        {child.shipment_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLORS[child.status] ?? "bg-gray-100 text-gray-600"
                      }`}>
                      {child.status?.replace(/_/g, " ")}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                </button>

                {/* Accordion Body — only mount ReturnShipment when open */}
                {isOpen && (
                  <div className="border-t border-gray-100 mb-4">
                    <ReturnShipment
                      shipment={parentShipment}
                      return_shipment_id={child.id}
                      onCancel={() => onToggle(child.id)}
                      onSuccess={() => { onRefresh() }}
                      fromChild={true}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

