"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2, ArrowLeft, ArrowRight, Pencil, Info, Plus, Check,
  ChevronDown, Search, X, CheckCircle2, AlertCircle,
  Layers, Sparkles, Package, Save, MoreVertical,
  BaggageClaimIcon,
} from "lucide-react";
import { toast } from "react-toastify";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const TRACKER_STEPS = [
  { step: 1, label: "Created",          topLabel: "Created" },
  { step: 2, label: "Packed",           topLabel: null },
  { step: 3, label: "Invoiced",         topLabel: "Invoiced" },
  { step: 4, label: "Dispatched",       topLabel: null },
  { step: 5, label: "Delivered",        topLabel: "Delivered" },
  { step: 6, label: "Return Initiated", topLabel: null },
  { step: 7, label: "Cancelled",        topLabel: "Cancelled" },
  { step: 8, label: "Return Completed", topLabel: null },
];

const STATUS_STEP_MAP = {
  created:          1,
  packed:           2,
  invoiced:         3,
  dispatched:       4,
  delivered:        5,
  return_initiated: 6,
  cancelled:        7,
  return_completed: 8,
};

const SELECTION_TYPES = ["fifo", "lifo", "fefo", "manual"];

export default function ShipmentDetail({ shipmentId, onBack }) {
  const [shipment, setShipment]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [editMode, setEditMode]       = useState(false);
  const [editRows, setEditRows]       = useState([]);
  const [shippableItems, setShippableItems] = useState([]);
  const [updating, setUpdating]       = useState(false);

  // Per-line-item local state for selection type overrides and manual entries
  const [selectionTypes, setSelectionTypes]   = useState({}); 
  const [manualBatches, setManualBatches]     = useState({}); 
  const [manualSerials, setManualSerials]     = useState({}); 
  const [manualUntracked, setManualUntracked] = useState({}); 

  // Modal states
  const [changeTypePanel, setChangeTypePanel] = useState(null);  
  const [batchModal, setBatchModal]   = useState(null);   
  const [serialModal, setSerialModal] = useState(null);    
  const [untrackedModal, setUntrackedModal] = useState(null); 
  const [unassignedPopup, setUnassignedPopup] = useState(null); 
  const [assigning, setAssigning]     = useState(false);

  const fetchShipment = async (preserveSelectionTypes = false) => {
    setLoading(true);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}`);
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

  useEffect(() => { fetchShipment(); }, [shipmentId]);

  const enterEdit = async () => {
    try {
      const orderId = shipment?.order?.id;
      if (orderId) {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/shippable_line_items?order_id=${orderId}`);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment: {
            order_id: shipment?.order?.id,
            node_id:  shipment?.node?.id,
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
          const sType       = selectionTypes[li.id] ?? "fifo";
          const trackingType = li.product_sku?.tracking_type ?? "untracked";
          const item = { shipment_line_item_id: li.id, selection_type: sType };
          if (sType === "manual") {
            if (trackingType === "batch")    item.batch_codes        = (manualBatches[li.id] ?? []).map((b) => ({ batch_code: b.batch_code, quantity: Number(b.quantity) }));
            else if (trackingType === "serial")   item.serials       = (manualSerials[li.id] ?? []);
            else if (trackingType === "untracked") item.untracked_numbers = (manualUntracked[li.id] ?? []).map((u) => ({ untracked_number: u.untracked_number, quantity: Number(u.quantity) }));
          }
          return item;
        }),
      };
      const res  = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipmentId}/allocations/assign_allocations`, {
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

  const currentStep = STATUS_STEP_MAP[shipment?.status] ?? 2;
  const lineItems   = shipment?.line_items ?? [];
  const agg         = shipment?.aggregates ?? {};

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs text-gray-400">Loading shipment...</p>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top Bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <h2 className="text-sm font-bold text-primary capitalize">
            {shipment.shipment_type?.replace(/_/g, " ")}
          </h2>
          <div className="flex items-center gap-2">
            {!editMode && (
              <button
                onClick={enterEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:opacity-80 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Shipment Tracker ── */}
        <div className="px-6 py-5 bg-gray-50/50 rounded-xl mx-4 my-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-700 mb-5">Shipment Tracker</p>

          {/* Top labels (odd steps: 1,3,5,7) */}
          <div className="flex justify-between mb-2">
            {TRACKER_STEPS.map((s) => (
              <div key={s.step} className="flex-1 flex justify-center px-0.5">
                {s.step % 2 === 1
                  ? <span className="text-[9px] text-gray-500 text-center leading-tight">{s.label}</span>
                  : <span className="text-[9px] text-transparent">·</span>}
              </div>
            ))}
          </div>

          {/* Steps row with connecting line */}
          <div className="relative flex items-center justify-between">
            {/* Gray background line — runs between circle centers */}
            <div className="absolute inset-y-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0"
              style={{ left: "1.75%", right: "1.75%" }} />
            {/* Primary progress line — fills up to the current step's circle center */}
            <div
              className="absolute inset-y-1/2 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                left: "1.75%",
                width: currentStep <= 1
                  ? "0%"
                  : `${((currentStep - 1) / (TRACKER_STEPS.length - 1)) * 96.5}%`,
              }}
            />
            {TRACKER_STEPS.map((s) => {
              const done   = s.step < currentStep;
              const active = s.step === currentStep;
              return (
                <div key={s.step} className="relative z-10 flex items-center justify-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all
                    ${done || active
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-gray-300 text-gray-400"}`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom labels (even steps: 2,4,6,8) */}
          <div className="flex justify-between mt-2">
            {TRACKER_STEPS.map((s) => (
              <div key={s.step} className="flex-1 flex justify-center px-0.5">
                {s.step % 2 === 0
                  ? <span className="text-[9px] text-gray-500 text-center leading-tight">{s.label}</span>
                  : <span className="text-[9px] text-transparent">·</span>}
              </div>
            ))}
          </div>

          {/* Active step banner */}
          <div className="mt-4 flex justify-end">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{currentStep}</span>
              {TRACKER_STEPS.find((s) => s.step === currentStep)?.label ?? `Step ${currentStep}`}
            </div>
          </div>
        </div>

        {/* ── Meta grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-gray-100 divide-x divide-gray-100">
          <MetaCell label="Shipment Number"   value={<span className="font-bold text-gray-800">{shipment.shipment_number}</span>} />
          <MetaCell label="Status"            value={<StatusBadge status={shipment.status} />} />
          <MetaCell label="Shipment packing slip" value={<span className="text-primary font-semibold text-xs">Download</span>} />
          <MetaCell label="Invoice"           value={shipment.invoices?.length ? shipment.invoices[0].invoice_number : "—"} />
          <MetaCell label="Node"              value={<span className="font-semibold text-gray-800">{shipment.node?.name ?? "—"}</span>} />
          <MetaCell label="Mark Dispatch Details" value={shipment.dispatched_at ? fmtDate(shipment.dispatched_at) : "—"} />
          <MetaCell label="Mark Delivered Details" value={shipment.delivered_at ? fmtDate(shipment.delivered_at) : "—"} />
          <MetaCell label="Final Amount"      value={<span className="font-bold text-gray-800">{fmt(agg.final_amount)}</span>} />
        </div>
      </div>

      {/* ── Line Items ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* ── Line Items — single table used for both view & edit mode ── */}
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
            <button
              onClick={handleAssignAllocations}
              disabled={assigning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BaggageClaimIcon className="w-3.5 h-3.5" />}
              Assign Batches and Serials
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
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
                  <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Existing line items */}
              {(editMode ? editRows.filter((r) => !r.isNew) : lineItems).map((row) => {
                const li = editMode
                  ? lineItems.find((l) => l.id === row.id) ?? {}
                  : row;
                const sType        = selectionTypes[li.id] ?? "fifo";
                const trackingType = li.product_sku?.tracking_type ?? "untracked";
                const isManual     = sType === "manual";
                const hasBatches   = manualBatches[li.id]?.length > 0;
                const hasSerials   = manualSerials[li.id]?.length > 0;
                const hasUntracked = manualUntracked[li.id]?.length > 0;
                const isAssigned   = isManual ? (hasBatches || hasSerials || hasUntracked) : true;
                const rowId        = editMode ? (row.id ?? row.tempId) : li.id;

                return (
                  <tr key={rowId} className="hover:bg-gray-50/50 transition-colors align-top">
                    {/* SKU Name */}
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
                            title="Remove row"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Quantity — editable in edit mode */}
                    <td className="px-3 py-3 tabular-nums">
                      {editMode ? (
                        <input
                          type="number"
                          min={1}
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

                    {/* Batch/Serial cell — grayed out during edit */}
                    <td className="px-3 py-3">
                      <div className={`flex flex-col gap-1 ${editMode ? "opacity-40 pointer-events-none select-none" : ""}`}>
                        <div className="flex items-center gap-1">
                          {!isAssigned
                            ? <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                          <span className="text-[10px] text-gray-600 font-medium capitalize truncate">
                            {trackingType} – {sType.toUpperCase()}
                          </span>
                          <button
                            onClick={() => setChangeTypePanel(li)}
                            className="ml-auto text-gray-400 hover:text-primary transition-colors shrink-0 cursor-pointer"
                          >
                            <Info className="w-5 h-5" />
                          </button>
                        </div>
                        {isManual && (
                          <div className="flex flex-col gap-0.5">
                            {trackingType === "batch" && (
                              <button onClick={() => setBatchModal(li)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                                <Plus className="w-3 h-3" />{hasBatches ? "Edit Batches" : "Add Batch"}
                              </button>
                            )}
                            {trackingType === "serial" && (
                              <button onClick={() => setSerialModal(li)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                                <Plus className="w-3 h-3" />{hasSerials ? "Edit Serials" : "Add Serial"}
                              </button>
                            )}
                            {trackingType === "untracked" && (
                              <button onClick={() => setUntrackedModal(li)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer">
                                <Plus className="w-3 h-3" />{hasUntracked ? "Edit Untracked" : "Add Untracked"}
                              </button>
                            )}
                          </div>
                        )}
                        {hasBatches   && <span className="text-[9px] text-gray-400">{manualBatches[li.id].length} batch(es)</span>}
                        {hasSerials   && <span className="text-[9px] text-gray-400">{manualSerials[li.id].length} serial(s)</span>}
                        {hasUntracked && <span className="text-[9px] text-gray-400">{manualUntracked[li.id].length} untracked</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* New rows added during edit */}
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
                                sku_name:      item?.sku_name,
                                sku_code:      item?.sku_code,
                                mrp:           item?.mrp,
                                selling_price: item?.selling_price,
                                discount_amount: item?.discount_amount,
                                tax_amount:    item?.tax_amount,
                                total_amount:  item?.total_amount,
                                final_amount:  item?.final_amount,
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

              {/* Add another item row */}
              {editMode && (() => {
                const takenIds  = editRows.map((r) => String(r.order_line_item_id));
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
          skuName={batchModal.product_sku?.sku_name}
          totalQty={batchModal.quantity}
          savedData={manualBatches[batchModal.id] ?? []}
          onSave={(rows) => {
            setManualBatches((prev) => ({ ...prev, [batchModal.id]: rows }));
            setBatchModal(null);
          }}
        />
      )}

      {/* ── Serial Modal ── */}
      {serialModal && (
        <SerialEntryModal
          isOpen={!!serialModal}
          onClose={() => setSerialModal(null)}
          skuName={serialModal.product_sku?.sku_name}
          totalQty={serialModal.quantity}
          savedData={manualSerials[serialModal.id] ?? []}
          onSave={(serials) => {
            setManualSerials((prev) => ({ ...prev, [serialModal.id]: serials }));
            setSerialModal(null);
          }}
        />
      )}

      {/* ── Untracked Modal ── */}
      {untrackedModal && (
        <UntrackedEntryModal
          isOpen={!!untrackedModal}
          onClose={() => setUntrackedModal(null)}
          skuName={untrackedModal.product_sku?.sku_name}
          totalQty={untrackedModal.quantity}
          savedData={manualUntracked[untrackedModal.id] ?? []}
          onSave={(rows) => {
            setManualUntracked((prev) => ({ ...prev, [untrackedModal.id]: rows }));
            setUntrackedModal(null);
          }}
        />
      )}

      {/* ── Unassigned Popup ── */}
      {unassignedPopup && (
        <UnassignedPopup items={unassignedPopup} onClose={() => setUnassignedPopup(null)} />
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
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shrink-0 cursor-pointer">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <h2 className="text-base font-bold text-gray-800">Change Selection Type</h2>
        </div>

        <div className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto">
          {/* SKU info */}
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

          {/* Selection type — custom dropdown list (no native select to avoid double arrow) */}
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

        {/* Save */}
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
function BatchEntryModal({ isOpen, onClose, skuName, totalQty, savedData, onSave }) {
  const [rows, setRows] = useState([{ id: Date.now(), batch_code: "", quantity: "" }]);

  useEffect(() => {
    if (!isOpen) return;
    setRows(savedData.length ? savedData.map((r) => ({ ...r, id: Math.random() })) : [{ id: Date.now(), batch_code: "", quantity: "" }]);
  }, [isOpen]);

  const totalEntered = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const isValid = totalEntered === totalQty && rows.every((r) => r.batch_code.trim() && Number(r.quantity) > 0);

  const updateRow = (id, field, val) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const addRow    = () => setRows((prev) => [...prev, { id: Date.now(), batch_code: "", quantity: "" }]);
  const removeRow = (id) => setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  if (!isOpen) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <ModalHeader title="Assign Batches" onClose={onClose} />
        <div className="px-6 py-3">
          <SkuSummaryBar skuName={skuName} label="Total Qty" value={totalQty} entered={totalEntered} />
        </div>
        <div className="px-6 pb-4 max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Batch Code</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Quantity</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      value={r.batch_code}
                      onChange={(e) => updateRow(r.id, "batch_code", e.target.value)}
                      placeholder="e.g. BATCH-001"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min={1}
                      value={r.quantity}
                      onChange={(e) => { const v = parseInt(e.target.value); updateRow(r.id, "quantity", isNaN(v) || v < 1 ? "" : v); }}
                      placeholder="Qty"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(r.id)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" />Add Batch
          </button>
        </div>
        {totalEntered !== totalQty && (
          <p className="px-6 text-[11px] text-red-500">Total entered ({totalEntered}) must equal required quantity ({totalQty}).</p>
        )}
        <ModalFooter onClose={onClose} onSave={() => isValid && onSave(rows.map(({ id, ...rest }) => rest))} saveLabel="Confirm" saveDisabled={!isValid} />
      </div>
    </ModalOverlay>
  );
}

// ─── Serial Entry Modal ────────────────────────────────────────────────────────
function SerialEntryModal({ isOpen, onClose, skuName, totalQty, savedData, onSave }) {
  const makeChip = (value = "") => ({ _id: Math.random().toString(36).slice(2), value });

  const [chips, setChips]           = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding]         = useState(false);
  const [inputError, setInputError] = useState("");
  const [editingId, setEditingId]   = useState(null);
  const [shouldFocus, setShouldFocus] = useState(false);
  const inputRef = useRef(null);

  // Init on open
  useEffect(() => {
    if (!isOpen) return;
    setChips(savedData?.length ? savedData.map((s) => makeChip(s)) : []);
    setInputValue("");
    setEditingId(null);
    setInputError("");
  }, [isOpen]);

  useEffect(() => {
    if (shouldFocus && inputRef.current) { inputRef.current.focus(); setShouldFocus(false); }
  }, [chips, shouldFocus]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const total     = Number(totalQty);
  const entered   = chips.length;
  const remaining = total - entered;
  const isFull    = remaining <= 0;

  const isDuplicate = (val, excludeId = null) =>
    chips.some((c) => c.value === val.trim() && c._id !== excludeId);

  // No verification — just allow any value (API to be wired later)
  const commitInput = async () => {
    const val = inputValue.trim();
    if (!val) return;
    setInputError("");

    if (isDuplicate(val, editingId)) { setInputError("This serial number already exists."); return; }

    if (editingId) {
      const original = chips.find((c) => c._id === editingId);
      if (original?.value === val) { setEditingId(null); setInputValue(""); return; }
    }

    if (!editingId && isFull) return;

    setAdding(true);
    try {
      // ── API verification placeholder (leave URL empty for now) ──
      // await fetch(``, { method: "POST", ... });

      if (editingId) {
        setChips((prev) => prev.map((c) => c._id === editingId ? { ...c, value: val } : c));
        setEditingId(null);
      } else {
        setChips((prev) => [...prev, makeChip(val)]);
      }
      setInputValue("");
      setShouldFocus(true);
    } catch (err) {
      setInputError(err.message);
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitInput(); }
    if (e.key === "Escape" && editingId) { setEditingId(null); setInputValue(""); setInputError(""); }
    if (e.key === "Backspace" && !inputValue && !editingId && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const startEdit = (chip) => {
    setEditingId(chip._id);
    setInputValue(chip.value);
    setInputError("");
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
  };

  const cancelEdit = () => {
    setEditingId(null); setInputValue(""); setInputError(""); inputRef.current?.focus();
  };

  const removeChip = (id) => {
    if (editingId === id) { setEditingId(null); setInputValue(""); setInputError(""); }
    setChips((prev) => prev.filter((c) => c._id !== id));
    inputRef.current?.focus();
  };

  const handleSave = () => {
    if (entered !== total) return;
    onSave(chips.map((c) => c.value));
    onClose();
  };

  if (!isOpen) return null;

  const inputPlaceholder = editingId
    ? "Edit serial number…"
    : isFull ? "All serials entered"
    : "Enter a serial number…";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Serial Numbers</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SKU bar */}
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

        {/* Counter row */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
          <span className="text-sm font-semibold text-gray-700">Enter Serials ({entered})</span>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />{entered} entered
            </span>
            <span className="text-gray-300">|</span>
            {remaining > 0
              ? <span className="text-amber-500">{remaining} remaining</span>
              : <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> All done!</span>}
          </div>
        </div>

        <div className="px-6 pb-2 flex-1 min-h-0 flex flex-col gap-3">

          {/* Input box */}
          <div className="shrink-0">
            {editingId && (
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Editing serial
                </span>
                <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
              </div>
            )}

            <div className={`w-64 mx-auto flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors
              ${editingId
                ? "border-blue-400 ring-2 ring-blue-100 bg-white"
                : isFull
                  ? "border-gray-100 bg-gray-50"
                  : "border-gray-200 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"}`}
            >
              <input
                ref={inputRef}
                className="w-56 border-none outline-none bg-transparent text-sm text-gray-800 placeholder-gray-300 font-mono"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                disabled={adding || (isFull && !editingId)}
              />
              {adding ? (
                <span className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin shrink-0" />
              ) : (
                <button
                  onClick={commitInput}
                  disabled={!inputValue.trim() || (isFull && !editingId)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold transition-all
                    ${inputValue.trim() && (!isFull || editingId)
                      ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                >
                  {editingId ? "Update" : "Add"}
                </button>
              )}
            </div>

            {inputError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{inputError}
              </div>
            )}

            {!isFull && !inputError && !editingId && (
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 justify-center">
                <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Enter</kbd> to add</span>
                <span>·</span>
                <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">⌫</kbd> remove last</span>
                <span>·</span>
                <span>Click a serial to edit</span>
              </div>
            )}
            {editingId && !inputError && (
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 justify-center">
                <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Enter</kbd> to update</span>
                <span>·</span>
                <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Esc</kbd> to cancel</span>
              </div>
            )}
          </div>

          {/* Chips area */}
          <div className="min-h-[110px] max-h-[220px] overflow-y-auto border border-gray-100 rounded-xl p-2 flex flex-wrap gap-1.5 content-start bg-gray-50">
            {chips.map((chip, idx) => {
              const isBeingEdited = editingId === chip._id;
              return (
                <div
                  key={chip._id}
                  onClick={() => !isBeingEdited && startEdit(chip)}
                  title={isBeingEdited ? "Currently editing" : "Click to edit"}
                  className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md border text-xs font-medium max-w-[220px] transition-all cursor-pointer
                    ${isBeingEdited
                      ? "bg-blue-100 border-blue-400 text-blue-700 ring-1 ring-blue-300"
                      : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"}`}
                >
                  <span className="text-[10px] font-bold text-gray-800 bg-gray-100 rounded px-1.5 shrink-0 font-mono">#{idx + 1}</span>
                  <span className="truncate max-w-[140px] font-mono">{chip.value}</span>
                  {isBeingEdited && <Pencil className="w-3 h-3 text-blue-400 shrink-0" />}
                  <button
                    className="w-4 h-4 flex items-center justify-center rounded text-blue-300 hover:bg-red-100 hover:text-red-500 transition-colors shrink-0"
                    onClick={(e) => { e.stopPropagation(); removeChip(chip._id); }}
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {isFull && (
              <div className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> All {total} serial numbers entered
              </div>
            )}
            {chips.length === 0 && (
              <div className="w-full flex items-center justify-center py-4 text-xs text-gray-400">
                Added serials will appear here…
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center items-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100 mt-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            Go Back
          </button>
          <button
            onClick={handleSave}
            disabled={entered !== total || !!editingId}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2
              ${entered === total && !editingId
                ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            {entered === total && !editingId && <CheckCircle2 className="w-4 h-4" />}
            {editingId ? "Finish editing first" : entered === total ? "Save Serials" : `Save (${entered} / ${total})`}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Untracked Entry Modal ─────────────────────────────────────────────────────
function UntrackedEntryModal({ isOpen, onClose, skuName, totalQty, savedData, onSave }) {
  const [rows, setRows] = useState([{ id: Date.now(), untracked_number: "", quantity: "" }]);

  useEffect(() => {
    if (!isOpen) return;
    setRows(savedData.length ? savedData.map((r) => ({ ...r, id: Math.random() })) : [{ id: Date.now(), untracked_number: "", quantity: "" }]);
  }, [isOpen]);

  const totalEntered = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const isValid = totalEntered === totalQty && rows.every((r) => r.untracked_number.trim() && Number(r.quantity) > 0);

  const updateRow = (id, field, val) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));
  const addRow    = () => setRows((prev) => [...prev, { id: Date.now(), untracked_number: "", quantity: "" }]);
  const removeRow = (id) => setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  if (!isOpen) return null;
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <ModalHeader title="Assign Untracked Numbers" onClose={onClose} />
        <div className="px-6 py-3">
          <SkuSummaryBar skuName={skuName} label="Total Qty" value={totalQty} entered={totalEntered} />
        </div>
        <div className="px-6 pb-4 max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Untracked Number</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Quantity</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      value={r.untracked_number}
                      onChange={(e) => updateRow(r.id, "untracked_number", e.target.value)}
                      placeholder="e.g. GRN-001"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min={1}
                      value={r.quantity}
                      onChange={(e) => { const v = parseInt(e.target.value); updateRow(r.id, "quantity", isNaN(v) || v < 1 ? "" : v); }}
                      placeholder="Qty"
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(r.id)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" />Add Row
          </button>
        </div>
        {totalEntered !== totalQty && (
          <p className="px-6 text-[11px] text-red-500">Total entered ({totalEntered}) must equal required quantity ({totalQty}).</p>
        )}
        <ModalFooter onClose={onClose} onSave={() => isValid && onSave(rows.map(({ id, ...rest }) => rest))} saveLabel="Confirm" saveDisabled={!isValid} />
      </div>
    </ModalOverlay>
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
      <button onClick={onClose} className="w-36 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
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
  const match = entered === value;
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

// ─── Small reusables ──────────────────────────────────────────────────────────
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
    created:          "bg-blue-100 text-blue-700",
    packed:           "bg-amber-100 text-amber-700",
    invoiced:         "bg-purple-100 text-purple-700",
    dispatched:       "bg-green-100 text-green-700",
    delivered:        "bg-emerald-100 text-emerald-700",
    return_initiated: "bg-orange-100 text-orange-700",
    cancelled:        "bg-red-100 text-red-600",
    return_completed: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
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
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const ref                   = useRef(null);
  const inputRef              = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const selected = options.find((o) => o[valueKey] === value);
  const filtered = options.filter((o) =>
    (o[labelKey] ?? "").toString().toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={ref}>
      {/* Trigger button */}
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

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-max min-w-full max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Search */}
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

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
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
                      ${isSelected
                        ? "bg-primary/8 text-primary font-semibold"
                        : "text-gray-700 hover:bg-gray-50"}`}
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