"use client";

import { useEffect, useRef, useState,useMemo } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "react-toastify";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

// ── Main Component ────────────────────────────────────────────────────────────
// Props:
//   shipment           - original forward shipment object
//   return_shipment_id - if provided, skip step 1 and load return shipment directly
//   onCancel           - cancel handler
//   onSuccess          - called after complete return succeeds
export default function ReturnShipment({ shipment, return_shipment_id, onCancel, onSuccess, fromChild = false, setShowReturnPanel = null }) {
  // If return_shipment_id is passed in, we start at step 2 immediately
  const [step, setStep] = useState(return_shipment_id ? 2 : 1);

  // Step 1 state
  const [returnReason, setReturnReason] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [initiating, setInitiating] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 2 state
  const [returnShipment, setReturnShipment] = useState(null);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [inventoryRequired, setInventoryRequired] = useState(true);
  const [createReplacement, setCreateReplacement] = useState(false);
  const [returningQtys, setReturningQtys] = useState({});
  const [batchModal, setBatchModal] = useState(null);
  const [serialModal, setSerialModal] = useState(null);
  const [untrackedModal, setUntrackedModal] = useState(null);
  const [batchSelections, setBatchSelections] = useState({});
  const [serialSelections, setSerialSelections] = useState({});
  const [untrackedSelections, setUntrackedSelections] = useState({});
  const [completing, setCompleting] = useState(false);

  const [batchAllocations, setBatchAllocations] = useState([]);
  const [serialAllocations, setSerialAllocations] = useState([]);
  const [untrackedAllocations, setUntrackedAllocations] = useState([]);

  // If return_shipment_id is passed, auto-fetch on mount
  useEffect(() => {
    if (return_shipment_id) {
      fetchReturnShipment(return_shipment_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [return_shipment_id]);

  // SKU options from original shipment
  const skuOptions = (shipment?.line_items ?? []).map((li) => ({
    id: li.id,
    shipment_line_item_id: li.id,
    sku_name: li.product_sku?.sku_name,
    sku_code: li.product_sku?.sku_code,
    mrp: li.mrp,
    selling_price: li.selling_price,
    final_amount: li.final_amount,
    quantity: li.quantity,
    max_qty: li.quantity,
    order_line_item_id: li.order_line_item?.id,
    tracking_type: li.product_sku?.tracking_type,
  }));

  const takenSkuIds = lineItems.map((r) => r._skuId).filter(Boolean);

  // ── Step 1 handlers ──────────────────────────────────────────────────────────
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        order_line_item_id: null,
        sku_name: null,
        sku_code: null,
        quantity: "",
        mrp: null,
        selling_price: null,
        final_amount: null,
        shipment_line_item_id: null,
        max_qty: null,
        tracking_type: null,
        _skuId: null,
      },
    ]);
  };

  const removeLineItem = (tempId) =>
    setLineItems((prev) => prev.filter((r) => r.tempId !== tempId));

  const updateLineItem = (tempId, field, val) =>
    setLineItems((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, [field]: val } : r)));

  const handleSkuSelect = (tempId, skuId) => {
    const sku = skuOptions.find((s) => s.id === skuId);
    if (!sku) return;
    setLineItems((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? {
            ...r,
            order_line_item_id: sku.order_line_item_id,
            shipment_line_item_id: sku.id,
            sku_name: sku.sku_name,
            sku_code: sku.sku_code,
            mrp: sku.mrp,
            selling_price: sku.selling_price,
            final_amount: sku.final_amount,
            max_qty: sku.max_qty,
            tracking_type: sku.tracking_type,
            quantity: "",
            _skuId: skuId,
          }
          : r
      )
    );
  };

  const validate = () => {
    console.log(lineItems);
    const errs = {};
    if (!returnReason || returnReason.trim().length < 6)
      errs.returnReason = "Return reason must be at least 6 characters.";
    if (lineItems.length === 0) errs.lineItems = "Add at least one line item.";
    lineItems.forEach((li, idx) => {
      if (!li._skuId) errs[`sku_${idx}`] = "Select a SKU.";
      if (!li.quantity || li.quantity < 1) errs[`qty_${idx}`] = "Qty must be ≥ 1.";
      if (li.max_qty && li.quantity > li.max_qty) errs[`qty_${idx}`] = `Max qty is ${li.max_qty}.`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInitiateReturn = async () => {
    if (!validate()) return;
    setInitiating(true);
    try {
      const body = {
        return_reason: returnReason,
        line_items: lineItems.map((li) => ({
          id: li.order_line_item_id,
          shipment_line_item_id: li.shipment_line_item_id,
          quantity: Number(li.quantity),
        })),
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipment?.id}/initiate_return`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? "Failed to initiate return");
      toast.success("Return initiated!");
      fetchReturnShipment(json?.data?.id);
      // Auto-populate from response directly (no second GET needed)
      populateStep2(json.data);
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInitiating(false);
    }
  };

  // ── Step 2 helpers ────────────────────────────────────────────────────────────

  // Populate tracking selections from line item meta (when meta has data)
  const populateSelectionsFromMeta = (lineItems) => {
    const batches = {};
    const serials = {};
    const untracked = {};
    lineItems.forEach((li) => {
      const meta = li.meta ?? {};
      if (meta.allocated_batches?.length) {
        // Keep max from meta quantity so modals can reference it
        batches[li.id] = meta.allocated_batches.map((b) => ({
          id: Math.random(),
          batch_code: b.batch_code,
          quantity: b.quantity,
          max: b.quantity,
        }));
      }
      if (meta.allocated_serials?.length) {
        serials[li.id] = new Set(meta.allocated_serials);
      }
      if (meta.allocated_untracked?.length) {
        untracked[li.id] = meta.allocated_untracked.map((u) => ({
          id: Math.random(),
          untracked_number: u.untracked_number,
          quantity: u.quantity,
          max: u.quantity,
        }));
      }
    });
    setBatchSelections(batches);
    setSerialSelections(serials);
    setUntrackedSelections(untracked);
  };

  // Populate tracking selections from /return_allocation_info endpoint response
  const populateSelectionsFromAllocationInfo = (allocationData, lineItems) => {
    const batches = {};
    const serials = {};
    const untracked = {};
    allocationData.forEach((alloc) => {
      const li = lineItems.find((l) => l.id === alloc.shipment_line_item_id);
      if (!li) return;
      if (alloc.allocated_batches?.length) {
        batches[li.id] = alloc.allocated_batches.map((b) => ({
          id: Math.random(),
          batch_code: b.batch_code,
          quantity: b.quantity,
          max: b.quantity,
        }));
      }
      if (alloc.allocated_serials?.length) {
        serials[li.id] = new Set(alloc.allocated_serials);
      }
      if (alloc.allocated_untracked?.length) {
        untracked[li.id] = alloc.allocated_untracked.map((u) => ({
          id: Math.random(),
          untracked_number: u.untracked_number,
          quantity: u.quantity,
          max: u.quantity,
        }));
      }
    });
    setBatchSelections(batches);
    setSerialSelections(serials);
    setUntrackedSelections(untracked);
  };

  const populateStep2 = (data) => {
    setReturnShipment(data);
    const qtys = {};
    (data?.line_items ?? []).forEach((li) => { qtys[li.id] = li.quantity; });
    setReturningQtys(qtys);
    setBatchSelections({});
    setSerialSelections({});
    setUntrackedSelections({});
  };

  const fetchReturnShipment = async (id) => {
    setLoadingReturn(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${id}`
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? "Failed to load return shipment");

      const data = json.data;
      setReturnShipment(data);
      const lineItems = data?.line_items ?? [];
      const qtys = {};
      lineItems.forEach((li) => { qtys[li.id] = li.quantity; });
      setReturningQtys(qtys);

      // Check if any line item has tracking data in its meta
      const hasMetaTracking = lineItems.some((li) => {
        const meta = li.meta ?? {};
        return (
          meta.allocated_batches?.length ||
          meta.allocated_serials?.length ||
          meta.allocated_untracked?.length
        );
      });

      if (hasMetaTracking) {
        populateSelectionsFromMeta(lineItems);
      } else {
        // meta is empty — fetch allocation info from dedicated endpoint
        try {
          const allocRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${id}/return_allocation_info`
          );
          const allocJson = await allocRes.json();
          if (allocRes.ok && allocJson.status !== "failure" && allocJson.data?.length) {
            populateSelectionsFromAllocationInfo(allocJson.data, lineItems);
            setBatchAllocations(allocJson?.data ?? {});
            setSerialAllocations(allocJson?.data ?? {});
            setUntrackedAllocations(allocJson?.data ?? {});
          } else {
            setBatchSelections({});
            setSerialSelections({});
            setUntrackedSelections({});
          }
        } catch {
          setBatchSelections({});
          setSerialSelections({});
          setUntrackedSelections({});
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingReturn(false);
    }
  };

  const handleCompleteReturn = async () => {
    setCompleting(true);
    try {
      const retLineItems = (returnShipment?.line_items ?? []).map((li) => {
        const trackingType = li.product_sku?.tracking_type ?? "untracked";
        const item = { shipment_line_item_id: li.id };
        if (inventoryRequired) {
          if (trackingType === "batch") {
            // Only include rows where quantity > 0
            item.batch = (batchSelections[li.id] ?? [])
              .filter((b) => Number(b.quantity) > 0)
              .map((b) => ({
                batch_code: b.batch_code,
                quantity: Number(b.quantity),
              }));
          } else if (trackingType === "serial") {
            // Send only the serials the user actually selected
            item.serial = [...(serialSelections[li.id] ?? new Set())];
          } else {
            // Only include rows where quantity > 0
            item.untracked = (untrackedSelections[li.id] ?? [])
              .filter((u) => Number(u.quantity) > 0)
              .map((u) => ({
                untracked_number: u.untracked_number,
                quantity: Number(u.quantity),
              }));
          }
        }
        return item;
      });

      const body = {
        inventory_required: inventoryRequired,
        create_replacement: createReplacement,
        line_items: retLineItems,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${returnShipment?.id}/complete_return`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? "Failed to complete return");
      toast.success("Return completed successfully!");
      // Refresh shipment data to reflect return_completed state
      await fetchReturnShipment(returnShipment?.id);
      if (setShowReturnPanel) setShowReturnPanel(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const getTrackingStatus = (li) => {
    if (!inventoryRequired) return { complete: true, label: "—" };
    const trackingType = li.product_sku?.tracking_type ?? "untracked";
    const qty = returningQtys[li.id] ?? li.quantity;
    if (trackingType === "batch") {
      const total = (batchSelections[li.id] ?? []).reduce((s, b) => s + Number(b.quantity), 0);
      return { complete: total === Number(qty), label: `${total}/${qty} batched` };
    }
    if (trackingType === "serial") {
      const count = (serialSelections[li.id] ?? new Set()).size;
      return { complete: count === Number(qty), label: `${count}/${qty} serials` };
    }
    const total = (untrackedSelections[li.id] ?? []).reduce((s, u) => s + Number(u.quantity), 0);
    return { complete: total === Number(qty), label: `${total}/${qty} untracked` };
  };

  const isCompleteReturnValid = () => {
    if (!inventoryRequired) return true;
    return (returnShipment?.line_items ?? []).every((li) => getTrackingStatus(li).complete);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className={`${fromChild ? "bg-gray-50" : "bg-white"}  rounded-xl border border-gray-100 shadow-sm overflow-visible`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h2 className="flex-1 text-sm font-bold text-primary">
          Return Shipment
        </h2>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step === 1
              ? "bg-primary border-primary text-white"
              : "bg-green-500 border-green-500 text-white"
              }`}
          >
            {step === 1 ? "1" : <Check className="w-3.5 h-3.5" />}
          </div>
          <div className={`w-16 h-0.5 ${step >= 2 ? "bg-primary" : "bg-gray-300"}`} />
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step >= 2
              ? "bg-primary border-primary text-white"
              : "bg-white border-gray-300 text-gray-400"
              }`}
          >
            2
          </div>
        </div>
      </div>

      {/* ════════════════ STEP 1 ════════════════ */}
      {step === 1 && (
        <>
          {/* Return Reason */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">
                  Return Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => {
                    setReturnReason(e.target.value);
                    setErrors((p) => ({ ...p, returnReason: undefined }));
                  }}
                  placeholder="Enter a min. of 6 Characters"
                  rows={2}
                  className={`w-full text-xs border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 resize-none ${errors.returnReason ? "border-red-400" : "border-gray-200"
                    }`}
                />
                {errors.returnReason && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.returnReason}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items table header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-primary">Shipment Line Items</h3>
          </div>

          {/* Line Items table */}
          <div className="overflow-visible">
            <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "5%" }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["SKU Name", "Quantity", "MRP", "Effective Price", "Final Amt.", ""].map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((row, idx) => {
                  const availableSkus = skuOptions.filter(
                    (s) => !takenSkuIds.includes(s.id) || s.id === row._skuId
                  );
                  return (
                    <tr key={row.tempId} className="align-middle">
                      <td className="px-3 py-3">
                        <InlineDropdown
                          placeholder="Select SKU…"
                          options={availableSkus}
                          value={row._skuId ?? null}
                          onChange={(val) => handleSkuSelect(row.tempId, val)}
                          valueKey="id"
                          labelKey="sku_name"
                          renderOption={(opt) => (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-gray-800 text-xs leading-snug">{opt.sku_name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{opt.sku_code}</span>
                            </div>
                          )}
                          renderSelected={(opt) => (
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="text-xs font-medium text-gray-800 leading-tight truncate">{opt.sku_name}</span>
                              <span className="text-[10px] text-gray-400 font-mono truncate">{opt.sku_code}</span>
                            </div>
                          )}
                        />
                        {errors[`sku_${idx}`] && (
                          <p className="text-[10px] text-red-500 mt-0.5">{errors[`sku_${idx}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          max={row.max_qty ?? undefined}
                          value={row.quantity ?? ""}
                          onChange={(e) => {
                            updateLineItem(row.tempId, "quantity", e.target.value === "" ? ""  : parseInt(e.target.value))
                          }
                          }
                          onWheel={(e) => e.target.blur()}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center"
                        />
                        {errors[`qty_${idx}`] && (
                          <p className="text-[10px] text-red-500 mt-0.5">{errors[`qty_${idx}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">
                        {row.mrp ? fmt(row.mrp) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">
                        {row.selling_price ? fmt(row.selling_price) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-primary tabular-nums">
                        {row.final_amount
                          ? fmt((parseFloat(row.final_amount) / row.max_qty) * row.quantity)
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => removeLineItem(row.tempId)}
                          className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td colSpan={6} className="px-3 py-2.5">
                    {skuOptions.length > takenSkuIds.length ? (
                      <button
                        onClick={addLineItem}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add another Item
                      </button>
                    ) : (
                      lineItems.length === 0 && (
                        <p className="text-xs text-gray-400 py-4 text-center">
                          Click "Add another Item" to add SKUs to return
                        </p>
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {errors.lineItems && (
            <p className="px-5 pb-2 text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.lineItems}
            </p>
          )}

          {/* Step 1 Action Buttons */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={handleInitiateReturn}
              disabled={initiating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
            >
              {initiating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              {initiating ? "Initiating..." : "1. Initiate Return"}
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* ════════════════ STEP 2 ════════════════ */}
      {step === 2 && (
        <>
          {loadingReturn ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs text-gray-400">Loading return shipment…</p>
            </div>
          ) : (
            <>
              {/* Meta strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
                <MetaCell
                  label="Shipment Number"
                  value={<span className="font-bold text-gray-800">{returnShipment?.shipment_number}</span>}
                />
                <MetaCell label="Status" value={<StatusBadge status={returnShipment?.status} />} />
                <MetaCell
                  label="Node"
                  value={<span className="font-semibold text-gray-800">{returnShipment?.node?.name ?? "—"}</span>}
                />
                <MetaCell
                  label="Final Amount"
                  value={
                    <span className="font-bold text-gray-800">
                      {fmt(returnShipment?.aggregates?.final_amount)}
                    </span>
                  }
                />
              </div>

              {/* Toggles — read-only when completed */}
              <div className="flex items-center gap-8 px-6 py-3.5 border-t border-gray-100 bg-gray-50/40">
                <ToggleField
                  label="Inventory Required"
                  value={inventoryRequired}
                  onChange={returnShipment?.status === "return_completed" ? undefined : setInventoryRequired}
                  readOnly={returnShipment?.status === "return_completed"}
                />
                <ToggleField
                  label="Create Replacement"
                  value={createReplacement}
                  onChange={returnShipment?.status === "return_completed" ? undefined : setCreateReplacement}
                  readOnly={returnShipment?.status === "return_completed"}
                />
              </div>

              {/* Return line items table header */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <h3 className="text-sm font-bold text-primary">Return Shipment Line Items</h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  Shipment #{returnShipment?.shipment_number}
                </span>
              </div>

              {/* Return line items table */}
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: inventoryRequired ? "24%" : "28%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "10%" }} />
                    {inventoryRequired && <col style={{ width: "14%" }} />}
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {[
                        "SKU Name",
                        "Qty",
                        "MRP",
                        "Selling Price",
                        "Discount",
                        "Tax",
                        "Final Amt.",
                        ...(inventoryRequired ? ["Return Qty"] : []),
                      ].map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wide"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(returnShipment?.line_items ?? []).map((li) => {
                      const trackingType = li.product_sku?.tracking_type ?? "untracked";
                      const status = getTrackingStatus(li);
                      const qty = returningQtys[li.id] ?? li.quantity;
                      const isCompleted = returnShipment?.status === "return_completed";

                      return (
                        <tr key={li.id} className="hover:bg-gray-50/50 transition-colors align-top">
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-gray-800 leading-snug break-words whitespace-normal">
                                {li.product_sku?.sku_name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono truncate">
                                {li.product_sku?.sku_code}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{li.quantity}</td>
                          <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.mrp)}</td>
                          <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.selling_price)}</td>
                          <td className="px-3 py-3 text-xs tabular-nums">
                            {parseFloat(li.discount_amount) > 0 ? (
                              <span className="text-red-500">-{fmt(li.discount_amount)}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">{fmt(li.tax_amount)}</td>
                          <td className="px-3 py-3 text-xs font-semibold text-primary tabular-nums">
                            {fmt(li.final_amount)}
                          </td>

                          {inventoryRequired && (
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1.5">
                                {/* Qty: plain text when completed, editable input otherwise */}
                                {isCompleted ? (
                                  <span className="text-xs font-semibold text-gray-800 text-center block">
                                    {qty}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min={1}
                                    max={li.quantity}
                                    value={qty}
                                    onChange={(e) => {
                                      const v = Math.min(
                                        Math.max(1, parseInt(e.target.value) || 1),
                                        li.quantity
                                      );
                                      setReturningQtys((prev) => ({ ...prev, [li.id]: v }));
                                      setBatchSelections((prev) => ({ ...prev, [li.id]: [] }));
                                      setSerialSelections((prev) => ({ ...prev, [li.id]: new Set() }));
                                      setUntrackedSelections((prev) => ({ ...prev, [li.id]: [] }));
                                    }}
                                    onWheel={(e) => e.target.blur()}
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center"
                                  />
                                )}
                                {/* Tracking button — always clickable (view-only when completed) */}
                                <button
                                  onClick={() => {
                                    if (trackingType === "batch") setBatchModal({ li, qty, readOnly: isCompleted, isConfirmed: status.complete });
                                    else if (trackingType === "serial") setSerialModal({ li, qty, readOnly: isCompleted, isConfirmed: status.complete });
                                    else setUntrackedModal({ li, qty, readOnly: isCompleted, isConfirmed: status.complete });
                                  }}
                                  className={`inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer transition-colors ${status.complete
                                    ? "text-emerald-600 hover:text-emerald-700"
                                    : "text-primary hover:underline"
                                    }`}
                                >
                                  {status.complete ? (
                                    <><CheckCircle2 className="w-3 h-3" /> {status.label}</>
                                  ) : (
                                    <><Plus className="w-2.5 h-2.5" /> Assign {trackingType}</>
                                  )}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Step 2 Action Buttons — hidden when return_completed */}
              {returnShipment?.status !== "return_completed" && (
                <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={handleCompleteReturn}
                    disabled={completing || !isCompleteReturnValid()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
                  >
                    {completing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-3.5 h-3.5" />
                    )}
                    {completing ? "Completing…" : "Complete Return"}
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Batch Modal ── */}
      {batchModal && (
        <ReturnBatchModal
          isOpen={!!batchModal}
          onClose={() => setBatchModal(null)}
          lineItem={batchModal.li}
          returningQty={batchModal.qty}
          // Pass full saved rows (which include id + max) so modal can rehydrate properly
          savedData={
            batchModal.isConfirmed
              ? batchSelections[batchModal.li.id] ?? []
              : []
          }
          readOnly={batchModal.readOnly ?? false}
          shipment={shipment}
          onSave={(rows) => {
            setBatchSelections((prev) => ({ ...prev, [batchModal.li.id]: rows }));
            setBatchModal(null);
          }}
          batchAllocations={batchAllocations}
        />
      )}

      {/* ── Serial Modal ── */}
      {serialModal && (
        <ReturnSerialModal
          isOpen={!!serialModal}
          onClose={() => setSerialModal(null)}
          lineItem={serialModal.li}
          returningQty={serialModal.qty}
          savedData={
            serialModal.isConfirmed
              ? serialSelections[serialModal.li.id] ?? new Set()
              : new Set()
          }
          readOnly={serialModal.readOnly ?? false}
          shipment={shipment}
          onSave={(set) => {
            setSerialSelections((prev) => ({ ...prev, [serialModal.li.id]: set }));
            setSerialModal(null);
          }}
          serialAllocations={serialAllocations}
        />
      )}

      {/* ── Untracked Modal ── */}
      {untrackedModal && (
        <ReturnUntrackedModal
          isOpen={!!untrackedModal}
          onClose={() => setUntrackedModal(null)}
          lineItem={untrackedModal.li}
          returningQty={untrackedModal.qty}
          // Pass full saved rows (which include id + max) so modal can rehydrate properly
          savedData={
            untrackedModal.isConfirmed
              ? untrackedSelections[untrackedModal.li.id] ?? []
              : []
          }
          readOnly={untrackedModal.readOnly ?? false}
          shipment={shipment}
          onSave={(rows) => {
            setUntrackedSelections((prev) => ({ ...prev, [untrackedModal.li.id]: rows }));
            setUntrackedModal(null);
          }}
          untrackedAllocations={untrackedAllocations}
        />
      )}
    </div>
  );
}

// ── Toggle Field ──────────────────────────────────────────────────────────────
function ToggleField({ label, value, onChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => !readOnly && onChange?.(!value)}
        className={`flex items-center justify-center rounded-full transition-colors ${readOnly ? "cursor-default opacity-70" : "cursor-pointer"
          } ${value ? "text-primary" : "text-gray-300"}`}
      >
        {value ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
      </button>
      <span className={`text-xs font-semibold ${value ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

// ── Return Batch Modal ────────────────────────────────────────────────────────
function ReturnBatchModal({ isOpen, onClose, lineItem, returningQty, savedData, onSave, readOnly = false, shipment, batchAllocations }) {
  // Prefer meta on lineItem; fall back to matching forward shipment line item by sku id

  const getSourceBatches = () => {
    const fromMeta = lineItem?.meta?.allocated_batches ?? [];
    if (fromMeta.length) return fromMeta;

    // 🔹 check allocation API
    const fromAlloc = (batchAllocations ?? []).find(
      (a) => a.shipment_line_item_id === lineItem?.id
    );

    if (fromAlloc?.allocated_batches?.length) {
      return fromAlloc.allocated_batches;
    }

    // fallback to forward shipment
    const fwdItem = (shipment?.line_items ?? []).find(
      (li) => li.product_sku?.id === lineItem?.product_sku?.id
    );

    return fwdItem?.meta?.allocated_batches ?? [];
  };

  const sourceBatches = getSourceBatches();

  const [rows, setRows] = useState(() => {
    // If savedData has rows, reuse them with their saved quantities intact
    // so the user sees what they previously entered when re-opening to edit
    if (savedData?.length) {
      return savedData.map((sd) => ({
        id: sd.id ?? Math.random(),
        batch_code: sd.batch_code,
        // Always restore the saved quantity — user can edit from where they left off
        quantity: sd.quantity,
        max: sd.max ?? sd.quantity,
      }));
    }
    // No saved data — build from source batches with empty quantity
    return sourceBatches.map((b) => ({
      id: Math.random(),
      batch_code: b.batch_code,
      quantity: "",
      max: b.quantity,
    }));
  });

  const totalEntered = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const isValid = readOnly || (totalEntered === Number(returningQty) && rows.every((r) => Number(r.quantity) >= 0));

  useEffect(() => {
    const source = getSourceBatches();

    if (savedData?.length) {
      setRows(savedData);
    } else if (source?.length) {
      setRows(
        source.map((b) => ({
          id: Math.random(),
          batch_code: b.batch_code,
          quantity: "",
          max: b.quantity
        }))
      );
    }
  }, [batchAllocations, lineItem, savedData]);

  const updateQty = (id, val) => {
    if (readOnly) return;
    const parsed = parseInt(val);
    const row = rows.find((r) => r.id === id);
    if (row && parsed > row.max) {
      toast.error(`Cannot exceed available quantity of ${row.max} for ${row.batch_code}.`);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: 0 } : r)));
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, quantity: isNaN(parsed) || parsed < 0 ? "" : parsed } : r))
    );
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <ModalHeader title={readOnly ? "Batch Allocation Details" : "Assign Return Batches"} onClose={onClose} />
        <div className="px-6 py-3">
          <SkuSummaryBar
            skuName={lineItem?.product_sku?.sku_name}
            label="Return Qty"
            value={returningQty}
            entered={totalEntered}
          />
        </div>
        <div className="px-6 pb-4 max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Batch Code</th>
                {!readOnly && (<th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Max Qty</th>)}
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-24">
                  {readOnly ? "Qty" : "Return Qty"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-400">
                    No batches available
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="align-middle">
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono font-semibold text-blue-700">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        {r.batch_code}
                      </span>
                    </td>
                    {!readOnly && (<td className="px-3 py-2.5 text-xs text-gray-500">{r.max}</td>)}
                    <td className="px-3 py-2.5">
                      {readOnly ? (
                        <span className="text-xs font-semibold text-gray-800">{r.quantity}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={r.max}
                          value={r.quantity}
                          onChange={(e) => updateQty(r.id, e.target.value)}
                          placeholder="Qty"
                          onWheel={(e) => e.target.blur()}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!readOnly && totalEntered !== Number(returningQty) && rows.length > 0 && (
          <p className="px-6 text-[11px] text-red-500 pb-2">
            Total entered ({totalEntered}) must equal return quantity ({returningQty}).
          </p>
        )}
        {readOnly ? (
          <div className="flex justify-center px-6 pb-5 pt-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-36 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <ModalFooter
            onClose={onClose}
            onSave={() => {
              if (isValid) {
                // FIX: Save full row objects including id and max so re-opening works correctly
                onSave(rows.map((r) => ({
                  id: r.id,
                  batch_code: r.batch_code,
                  quantity: r.quantity,
                  max: r.max,
                })));
              }
            }}
            saveLabel="Confirm"
            saveDisabled={!isValid}
          />
        )}
      </div>
    </ModalOverlay>
  );
}

// ── Return Serial Modal ───────────────────────────────────────────────────────
function ReturnSerialModal({ isOpen, onClose, lineItem, returningQty, savedData, onSave, readOnly = false, shipment, serialAllocations }) {
  // Prefer meta on lineItem; fall back to forward shipment line item
  const getSourceSerials = () => {
    const fromMeta = lineItem?.meta?.allocated_serials ?? [];
    if (fromMeta.length) return fromMeta;

    // 🔹 check allocation API
    const fromAlloc = (serialAllocations ?? []).find(
      (a) => a.shipment_line_item_id === lineItem?.id
    );

    if (fromAlloc?.allocated_serials?.length) {
      return fromAlloc.allocated_serials;
    }

    // fallback to forward shipment
    const fwdItem = (shipment?.line_items ?? []).find(
      (li) => li.product_sku?.id === lineItem?.product_sku?.id
    );

    return fwdItem?.meta?.allocated_serials ?? [];
  };

  const sourceSerials = useMemo(
    () => getSourceSerials(),
    [lineItem, shipment, serialAllocations]
  );
  // FIX: Safely convert savedData to Set regardless of whether it's already a Set or an array
  const savedSet = savedData instanceof Set ? savedData : new Set(Array.isArray(savedData) ? savedData : []);

  // In readOnly mode show all serials from savedSet merged with sourceSerials
  // FIX: When we have savedSet data, always use it as the display list (it may differ from sourceSerials)
  const serialsToShow =
    savedSet.size > 0
      ? [...savedSet]
      : sourceSerials.length > 0
        ? sourceSerials
        : [];

  // Always initialise selectedSerials from savedSet so re-opening to edit restores prior selections
  const [selectedSerials, setSelectedSerials] = useState(() => new Set(savedSet));
  const [searchQuery, setSearchQuery] = useState("");

  const total = Number(returningQty);
  const entered = selectedSerials.size;
  const remaining = total - entered;
  const isFull = remaining <= 0;

  // For non-readOnly: show sourceSerials as the available pool to select from
  const availableForSelection = sourceSerials.length > 0 ? sourceSerials : [...savedSet];
  const filtered = (readOnly ? serialsToShow : availableForSelection).filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const source = getSourceSerials();

    if (!savedData && source?.length) {
      setSelectedSerials(new Set(source));
    }
  }, [serialAllocations, lineItem]);

  const toggleSerial = (serial) => {
    if (readOnly) return;
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

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {readOnly ? "Serial Allocation Details" : "Select Returning Serials"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{lineItem?.product_sku?.sku_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded">{total}</span>
            <span className="text-gray-500">Return Qty</span>
          </div>
        </div>
        <div className="px-6 pt-4 pb-2 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-700">
              {readOnly ? `Allocated Serials (${entered})` : `Select Serials (${entered} / ${total})`}
            </span>
            {readOnly ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            ) : isFull ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> All done!
              </span>
            ) : (
              <span className="text-amber-500">{remaining} remaining</span>
            )}
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
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 px-6 pb-4 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No serials found</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {filtered.map((serial) => {
                const isChecked = selectedSerials.has(serial);
                const isDisabled = readOnly || (!isChecked && isFull);
                return (
                  <label
                    key={serial}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors
                      ${isChecked
                        ? "bg-blue-50 border-blue-300"
                        : isDisabled
                          ? "bg-gray-50 border-gray-100 opacity-50"
                          : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"}
                      ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && toggleSerial(serial)}
                      className="w-3.5 h-3.5 accent-primary shrink-0"
                    />
                    <span
                      className={`text-xs font-mono ${isChecked ? "text-blue-700 font-semibold" : "text-gray-700"
                        }`}
                    >
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
          {readOnly ? (
            <button
              onClick={onClose}
              className="w-36 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={() => { if (entered === total) onSave(selectedSerials); }}
                disabled={entered !== total}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2
                  ${entered === total
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                {entered === total && <CheckCircle2 className="w-4 h-4" />}
                {entered === total ? "Save Serials" : `Select ${remaining} more`}
              </button>
            </>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Return Untracked Modal ────────────────────────────────────────────────────
function ReturnUntrackedModal({ isOpen, onClose, lineItem, returningQty, savedData, onSave, readOnly = false, shipment, untrackedAllocations }) {
  // Prefer meta on lineItem; fall back to forward shipment line item
  const getSourceUntracked = () => {
    const fromMeta = lineItem?.meta?.allocated_untracked ?? [];
    if (fromMeta.length) return fromMeta;

    // 🔹 check allocations from API
    const fromAlloc = (untrackedAllocations ?? []).find(
      (a) => a.shipment_line_item_id === lineItem?.id
    );

    if (fromAlloc?.allocated_untracked?.length) {
      return fromAlloc.allocated_untracked;
    }

    // fallback to forward shipment
    const fwdItem = (shipment?.line_items ?? []).find(
      (li) => li.product_sku?.id === lineItem?.product_sku?.id
    );

    return fwdItem?.meta?.allocated_untracked ?? [];
  };

  const sourceUntracked = getSourceUntracked();

  const [rows, setRows] = useState(() => {
    // If savedData has rows, reuse them with their saved quantities intact
    // so the user sees what they previously entered when re-opening to edit
    if (savedData?.length) {
      return savedData.map((u) => ({
        id: u.id ?? Math.random(),
        untracked_number: u.untracked_number,
        // Always restore the saved quantity — user can edit from where they left off
        quantity: u.quantity,
        max: u.max ?? u.quantity,
      }));
    }
    return sourceUntracked.map((u) => ({
      id: Math.random(),
      untracked_number: u.untracked_number,
      quantity: "",
      max: u.quantity,
    }));
  });

  const totalEntered = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const isValid = readOnly || (totalEntered === Number(returningQty) && rows.every((r) => Number(r.quantity) >= 0));

  useEffect(() => {
    const source = getSourceUntracked();

    if (savedData?.length) {
      setRows(savedData);
    } else if (source?.length) {
      setRows(
        source.map((u) => ({
          id: Math.random(),
          untracked_number: u.untracked_number,
          quantity: "",
          max: u.quantity,
        }))
      );
    }
  }, [untrackedAllocations, lineItem, savedData]);

  const updateQty = (id, val) => {
    if (readOnly) return;
    const parsed = parseInt(val);
    const row = rows.find((r) => r.id === id);
    if (row && parsed > row.max) {
      toast.error(`Cannot exceed available quantity of ${row.max} for ${row.untracked_number}.`);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: row.max } : r)));
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, quantity: isNaN(parsed) || parsed < 0 ? "" : parsed } : r))
    );
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <ModalHeader title={readOnly ? "Untracked Allocation Details" : "Assign Return Untracked"} onClose={onClose} />
        <div className="px-6 py-3">
          <SkuSummaryBar
            skuName={lineItem?.product_sku?.sku_name}
            label="Return Qty"
            value={returningQty}
            entered={totalEntered}
          />
        </div>
        <div className="px-6 pb-4 max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Untracked Number</th>
                {!readOnly && (<th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">Max Qty</th>)}
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-24">
                  {readOnly ? "Qty" : "Return Qty"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-400">
                    No untracked numbers available
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="align-middle">
                    <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-semibold text-amber-700">
                        <CheckCircle2 className="w-3 h-3 text-amber-500" />
                        {r.untracked_number}
                      </span>
                    </td>
                    {!readOnly && (<td className="px-3 py-2.5 text-xs text-gray-500">{r.max}</td>)}
                    <td className="px-3 py-2.5">
                      {readOnly ? (
                        <span className="text-xs font-semibold text-gray-800">{r.quantity}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={r.max}
                          value={r.quantity}
                          onChange={(e) => updateQty(r.id, e.target.value)}
                          placeholder="Qty"
                          onWheel={(e) => e.target.blur()}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!readOnly && totalEntered !== Number(returningQty) && rows.length > 0 && (
          <p className="px-6 text-[11px] text-red-500 pb-2">
            Total entered ({totalEntered}) must equal return quantity ({returningQty}).
          </p>
        )}
        {readOnly ? (
          <div className="flex justify-center px-6 pb-5 pt-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-36 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <ModalFooter
            onClose={onClose}
            onSave={() => {
              if (isValid) {
                // FIX: Save full row objects including id and max so re-opening works correctly
                onSave(rows.map((r) => ({
                  id: r.id,
                  untracked_number: r.untracked_number,
                  quantity: r.quantity,
                  max: r.max,
                })));
              }
            }}
            saveLabel="Confirm"
            saveDisabled={!isValid}
          />
        )}
      </div>
    </ModalOverlay>
  );
}

// ── Shared Primitives ─────────────────────────────────────────────────────────
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
      <button
        onClick={onClose}
        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saveLabel = "Save", saveDisabled = false }) {
  return (
    <div className="flex justify-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100">
      <button
        onClick={onClose}
        className="w-36 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Go Back
      </button>
      <button
        onClick={onSave}
        disabled={saveDisabled}
        className={`w-36 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2
          ${saveDisabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"}`}
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
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">SKU</span>
        <span className="text-sm font-semibold text-gray-800 truncate">{skuName}</span>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
        <span className="text-gray-500">
          {label}: <span className="text-gray-800">{value}</span>
        </span>
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
    return_initiated: "bg-orange-100 text-orange-700",
    return_completed: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600"
        }`}
    >
      {status?.replace(/_/g, " ") ?? "—"}
    </span>
  );
}

// ── Inline Searchable Dropdown ────────────────────────────────────────────────
function InlineDropdown({
  placeholder = "Select…",
  options = [],
  value,
  onChange,
  valueKey = "id",
  labelKey = "name",
  renderOption,
  renderSelected,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

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
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border rounded-lg bg-white transition-colors min-h-[36px]
          ${open ? "border-primary ring-2 ring-primary/15" : "border-gray-200 hover:border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
          ${!selected ? "text-gray-400" : "text-gray-800 font-medium"}`}
      >
        <span className="leading-snug whitespace-normal break-words text-left flex-1 min-w-0">
          {selected
            ? renderSelected
              ? renderSelected(selected)
              : selected[labelKey]
            : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-colors">
              <Search className="w-3 h-3 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400 min-w-0"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-gray-300 hover:text-gray-500"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No options found</p>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt[valueKey] === value;
                return (
                  <button
                    key={opt[valueKey]}
                    type="button"
                    onClick={() => {
                      onChange(opt[valueKey]);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-start justify-between gap-2
                      ${isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <span className="leading-snug whitespace-normal break-words flex-1 min-w-0">
                      {renderOption ? renderOption(opt) : opt[labelKey]}
                    </span>
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