"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  RefreshCcw,
  ArrowLeft,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import ShipmentCancelModal from "./ShipmentCancelModal";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

export default function DropReturnShipment({
  shipment,
  return_shipment_id,
  onCancel,
  onSuccess,
  fromChild = false,
  setShowReturnPanel = null,
  backRoute = null,
}) {
  const [step, setStep] = useState(return_shipment_id ? 2 : 1);

  const [returnReason, setReturnReason] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [initiating, setInitiating] = useState(false);

  const [returnShipment, setReturnShipment] = useState(null);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [openKebab, setOpenKebab] = useState(false);
  const kebabRef = useRef(null);
  const [cancelShipmentModalOpen, setCancelShipmentModalOpen] = useState(false);
  const [rejection_reason, setRejection_reason] = useState("");
  const [cancellingReturnShipment, setCancellingReturnShipment] = useState(false);

  // Close kebab on outside click
  useEffect(() => {
    const handler = (e) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target)) setOpenKebab(false);
    };
    if (openKebab) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openKebab]);

  // Pre-fill step 1 from the existing return shipment so user can edit and re-submit
  const handleEditReturn = () => {
    if (!returnShipment) return;
    setOpenKebab(false);

    // Re-build lineItems from the return shipment's line_items
    // matching each back to the parent shipment's line item for order_line_item_id
    const rebuilt = (returnShipment.line_items ?? []).map((rli) => {
      // Find the corresponding parent shipment line item by product_sku id
      const parentLi = (shipment?.line_items ?? []).find(
        (pli) => pli.product_sku?.id === rli.product_sku?.id
      );
      return {
        tempId: Date.now() + Math.random(),
        _skuId: parentLi?.id ?? null,
        sku_name: rli.product_sku?.sku_name,
        sku_code: rli.product_sku?.sku_code,
        mrp: rli.mrp,
        max_qty: parentLi?.quantity ?? rli.quantity,
        order_line_item_id: parentLi?.order_line_item?.id ?? null,
        shipment_line_item_id: parentLi?.id ?? null,
        quantity: rli.quantity,
      };
    });

    setLineItems(rebuilt);
    setReturnReason(returnShipment.return_reason ?? "");
    setErrors({});
    setStep(1);
  };

  // SKU options derived from shipment line items
  const skuOptions = (shipment?.line_items ?? []).map((li) => ({
    id: li.id,
    sku_name: li.product_sku?.sku_name,
    sku_code: li.product_sku?.sku_code,
    mrp: li.mrp,
    quantity: li.quantity,
    order_line_item_id: li.order_line_item?.id,
  }));

  const takenSkuIds = lineItems.map((r) => r._skuId).filter(Boolean);

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        _skuId: null,
        sku_name: null,
        sku_code: null,
        mrp: null,
        max_qty: null,
        order_line_item_id: null,
        shipment_line_item_id: null,
        quantity: "",
      },
    ]);
    setErrors((p) => ({ ...p, lineItems: undefined }));
  };

  const removeLineItem = (tempId) =>
    setLineItems((prev) => prev.filter((r) => r.tempId !== tempId));

  const handleSkuSelect = (tempId, skuId) => {
    const sku = skuOptions.find((s) => s.id === skuId);
    if (!sku) return;
    setLineItems((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? {
            ...r,
            _skuId: skuId,
            sku_name: sku.sku_name,
            sku_code: sku.sku_code,
            mrp: sku.mrp,
            max_qty: sku.quantity,
            order_line_item_id: sku.order_line_item_id,
            shipment_line_item_id: sku.id,
            quantity: "",
          }
          : r
      )
    );
  };

  const updateQty = (tempId, val, idx) => {
    const row = lineItems.find((r) => r.tempId === tempId);
    const parsed = parseInt(val);
    if (row?.max_qty && !isNaN(parsed) && parsed > row.max_qty) {
      toast.error(`Cannot exceed max quantity of ${row.max_qty}`);
      setLineItems((prev) =>
        prev.map((r) => (r.tempId === tempId ? { ...r, quantity: row.max_qty } : r))
      );
      return;
    }
    setLineItems((prev) =>
      prev.map((r) =>
        r.tempId === tempId
          ? { ...r, quantity: isNaN(parsed) || parsed < 0 ? "" : parsed }
          : r
      )
    );
    setErrors((p) => ({ ...p, [`qty_${idx}`]: undefined, lineItems: undefined }));
  };

  useEffect(() => {
    if (return_shipment_id) {
      fetchReturnShipment(return_shipment_id);
    }
  }, [return_shipment_id]);

  const fetchReturnShipment = async (id) => {
    setLoadingReturn(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${id}`
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? "Failed to load return shipment");
      setReturnShipment(json.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingReturn(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!returnReason || returnReason.trim().length < 6)
      errs.returnReason = "Return reason must be at least 6 characters.";
    if (lineItems.length === 0)
      errs.lineItems = "Add at least one line item.";
    lineItems.forEach((li, idx) => {
      if (!li._skuId) errs[`sku_${idx}`] = "Select a SKU.";
      if (!li.quantity || li.quantity < 1) errs[`qty_${idx}`] = "Qty must be ≥ 1.";
      if (li.max_qty && li.quantity > li.max_qty)
        errs[`qty_${idx}`] = `Max qty is ${li.max_qty}.`;
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
        ...(returnShipment ? { return_shipment_id: returnShipment.id } : {})
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${shipment?.id}/initiate_return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? "Failed to initiate return");

      toast.success(returnShipment ? "Return updated!" : "Return initiated!");
      await fetchReturnShipment(json?.data?.id);
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInitiating(false);
    }
  };

  const handleCompleteReturn = async () => {
    setCompleting(true);
    try {
      const lineItems = (returnShipment?.line_items ?? []).map((li) => ({
        shipment_line_item_id: li.id,
      }));

      const body = {
        inventory_required: false,
        create_replacement: false,
        line_items: lineItems,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${returnShipment?.id}/complete_return`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? "Failed to complete return");

      toast.success("Return completed successfully!");
      await fetchReturnShipment(returnShipment?.id);
      if (setShowReturnPanel) setShowReturnPanel(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelReturnShipment = async () => {
    try {
      setCancellingReturnShipment(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/${returnShipment.id}/cancel?cancellation_reason=${rejection_reason}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await res.json();
      if (!res.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      toast.success("Return shipment cancelled successfully");
      await fetchReturnShipment(returnShipment?.id);
      onSuccess();
    } catch (err) {
      console.log(err);
      toast.error("Failed to cancel return shipment ", err.message);
    } finally {
      setCancellingReturnShipment(false);
    }
  }

  return (
    <div
      className={`${fromChild ? "bg-gray-50" : "bg-white"
        } rounded-xl border border-gray-100 shadow-sm overflow-visible`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {!fromChild && (
            <button
              onClick={() => backRoute?.()}
              className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <h2 className="flex-1 text-sm font-bold text-primary">
            Return Shipment
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Kebab — only on step 2 when not yet completed */}
          {step === 2 &&
            returnShipment?.status !== "return_completed" &&
            returnShipment?.status !== "cancelled" &&
            shipment && (
              <div className="relative" ref={kebabRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenKebab((p) => !p); }}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openKebab && (
                  <div
                    className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-white rounded-md shadow-lg border border-gray-100 p-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      role="button"
                      onClick={handleEditReturn}
                      className="flex items-center gap-2.5 px-2.5 rounded-md py-2 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Return
                    </div>
                    {shipment?.status !== "return_completed" && (
                      <div
                        role="button"
                        onClick={() => setCancelShipmentModalOpen(true)}
                        className="flex items-center gap-2.5 px-2.5 rounded-md py-2 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Cancel Shipment
                      </div>
                    )}

                    {cancelShipmentModalOpen && (
                      <ShipmentCancelModal isOpen={cancelShipmentModalOpen} onClose={() => setCancelShipmentModalOpen(false)} onCancel={handleCancelReturnShipment} rejection_reason={rejection_reason} setRejection_reason={setRejection_reason} />
                    )}
                  </div>
                )}
              </div>
            )}

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
      </div>

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
                  placeholder="Enter a min. of 6 characters"
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

          {/* Line items table header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-primary">Shipment Line Items</h3>
          </div>

          {/* Line items table */}
          <div className="overflow-visible">
            <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "38%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "5%" }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["SKU Name", "SKU Code", "Max Qty", "MRP", "Return Qty", ""].map((col) => (
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
                          onChange={(val) => {
                            handleSkuSelect(row.tempId, val);
                            setErrors((p) => ({ ...p, [`sku_${idx}`]: undefined }));
                          }}
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
                      <td className="px-3 py-3 font-mono text-gray-500 text-[11px]">
                        {row.sku_code ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-700 font-semibold">
                        {row.max_qty ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-700 tabular-nums">
                        {row.mrp ? fmt(row.mrp) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          max={row.max_qty ?? undefined}
                          value={row.quantity ?? ""}
                          onChange={(e) => updateQty(row.tempId, e.target.value, idx)}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 text-center ${errors[`qty_${idx}`] ? "border-red-400" : "border-gray-200"
                            }`}
                        />
                        {errors[`qty_${idx}`] && (
                          <p className="text-[10px] text-red-500 mt-0.5">{errors[`qty_${idx}`]}</p>
                        )}
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
                        <Plus className="w-3.5 h-3.5" /> Add line item
                      </button>
                    ) : lineItems.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">
                        All SKUs have been added
                      </p>
                    ) : null}
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

          {/* Action buttons */}
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
              {initiating ? "Initiating..." : returnShipment ? "Update Return" : "1. Initiate Return"}
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

      {step === 2 && (
        <>
          {loadingReturn ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-xs text-gray-400">
                Loading return shipment…
              </p>
            </div>
          ) : (
            <>
              {/* Meta strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
                <MetaCell
                  label="Shipment Number"
                  value={
                    <span className="font-bold text-gray-800">
                      {returnShipment?.shipment_number}
                    </span>
                  }
                />
                <MetaCell
                  label="Status"
                  value={<StatusBadge status={returnShipment?.status} />}
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

              {/* Return line items table header */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <h3 className="text-sm font-bold text-primary">
                  Return Shipment Line Items
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  Shipment #{returnShipment?.shipment_number}
                </span>
              </div>

              {/* Return line items table */}
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
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
                    {(returnShipment?.line_items ?? []).map((li) => (
                      <tr
                        key={li.id}
                        className="hover:bg-gray-50/50 transition-colors align-top"
                      >
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
                        <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">
                          {li.quantity}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">
                          {fmt(li.mrp)}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">
                          {fmt(li.selling_price)}
                        </td>
                        <td className="px-3 py-3 text-xs tabular-nums">
                          {parseFloat(li.discount_amount) > 0 ? (
                            <span className="text-red-500">
                              -{fmt(li.discount_amount)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-700 tabular-nums">
                          {fmt(li.tax_amount)}
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-primary tabular-nums">
                          {fmt(li.final_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Complete return action */}
              {returnShipment?.status !== "return_completed" &&
                returnShipment?.status !== "cancelled" && (
                  <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                      onClick={handleCompleteReturn}
                      disabled={completing}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer shadow-md"
                    >
                      {completing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-3.5 h-3.5" />
                      )}
                      {completing ? "Completing…" : "Complete Return"}
                    </button>
                    {returnShipment?.status !== "return_initiated" && (
                      <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                  </div>
                )}
            </>
          )}
        </>
      )}
    </div>
  );
}


function MetaCell({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <div className="text-xs text-gray-700">{value ?? "—"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    return_initiated: "bg-orange-100 text-orange-700",
    return_completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
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
                <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500">
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