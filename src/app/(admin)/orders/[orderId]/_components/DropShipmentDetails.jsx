"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2, ArrowLeft, ArrowRight, Pencil, Plus, Check,
  ChevronDown, X, CheckCircle2, AlertCircle,
  Save, MoreVertical, ExternalLink,
  Dices, SendIcon, RotateCcwSquare, Search,
  Package, FileText, Truck
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function DropShipmentTrackerBar({ status }) {
  const steps = [
    { key: "created",   label: "Created",   icon: Package },
    { key: "invoiced",  label: "Invoiced",  icon: FileText },
    { key: "delivered", label: "Delivered", icon: Truck },
  ];

  const ORDER = ["created", "invoiced", "delivered", "cancelled"];
  const currentIndex = ORDER.indexOf(status?.toLowerCase());
  const isCancelled = status?.toLowerCase() === "cancelled";

  const getStepState = (stepKey) => {
    const stepIndex = ORDER.indexOf(stepKey);
    if (isCancelled) return "cancelled";
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="px-6 py-5">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const state = getStepState(step.key);
          const Icon = step.icon;

          const circleClass =
            state === "done"     ? "bg-green-500 border-green-500 text-white" :
            state === "active"   ? "bg-primary border-primary text-white shadow-md shadow-primary/30" :
            state === "cancelled"? "bg-red-400 border-red-400 text-white" :
                                   "bg-white border-gray-200 text-gray-300";

          const labelClass =
            state === "done"     ? "text-green-600 font-semibold" :
            state === "active"   ? "text-primary font-bold" :
            state === "cancelled"? "text-red-400 font-semibold" :
                                   "text-gray-400 font-medium";

          const lineClass =
            i < steps.length - 1
              ? (ORDER.indexOf(steps[i + 1].key) <= currentIndex && !isCancelled)
                ? "bg-green-400"
                : "bg-gray-200"
              : "";

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${circleClass}`}>
                  {state === "done" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[11px] whitespace-nowrap ${labelClass}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all ${lineClass}`} />
              )}
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-xs font-semibold text-red-600">This shipment has been cancelled.</span>
        </div>
      )}
    </div>
  );
}

