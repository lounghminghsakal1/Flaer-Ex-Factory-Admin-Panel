"use client";

import { useState, useEffect, } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowRight,
  Edit2,
  Save,
  X,
  Package,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import SearchableDropdown from "../../create/_components/SearchableDropdown";

// Helpers
const makeEmptyRow = () => ({
  _id: Math.random().toString(36).slice(2),
  lineItemId: null,
  skuCode: "",
  beforeUnits: "",
  beforePrice: "",
  afterUnits: "",
  afterPrice: "",
});

const AMENDMENT_STATUS_CONFIG = {
  draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  waiting_for_approval: {
    label: "Waiting for Approval",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  approved: { label: "Approved", cls: "bg-green-50 text-green-700 border border-green-200" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600 border border-red-200" },
};

function AmendmentStatusBadge({ status }) {
  const cfg = AMENDMENT_STATUS_CONFIG[status] || {
    label: status,
    cls: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// Reject Amendment Modal
function RejectAmendmentModal({ isOpen, onClose, onReject }) {
  const [rejection_reason, setRejection_reason] = useState("");

  const isValid = rejection_reason.trim().length >= 10;
  const charsLeft = 10 - rejection_reason.trim().length;

  const handleReject = () => {
    if (!isValid) return;
    onReject(rejection_reason);
    setRejection_reason("");
  };

  const handleClose = () => {
    setRejection_reason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-8 pb-6 pt-8">
            <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
              Why are you Cancelling this Amendment?
            </h2>

            <div className="relative">
              <textarea
                value={rejection_reason}
                onChange={(e) => setRejection_reason(e.target.value)}
                placeholder="Write a minimum of 10 characters to enable cancellation"
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
              />
              {!isValid && rejection_reason.length > 0 && (
                <p className="mt-1.5 text-right text-xs text-amber-600">
                  {charsLeft} more character{charsLeft !== 1 ? "s" : ""} needed
                </p>
              )}
              {isValid && (
                <p className="mt-1.5 text-right text-xs text-green-600">✓ Ready to submit</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-8 py-5">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all cursor-pointer hover:bg-gray-700 active:scale-[0.98]"
            >
              Go Back
            </button>
            <button
              onClick={handleReject}
              disabled={!isValid}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${isValid
                ? "bg-red-500 text-white hover:bg-red-600"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Single editable row
function AmendmentRow({ row, allLineItems, usedIds, poStatus, onChange, onRemove, disabled }) {
  const allSkuOptions = allLineItems
    .filter((i) => !usedIds.includes(i.id) || i.id === row.lineItemId)
    .map((i) => ({
      value: i.id,
      label: i.product_sku.display_name,
      meta: i,
    }));

  const selectedOption = allSkuOptions.find((o) => o.value === row.lineItemId) || null;

  const canEditUnits = !disabled && poStatus === "approved";
  const canEditPrice = !disabled && (poStatus === "approved" || poStatus === "completed");

  const handleSkuChange = (option) => {
    if (!option) return;
    const item = option.meta;
    onChange({
      ...row,
      lineItemId: item.id,
      skuCode: item.product_sku.sku_code,
      beforeUnits: String(item.total_units),
      beforePrice: String(item.unit_price),
      afterUnits: "",
      afterPrice: "",
    });
  };

  const baseInput = "px-2 py-2 rounded-lg border text-sm w-full";
  const readonlyInput = `${baseInput} border-gray-200 bg-gray-50 text-gray-600`;
  const editableInput = `${baseInput} border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-primary`;
  const lockedInput = `${baseInput} border-gray-200 bg-gray-50 text-gray-500`;

  return (
    <div className="flex items-end gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 flex-wrap">
      {/* SKU Dropdown */}
      <div className="flex-[3] min-w-[220px]">
        <SearchableDropdown
          label="SKU"
          options={allSkuOptions}
          value={selectedOption}
          placeholder="Select SKU..."
          onChange={handleSkuChange}
          disabled={disabled}
          readOnly={disabled}
          optionsMaxHeight={180}
          dropUp={false}
          onSearch={() => { }}
        />
      </div>

      {/* SKU Code */}
      <div className="flex-[1.7] min-w-[140px]">
        <label className="block text-xs text-gray-500 mb-1">SKU Code</label>
        <input
          readOnly
          value={row.skuCode || ""}
          placeholder="Auto-filled"
          className={readonlyInput}
        />
      </div>

      {/* Units group */}
      <div className="flex items-end gap-1.5">
        <div className="w-18">
          <label className="block text-xs text-gray-500 mb-1 whitespace-nowrap">
            {poStatus === "completed" ? "Units" : "Before Units"}
          </label>
          <input
            readOnly
            value={row.beforeUnits || ""}
            placeholder="—"
            className={readonlyInput}
          />
        </div>
        {poStatus !== "completed" && (
          <>
            <ArrowRight className="w-4 h-4 text-gray-700 mb-2.5 shrink-0" />
            <div className="w-18">
              <label className="block text-xs text-gray-500 mb-1">After Units</label>
              <input
                type="number"
                min="1"
                disabled={!canEditUnits}
                value={row.afterUnits}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (Number(v) > 0 && !isNaN(Number(v))))
                    onChange({ ...row, afterUnits: v });
                }}
                placeholder="Enter"
                className={canEditUnits ? editableInput : lockedInput}
                onWheel={(e) => e.target.blur()}
              />
            </div>
          </>
        )}
      </div>

      {/* Vertical divider */}
      <div className="w-px h-9 bg-gray-200 self-end mb-0.5 shrink-0" />

      {/* Price group */}
      <div className="flex items-end gap-1.5">
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">Before Price</label>
          <input
            readOnly
            value={
              row.beforePrice ? `₹${parseFloat(row.beforePrice).toLocaleString()}` : ""
            }
            placeholder="—"
            className={readonlyInput}
          />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-700 mb-2.5 shrink-0" />
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">After Price</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            disabled={!canEditPrice}
            value={row.afterPrice}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || (Number(v) > 0 && !isNaN(Number(v))))
                onChange({ ...row, afterPrice: v });
            }}
            placeholder="Enter"
            className={canEditPrice ? editableInput : lockedInput}
            onWheel={(e) => e.target.blur()}
          />
        </div>
      </div>

      {/* Delete */}
      {!disabled ? (
        <div
          role="button"
          onClick={onRemove}
          className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer mb-0.5 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}
    </div>
  );
}

// Amendment Form (create / edit)
function AmendmentForm({
  poId,
  poStatus,
  lineItems,
  amendmentId,
  initialRows,
  onSaved,
  onCancel,
}) {
  const [rows, setRows] = useState(() =>
    initialRows && initialRows.length > 0 ? initialRows : [makeEmptyRow()]
  );
  const [saving, setSaving] = useState(false);

  const usedIds = rows.map((r) => r.lineItemId).filter(Boolean);
  const canAddMore = usedIds.length < lineItems.length;

  const handleSave = async () => {
    for (const row of rows) {
      if (!row.lineItemId) {
        toast.error("Please select a SKU for all rows.");
        return;
      }
      if (poStatus === "approved") {
        if (!row.afterUnits || Number(row.afterUnits) <= 0) {
          toast.error("After Units must be > 0 for all rows.");
          return;
        }
        if (!row.afterPrice || Number(row.afterPrice) <= 0) {
          toast.error("After Price must be > 0 for all rows.");
          return;
        }
      } else if (poStatus === "completed") {
        if (!row.afterPrice || Number(row.afterPrice) <= 0) {
          toast.error("After Price must be > 0 for all rows.");
          return;
        }
      }
    }

    const payload = {
      line_items: rows.map((r) => {
        const base = {
          before_units: Number(r.beforeUnits),
          before_unit_price: parseFloat(r.beforePrice),
          after_units:
            poStatus === "completed" ? Number(r.beforeUnits) : Number(r.afterUnits),
          after_unit_price: parseFloat(r.afterPrice),
        };
        if (r.lineItemId) base.purchase_order_line_item_id = r.lineItemId;
        return base;
      }),
    };

    setSaving(true);
    try {
      const url = amendmentId
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments/${amendmentId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments`;
      const res = await fetch(url, {
        method: amendmentId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(amendmentId ? "Amendment updated successfully." : "Amendment created successfully.");
        onSaved();
      } else {
        throw new Error(data?.errors[0]);
      }
    } catch (err) {
      toast.error("Something went wrong " + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-visible">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          {amendmentId ? "Edit Amendment" : "New Amendment"}
        </h3>
        <div
          role="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </div>
      </div>

      {/* Rows */}
      <div className="p-2 space-y-2">
        {rows.map((row, idx) => (
          <AmendmentRow
            key={row._id}
            row={row}
            allLineItems={lineItems}
            usedIds={usedIds}
            poStatus={poStatus}
            disabled={false}
            onChange={(updated) =>
              setRows((prev) => prev.map((r, i) => (i === idx ? updated : r)))
            }
            onRemove={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
          />
        ))}

        {/* Bottom action row: Add Item left, Save right */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {canAddMore && (
              <div
                role="button"
                onClick={() => setRows((prev) => [...prev, makeEmptyRow()])}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-75 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              role="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:opacity-80 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </div>
            <div
              role="button"
              onClick={!saving ? handleSave : undefined}
              className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg transition-opacity cursor-pointer ${saving ? "opacity-60" : "hover:opacity-90"
                }`}
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : amendmentId ? "Save Changes" : "Save"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Accordion Item (view mode)
function AmendmentAccordion({
  amendment,
  isOpen,
  onToggle,
  poId,
  lineItems,
  poStatus,
  onRefresh,
  index,
}) {
  const [editing, setEditing] = useState(false);
  const [sendingApproval, setSendingApproval] = useState(false);
  const [approvingAmendment, setApprovingAmendment] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const amendmentStatus = amendment.status;
  const isDraft = amendmentStatus === "draft";
  const isWaitingForApproval = amendmentStatus === "waiting_for_approval";

  const handleSaved = () => {
    setEditing(false);
    onRefresh();
  };

  const handleSendForApproval = async () => {
    setSendingApproval(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments/${amendment.id}/send_for_approval`,
        { method: "PATCH", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Amendment sent for approval.");
        onRefresh();
      } else {
        throw new Error(data?.errors[0]);
      }
    } catch (err) {
      toast.error("Something went wrong " + err);
    } finally {
      setSendingApproval(false);
    }
  };

  const handleApprove = async () => {
    setApprovingAmendment(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments/${amendment.id}/approve`,
        { method: "PATCH", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Amendment approved.");
        onRefresh();
      } else {
        throw new Error(data?.errors[0]);
      }
    } catch {
      toast.error("Something went wrong " + err);
    } finally {
      setApprovingAmendment(false);
    }
  };

  const handleCancelAmendment = async (rejection_reason) => {
    setCancelModalOpen(false);
    setCancelling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments/${amendment.id}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason }),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Amendment cancelled successfully.");
        onRefresh();
      } else {
        throw new Error(data?.errors[0]);
      }
    } catch {
      toast.error("Something went wrong " + err);
    } finally {
      setCancelling(false);
    }
  };

  const viewRows = amendment.line_items || [];

  if (editing) {
    const initialRows = viewRows.map((li) => ({
      _id: Math.random().toString(36).slice(2),
      lineItemId: li.purchase_order_line_item_id || null,
      skuCode: li.sku_code || "",
      beforeUnits: li.before_units != null ? String(li.before_units) : "",
      beforePrice: li.before_unit_price != null ? String(li.before_unit_price) : "",
      afterUnits: li.after_units != null ? String(li.after_units) : "",
      afterPrice: li.after_unit_price != null ? String(li.after_unit_price) : "",
    }));
    return (
      <AmendmentForm
        poId={poId}
        poStatus={poStatus}
        lineItems={lineItems}
        amendmentId={amendment.id}
        initialRows={initialRows}
        onSaved={handleSaved}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <RejectAmendmentModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onReject={handleCancelAmendment}
      />

      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
        {/* Accordion Header */}
        <div
          role="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800">
                  {amendment.amendment_code || `Amendment #${amendment.id}`}
                </p>
                <AmendmentStatusBadge status={amendmentStatus} />
              </div>
              {amendment.created_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(amendment.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Right: Edit + Chevron only */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isOpen && isDraft && (
              <div
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary hover:text-gray-100 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </div>
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="cursor-pointer"
            >
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Accordion Body */}
        {isOpen && (
          <div className="px-2 pb-4 border-t border-gray-100 pt-3 space-y-2">
            {viewRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No line items recorded.</p>
            ) : (
              viewRows.map((li, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-300 flex-wrap"
                >
                  {/* SKU */}
                  <div className="flex-[2] min-w-[140px]">
                    <p className="text-xs text-gray-500 mb-0.5">SKU</p>
                    <p className="text-sm font-medium text-gray-800 leading-tight">
                      {li.sku_name || `Line Item #${li.purchase_order_line_item_id}`}
                    </p>
                    {li.sku_code && (
                      <p className="text-xs text-gray-400 mt-0.5">{li.sku_code}</p>
                    )}
                  </div>

                  {/* Units */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Before Units</p>
                      <p className="text-sm font-semibold text-gray-700">{li.before_units}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">After Units</p>
                      <p className="text-sm font-semibold text-primary">{li.after_units}</p>
                    </div>
                  </div>

                  <div className="w-px h-8 bg-gray-200 shrink-0" />

                  {/* Price */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Before Price</p>
                      <p className="text-sm font-semibold text-gray-700">
                        ₹{parseFloat(li.before_unit_price || 0).toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">After Price</p>
                      <p className="text-sm font-semibold text-primary">
                        ₹{parseFloat(li.after_unit_price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Action buttons — below line items, left aligned */}
            <div className="flex items-center gap-2 pt-2">
              {/* Send for Approval — draft only */}
              {isDraft && (
                <div
                  role="button"
                  onClick={handleSendForApproval}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-green-600 cursor-pointer text-white transition-all hover:scale-103 ${sendingApproval ? "opacity-60" : "hover:opacity-90"
                    }`}
                >
                  {sendingApproval ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {sendingApproval ? "Sending..." : "Send for Approval"}
                </div>
              )}

              {/* Approve — waiting_for_approval only */}
              {isWaitingForApproval && (
                <div
                  role="button"
                  onClick={handleApprove}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white hover:scale-103 bg-green-600 rounded-lg transition-opacity  cursor-pointer ${approvingAmendment ? "opacity-60" : "hover:opacity-90"
                    }`}
                >
                  {approvingAmendment ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {approvingAmendment ? "Approving..." : "Approve"}
                </div>
              )}

              {/* Cancel Amendment — draft or waiting_for_approval */}
              {(isDraft || isWaitingForApproval) && isWaitingForApproval && (
                <div
                  role="button"
                  onClick={() => setCancelModalOpen(true)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white hover:scale-103 bg-red-500 rounded-lg transition-all cursor-pointer ${cancelling ? "opacity-60" : "hover:opacity-90"
                    }`}
                >
                  {cancelling ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {cancelling ? "Rejecting..." : "Reject Amendment"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Main Component
export default function PurchaseOrderAmendments({ poId, refreshPo }) {
  const [amendments, setAmendments] = useState([]);
  const [poData, setPoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchAmendments = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments`
      );
      const data = await res.json();
      if (data.status === "success") {
        const list = data.data?.amendments || [];
        setAmendments(list);
        if (list.length > 0) setOpenAccordion(list[list.length - 1].id);
      }
      if (data.status === "failure") throw new Error(data?.errors[0]);
    } catch (err) {
      toast.error("Failed to fetch amendments " + err);
    }
  };

  const fetchPoData = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}`
      );
      const data = await res.json();
      if (data.status === "success") setPoData(data.data);
      if (data.status === "failure") throw new Error(data?.errors[0]);
    } catch (err) {
      toast.error("Failed to fetch amendments " + err);
    }
  };

  useEffect(() => {
    Promise.all([fetchAmendments(), fetchPoData()]).finally(() => setLoading(false));
  }, [poId]);

  const handleRefresh = async () => {
    try {
      refreshPo();
      // fetch amendments
      const resAm = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/purchase_order_amendments`
      );
      const dataAm = await resAm.json();

      if (dataAm.status === "success") {
        const list = dataAm.data?.amendments || [];
        setAmendments(list);

        if (list.length > 0) {
          setOpenAccordion(list[list.length - 1].id);
        }
      }

      // ALSO FETCH PO DATA
      const resPo = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}`
      );
      const dataPo = await resPo.json();

      if (dataPo.status === "success") {
        setPoData(dataPo.data);
      }

      setShowCreateForm(false);
    } catch {
      toast.error("Failed to refresh data");
    }
  };

  const handleCreateClick = () => {
    // Guard: all existing amendments must be approved or cancelled
    const ALLOWED = ["approved", "cancelled", "rejected"];
    const hasUnfinished = amendments.some((a) => !ALLOWED.includes(a.status));
    if (hasUnfinished) {
      toast.error("Please finish existing amendments first.");
      return;
    }
    setOpenAccordion(null);
    setShowCreateForm(true);
  };

  const lineItems = poData?.po_line_items || [];
  const poStatus = poData?.status || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <span className="w-5 h-5 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
        <span className="text-sm">Loading amendments…</span>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-2">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Purchase Order Amendments</h2>
          {poData && (
            <p className="text-sm text-gray-400 mt-0.5">
              {poData.purchase_order_number} &middot;{" "}
              <span
                className={`capitalize font-medium ${poStatus === "approved"
                  ? "text-green-600"
                  : poStatus === "completed"
                    ? "text-blue-600"
                    : "text-gray-500"
                  }`}
              >
                {poStatus}
              </span>
            </p>
          )}
        </div>
        <div
          role="button"
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:scale-103 hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Amendment
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {amendments.length === 0 && !showCreateForm && (
          <div className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <Package className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No amendments yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Click "Create Amendment" to add the first one.
            </p>
            <div
              role="button"
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Amendment
            </div>
          </div>
        )}

        {showCreateForm && (
          <AmendmentForm
            poId={poId}
            poStatus={poStatus}
            lineItems={lineItems}
            amendmentId={null}
            initialRows={null}
            onSaved={handleRefresh}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {amendments.map((amendment, idx) => (
          <AmendmentAccordion
            key={amendment.id}
            amendment={amendment}
            index={idx}
            isOpen={openAccordion === amendment.id}
            onToggle={() =>
              setOpenAccordion((prev) => (prev === amendment.id ? null : amendment.id))
            }
            poId={poId}
            lineItems={lineItems}
            poStatus={poStatus}
            onRefresh={handleRefresh}
          />
        ))}
      </div>
    </div>
  );
}