function DropReturnShipment({ shipment, return_shipment_id, onCancel, onSuccess, fromChild = false }) {
  const [returnShipment, setReturnShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [quantities, setQuantities] = useState({});

  // Return tracker steps
  const RETURN_STEPS = ["return_initiated", "return_completed"];
  const RETURN_STEP_LABELS = {
    return_initiated: "Return Initiated",
    return_completed: "Return Completed",
  };

  const fetchReturnShipment = async () => {
    if (!return_shipment_id) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${return_shipment_id}`);
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load return shipment");
      setReturnShipment(json.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (return_shipment_id) fetchReturnShipment();
  }, [return_shipment_id]);

  useEffect(() => {
    if (!shipment) return;
    const init = {};
    (shipment.line_items ?? []).forEach((li) => {
      init[li.id] = "";
    });
    setQuantities(init);
  }, [shipment]);

  const handleInitiateReturn = async () => {
    const lineItems = (shipment?.line_items ?? []).map((li) => ({
      order_line_item_id: li.order_line_item?.id,
      quantity: Number(quantities[li.id]) || 0,
    })).filter((li) => li.quantity > 0);

    if (!lineItems.length) {
      toast.error("Enter quantity for at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment: {
            order_id: shipment.order?.id,
            node_id: shipment.node?.id,
            shipment_type: "return_shipment",
            parent_shipment_id: shipment.id,
            line_items: lineItems,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to initiate return");
      toast.success("Return shipment initiated!");
      onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReturn = async () => {
    setCompleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${return_shipment_id}/complete_return`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to complete return");
      toast.success("Return completed!");
      await fetchReturnShipment();
      onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (!return_shipment_id) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-primary">Initiate Return</h3>
          {onCancel && (
            <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
              Cancel
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">SKU Name</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">SKU Code</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide w-20">Max Qty</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide w-28">Return Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(shipment?.line_items ?? []).map((li) => (
                <tr key={li.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{li.product_sku?.sku_name ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">{li.product_sku?.sku_code ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">{li.quantity}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      max={li.quantity}
                      value={quantities[li.id] ?? ""}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v > li.quantity) {
                          toast.error(`Cannot exceed max quantity of ${li.quantity}`);
                          setQuantities((prev) => ({ ...prev, [li.id]: li.quantity }));
                          return;
                        }
                        setQuantities((prev) => ({ ...prev, [li.id]: isNaN(v) || v < 0 ? "" : v }));
                      }}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-gray-100">
          <button
            onClick={handleInitiateReturn}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcwSquare className="w-3.5 h-3.5" />}
            Initiate Return
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-xs text-gray-400">Loading return shipment…</span>
      </div>
    );
  }

  if (!returnShipment) return null;

  const currentStepIndex = RETURN_STEPS.indexOf(returnShipment.status);

  return (
    <div className={fromChild ? "" : "bg-white rounded-xl border border-gray-100 shadow-sm"}>
      {/* Mini return tracker */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {RETURN_STEPS.map((step, i) => {
            const isActive = step === returnShipment.status;
            const isDone = i < currentStepIndex;
            return (
              <div key={step} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border-2 transition-all
                    ${isDone ? "bg-green-500 border-green-500 text-white" :
                      isActive ? "bg-primary border-primary text-white" :
                      "bg-white border-gray-200 text-gray-300"}`}>
                    {isDone ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-[11px] font-semibold whitespace-nowrap
                    ${isDone ? "text-green-600" : isActive ? "text-primary" : "text-gray-400"}`}>
                    {RETURN_STEP_LABELS[step]}
                  </span>
                </div>
                {i < RETURN_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 rounded-full ${i < currentStepIndex ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Return line items */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">SKU Name</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">SKU Code</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Qty</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Final Amt.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(returnShipment.line_items ?? []).map((li) => (
              <tr key={li.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{li.product_sku?.sku_name ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{li.product_sku?.sku_code ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{li.quantity}</td>
                <td className="px-4 py-3 font-semibold text-primary">{fmt(li.final_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Complete Return action */}
      {returnShipment.status === "return_initiated" && (
        <div className="flex justify-end px-5 py-3 border-t border-gray-100">
          <button
            onClick={handleCompleteReturn}
            disabled={completing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Complete Return
          </button>
        </div>
      )}
    </div>
  );
}

export default function DropShipmentDetails({ shipmentId, onBack }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [shippableItems, setShippableItems] = useState([]);
  const [updating, setUpdating] = useState(false);

  const [openOptions, setOpenOptions] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [sendingToGetInvoice, setSendingToGetInvoice] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [expandedChildId, setExpandedChildId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const fetchShipment = async (shipmentID = shipmentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentID}`);
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to load shipment");
      setShipment(json.data);
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
      setShipment(json.data);
    } catch (err) {
      toast.error(err.message);
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
    } catch (err) {}
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
      if (editRows.length === 0) throw new Error("Add at least one line item");
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
      await fetchShipment();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleProceedToInvoice = async () => {
    try {
      setSendingToGetInvoice(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/invoice`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (!res.ok || result?.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Shipment proceeded for invoice");
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to proceed shipment to invoice: " + err.message);
    } finally {
      setSendingToGetInvoice(false);
    }
  };

  const handleDelivering = async () => {
    try {
      setDelivering(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/deliver`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (!res.ok || result?.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Shipment marked as delivered successfully");
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to mark shipment as delivered: " + err.message);
    } finally {
      setDelivering(false);
    }
  };

  const handleCancelShipment = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/cancel?cancellation_reason=${cancelReason}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const result = await res.json();
      if (!res.ok || result?.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Shipment cancelled successfully");
      setCancelModalOpen(false);
      await fetchShipment();
    } catch (err) {
      toast.error("Failed to cancel shipment: " + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const canDoReturnShipment = () => {
    if (!shipment) return false;
    return !shipment.child_shipments?.some((c) => c.status === "return_initiated");
  };

  const lineItems = shipment?.line_items ?? [];
  const agg = shipment?.aggregates ?? {};

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs text-gray-400">Loading shipment…</p>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="flex flex-col gap-4" onClick={() => setOpenOptions(false)}>

      {/* ── Top Bar with Inline Tracker ── */}
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

        <DropShipmentTrackerBar status={shipment.status} />
      </div>

      {/*     Meta and Line Items */}
      <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm">

        {/* Kebab menu */}
        {(shipment?.status === "created" || shipment?.status === "delivered") && (
          <div className="absolute top-3 right-3">
            <div
              className="cursor-pointer p-1 rounded-md hover:bg-gray-100"
              onClick={(e) => { e.stopPropagation(); setOpenOptions((p) => !p); }}
            >
              <MoreVertical size={16} />
            </div>

            {openOptions && (
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-white rounded-md shadow-lg border border-gray-100 p-1 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {!editMode && shipment?.status === "created" && (
                  <div
                    role="button"
                    onClick={() => { setOpenOptions(false); enterEdit(); }}
                    className="flex items-center gap-2.5 px-2.5 rounded-md py-2 border-b border-gray-200 text-xs text-gray-700 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Shipment
                  </div>
                )}

                {shipment?.status === "created" && (
                  <div
                    role="button"
                    onClick={() => { setOpenOptions(false); setCancelModalOpen(true); }}
                    className="flex items-center gap-2.5 px-2.5 rounded-md py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel Shipment
                  </div>
                )}

                {shipment?.status === "delivered" && (
                  <div
                    role="button"
                    onClick={() => {
                      if (!canDoReturnShipment()) { toast.error("Finish existing return shipments first"); return; }
                      setOpenOptions(false);
                      setShowReturnPanel((p) => !p);
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

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
          <MetaCell label="Shipment Number" value={<span className="font-bold text-gray-800">{shipment.shipment_number}</span>} />
          <MetaCell label="Status" value={<StatusBadge status={shipment.status} />} />
          <MetaCell label="Packing Slip" value={
            shipment?.shipment_packing_slip
              ? <a href={shipment.shipment_packing_slip} target="_blank" rel="noopener noreferrer" className="flex gap-1 text-primary font-semibold text-xs"><ExternalLink size={14} /> Download</a>
              : "—"
          } />
          <MetaCell label="Invoice" value={
            <span className="flex flex-col gap-1">
              <span>{shipment.invoices?.length ? shipment.invoices[0].invoice_number : "—"}</span>
              {shipment?.invoices?.[0]?.invoice_url && (
                <a href={shipment.invoices[0].invoice_url} target="_blank" rel="noopener noreferrer" className="flex gap-1 text-primary font-semibold text-xs"><ExternalLink size={14} /> Download</a>
              )}
            </span>
          } />
          <MetaCell label="Delivered At" value={shipment.delivered_at ? fmtDate(shipment.delivered_at) : "—"} />
          <MetaCell label="Final Amount" value={<span className="font-bold text-gray-800">{fmt(agg.final_amount)}</span>} />
          <MetaCell label="PO link" value={<Link href={`/purchase_orders/  `} ><span className="text-primary flex gap-1 font-medium" ><ExternalLink size={14} /><p>Go to PO</p></span></Link>} />
        </div>

        {/* Line items header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 border-t border-gray-100">
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
              {shipment?.status === "created" && ( //here i have to add condition like if purchase order created or not and if its created then i need the purchase order id so with that i will provide a link by on click it takes user to PO details page and if PO is not created then i have to take user to PO creation page with all data auto filled its done by sessionStorage but inorder to make it work fully like giving a button and navigating there i need to write a function and pass them in new sessionstorage so for this i need unit price in line items of shipment details api also  
                <button
                  onClick={handleProceedToInvoice}
                  disabled={sendingToGetInvoice}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-purple-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {sendingToGetInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Get Invoice
                </button>
              )}
              {shipment?.status === "invoiced" && (
                <button
                  onClick={handleDelivering}
                  disabled={delivering}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-700 hover:opacity-80 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {delivering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendIcon className="w-3.5 h-3.5" />}
                  Mark as Delivered
                </button>
              )}
            </>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["SKU Name", "Quantity", "MRP", "Selling Price", "Discount Amt.", "Tax Amt.", "Total Amt.", "Final Amt."].map((col) => (
                  <th key={col} className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Existing rows */}
              {(editMode ? editRows.filter((r) => !r.isNew) : lineItems).map((row) => {
                const li = editMode ? lineItems.find((l) => l.id === row.id) ?? {} : row;
                return (
                  <tr key={editMode ? (row.id ?? row.tempId) : li.id} className="hover:bg-gray-50/50 transition-colors align-top">
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-gray-800 leading-snug break-words whitespace-normal">
                          {li.product_sku?.sku_name ?? row.sku_name ?? "—"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono truncate">
                          {li.product_sku?.sku_code ?? row.sku_code}
                        </span>
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
                          onChange={(e) => setEditRows((prev) => prev.map((r) => r.id === row.id ? { ...r, quantity: e.target.value } : r))}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value);
                            if (isNaN(v) || v < 1) {
                              const original = lineItems.find((l) => l.id === row.id);
                              setEditRows((prev) => prev.map((r) => r.id === row.id ? { ...r, quantity: String(original?.quantity ?? 1) } : r));
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
                  </tr>
                );
              })}

              {/* New rows in edit mode */}
              {editMode && editRows.filter((r) => r.isNew).map((row) => {
                const takenIds = editRows.filter((r) => r.tempId !== row.tempId).map((r) => String(r.order_line_item_id));
                const availableOptions = shippableItems.filter((si) => !takenIds.includes(String(si.oli_id)));
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
                            ? { ...r, order_line_item_id: item?.oli_id, sku_name: item?.sku_name, sku_code: item?.sku_code, mrp: item?.mrp, selling_price: item?.selling_price, discount_amount: item?.discount_amount, tax_amount: item?.tax_amount, total_amount: item?.total_amount, final_amount: item?.final_amount }
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
                          setEditRows((prev) => prev.map((r) => r.tempId === row.tempId ? { ...r, quantity: isNaN(v) || v < 1 ? "" : v } : r));
                        }}
                        onWheel={(e) => e.target.blur()}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.mrp ? fmt(row.mrp) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.selling_price ? fmt(row.selling_price) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs tabular-nums">
                      {parseFloat(row.discount_amount) > 0 ? <span className="text-red-500">-{fmt(row.discount_amount)}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.tax_amount ? fmt(row.tax_amount) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{row.total_amount ? fmt(row.total_amount) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-primary tabular-nums">
                      <div className="flex items-center justify-between gap-1">
                        {row.final_amount ? fmt(row.final_amount) : <span className="text-gray-300">—</span>}
                        <button onClick={() => setEditRows((prev) => prev.filter((r) => r.tempId !== row.tempId))} className="text-gray-300 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Add item row */}
              {editMode && (() => {
                const takenIds = editRows.map((r) => String(r.order_line_item_id));
                const available = shippableItems.filter((si) => !takenIds.includes(String(si.oli_id)));
                if (!available.length) return null;
                return (
                  <tr>
                    <td colSpan={8} className="px-3 py-2.5">
                      <button
                        onClick={() => setEditRows((prev) => [...prev, { tempId: Date.now(), order_line_item_id: null, sku_name: null, sku_code: null, quantity: 1, isNew: true }])}
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

      {/*  Child Shipments (Return Shipments) */}
      {(shipment?.child_shipments ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-primary">
                Return Shipments
                <span className="ml-2 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {shipment.child_shipments.length}
                </span>
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {[...shipment.child_shipments].sort((a, b) => b.id - a.id).map((child, idx) => {
                const isOpen = expandedChildId === child.id;
                const isLatest = idx === 0;
                return (
                  <div key={child.id}>
                    <button
                      onClick={() => setExpandedChildId((prev) => prev === child.id ? null : child.id)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-100 ${isOpen ? "bg-gray-300" : ""} transition-colors cursor-pointer text-left`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${child.status === "return_completed" ? "bg-green-500" : "bg-orange-400"}`} />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800">Shipment #{child.shipment_number}</span>
                            {isLatest && (
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">Latest</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 capitalize">{child.shipment_type?.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${child.status === "return_completed" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                          {child.status?.replace(/_/g, " ")}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        <DropReturnShipment
                          shipment={shipment}
                          return_shipment_id={child.id}
                          onCancel={() => setExpandedChildId(null)}
                          onSuccess={() => fetchShipmentForRefresh(shipmentId)}
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
      )}

      {showReturnPanel && (
        <DropReturnShipment
          shipment={shipment}
          return_shipment_id={null}
          onCancel={() => setShowReturnPanel(false)}
          onSuccess={() => {
            fetchShipmentForRefresh(shipmentId);
            setShowReturnPanel(false);
          }}
        />
      )}

      {cancelModalOpen && (
        <CancelModal
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelShipment}
          isCancelling={isCancelling}
          reason={cancelReason}
          setReason={setCancelReason}
        />
      )}

    </div>
  );
}

function CancelModal({ onClose, onConfirm, isCancelling, reason, setReason }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-gray-800">Cancel Shipment</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-4 flex flex-col gap-3">
            <p className="text-xs text-gray-500">Are you sure you want to cancel this shipment? This action cannot be undone.</p>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cancellation Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for cancellation…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300/40 focus:border-red-300 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 pb-5">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Go Back
            </button>
            <button
              onClick={onConfirm}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              {isCancelling ? "Cancelling…" : "Confirm Cancel"}
            </button>
          </div>
        </div>
      </div>
    </>
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
    created:          "bg-gray-100 text-gray-700",
    invoiced:         "bg-purple-100 text-purple-700",
    delivered:        "bg-green-100 text-green-700",
    return_initiated: "bg-orange-100 text-orange-700",
    return_completed: "bg-green-100 text-green-700",
    cancelled:        "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
      {status?.replace(/_/g, " ") ?? "—"}
    </span>
  );
}

function InlineDropdown({ placeholder = "Select…", options = [], value, onChange, valueKey = "id", labelKey = "name", disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) { setOpen(false); setQuery(""); }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  const selected = options.find((o) => o[valueKey] === value);
  const filtered = options.filter((o) => (o[labelKey] ?? "").toString().toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative w-full" ref={containerRef}>
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
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary transition-colors">
              <Search className="w-3 h-3 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
              />
              {query && <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          <div className="h-40 overflow-y-auto py-1">
            {filtered.length === 0
              ? <p className="px-3 py-3 text-xs text-gray-400 text-center">No options found</p>
              : filtered.map((opt) => {
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
                })}
          </div>
        </div>
      )}
    </div>
  );
}