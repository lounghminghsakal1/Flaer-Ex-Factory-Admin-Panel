"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import { Pencil, Save, ArrowRight, Check, X, XCircleIcon } from "lucide-react";
import SearchableDropdown from "../../create/_components/SearchableDropdown";
import DatePicker from "../../create/_components/DatePicker";
import POLineItems from "../../create/_components/POLineItems";
import AmountSummary from "./AmountSummary";
import { toast } from "react-toastify";
import { useConfirm } from "../../../../../../components/hooks/context/ConfirmContext";

function toApiDateStr(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateStr(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function statusLabel(status) {
  const map = {
    created: "Created",
    waiting_for_approval: "Waiting For Approval",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
  };
  return map[status] || status;
}

function statusBadgeStyle(status) {
  const map = {
    created: { bg: "#f3f4f6", color: "#374151" },
    waiting_for_approval: { bg: "#fef3c7", color: "#92400e" },
    approved: { bg: "#dcfce7", color: "#166534" },
    rejected: { bg: "#fee2e2", color: "#991b1b" },
    completed: { bg: "#dbeafe", color: "#1e40af" },
  };
  return map[status] || { bg: "#f3f4f6", color: "#374151" };
}

function checkValid(vendor, deliveryDate, rows) {
  if (!vendor) return false;
  if (!deliveryDate) return false;
  if (!rows || rows.length === 0) return false;
  for (const row of rows) {
    if (!row.skuOption) return false;
    const units = parseInt(row.totalUnits, 10);
    if (!row.totalUnits || isNaN(units) || units < 1) return false;
  }
  return true;
}

export default function PurchaseOrderDetails({ poData, poId, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const [vendorOptions, setVendorOptions] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const searchTimeout = useRef(null);

  // ── Initialise from API data ──────────────────────────────────────────────
  const initVendor = poData?.vendor
    ? { value: poData.vendor.id, label: poData.vendor.firm_name }
    : null;
  const initDelivery = parseDateStr(poData?.delivery_date);
  const initExpiry = parseDateStr(poData?.expiry_date);
  const initRows = (poData?.po_line_items || []).map((item) => ({
    id: item.id,
    skuOption: {
      value: item.product_sku.id,
      label: item.product_sku.sku_name,
      skuCode: item.product_sku.sku_code,
      unitPrice: parseFloat(item.unit_price),
    },
    skuCode: item.product_sku.sku_code,
    unitPrice: parseFloat(item.unit_price),
    totalUnits: String(item.total_units),
  }));

  const [vendor, setVendor] = useState(initVendor);
  const [deliveryDate, setDeliveryDate] = useState(initDelivery);
  const [expiryDate, setExpiryDate] = useState(initExpiry);
  const [rows, setRows] = useState(initRows);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const isFormValid = useMemo(
    () => checkValid(vendor, deliveryDate, rows),
    [vendor, deliveryDate, rows]
  );

  // ── Vendor search ─────────────────────────────────────────────────────────
  const fetchVendors = useCallback((query = "") => {
    setVendorLoading(true);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors?only_names=true&starts_with=${encodeURIComponent(query)}`
      )
        .then((r) => r.json())
        .then((res) => {
          if (res.status === "success")
            setVendorOptions(res.data.map((v) => ({ value: v.id, label: v.firm_name })));
        })
        .catch(() => { })
        .finally(() => setVendorLoading(false));
    }, 300);
  }, []);

  const handleVendorChange = (opt) => {
    if (opt?.value === vendor?.value) return;
    setVendor(opt);
    setRows([]);
  };

  // Edit / Cancel / Save 
  const handleCancel = () => {
    setVendor(initVendor);
    setDeliveryDate(initDelivery);
    setExpiryDate(initExpiry);
    setRows(initRows);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    setSaving(true);
    try {
      const payload = {
        purchase_order: {
          vendor_id: vendor.value,
          delivery_date: toApiDateStr(deliveryDate),
          expiry_date: expiryDate ? toApiDateStr(expiryDate) : null,
          po_line_items: rows.map((r) => {
            const item = {
              product_sku_id: r.skuOption.value,
              total_units: parseInt(r.totalUnits, 10),
              unit_price: parseFloat(r.unitPrice),
            };
            if (r.id) item.id = r.id;
            return item;
          }),
        },
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (data.status === "success") {
        setEditing(false);
        toast.success("PO sent for approval successfully");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Send for approval ────────────────────────────────────────────────────
  const handleSendForApproval = async () => {
    if (approving || editing) return;
    setApproving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/send_for_approval`,
        { method: "PATCH", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.status === "success" && onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send PO for approval" + err);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handlePOReject = async (rejected, reason) => {
    if (!rejected) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );
      const json = await res.json();

      if (!res.ok || json.status === "failure") throw new Error(json?.errors[0]);

      toast.success("Purchase Order rejected successfully");
      onRefresh();
      setShowRejectModal(false);

    } catch (err) {
      console.log(err);
      toast.error("Failed to reject PO: " + err);
    }
  };

  const handlePOApprove = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}}/approve`, { method: "PATCH", headers: { "Content-Type": "application/json" } });
      const json = await res.json();
      if (!res.ok || json.status === "failure") {
        throw new Error(json?.errors[0]);
      }
      if (json.status === "success" && onRefresh) onRefresh();
      toast.success("PO approved successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to approve PO" + err);
    }
  }

  const status = poData?.status;
  const isCreated = status === "created";
  const isWaiting = status === "waiting_for_approval";
  const isApproved = status === "approved";
  const badgeStyle = statusBadgeStyle(status);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // White card — the scrollable area in page.js scrolls this entire card
    <div className="bg-white rounded-xl p-5 space-y-4">

      {/* ── Row 1: PO number + badge + action buttons ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800">{poData?.purchase_order_number}</h2>
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
          >
            {statusLabel(status)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit — only for "created", only when not already editing */}
          {!editing && isCreated && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-primary text-white hover:bg-primary/90  flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-gray-200 transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isFormValid || saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: isFormValid && !saving ? "#16a34a" : "#86efac" }}
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: form fields ── */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-56">
          <SearchableDropdown
            label="Select Vendor"
            required
            placeholder="Select..."
            options={vendorOptions}
            value={vendor}
            onChange={handleVendorChange}
            onSearch={fetchVendors}
            loading={vendorLoading}
            optionsMaxHeight={220}
            readOnly={!editing}
          />
        </div>
        <div className="w-56">
          <DatePicker
            label="Expected Delivery Date"
            required
            value={deliveryDate}
            onChange={setDeliveryDate}
            disablePast={false}
            readOnly={!editing}
          />
        </div>
        <div className="w-56">
          <DatePicker
            label="Expiry Date"
            value={expiryDate}
            onChange={setExpiryDate}
            disablePast={false}
            readOnly={!editing}
          />
        </div>
        {/* Status — plain text, matches image */}
        <div className="pb-0.5">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p
            className="text-sm font-bold"
            style={{ color: badgeStyle.color }}
          >
            {statusLabel(status)}
          </p>
        </div>
      </div>

      {/* ── PO Line Items ── */}
      <POLineItems
        vendorId={vendor?.value || null}
        rows={rows}
        onChange={setRows}
        readOnly={!editing}
        editMode={editing}
      />

      {/* ── Bottom row: action buttons (left) ←→ amount summary (right) ── */}
      <div className="flex items-start justify-between gap-4 pt-1">

        {/* Left — action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* "Created" status buttons */}
          {isCreated && (
            <button
              type="button"
              onClick={handleSendForApproval}
              disabled={approving || editing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 cursor-pointer hover:bg-green-600/80 text-white transition-all hover:scale-103 disabled:bg-gray-300/70 disabled:cursor-not-allowed"
            >
              {approving ? "Sending..." : "Send For Approval"}
              <ArrowRight size={16} />
            </button>
          )}

          {/* "Waiting for approval" buttons */}
          {isWaiting && (
            <>
              <button
                type="button"
                onClick={handleRejectClick}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold text-white transition-colors hover:scale-103 bg-red-600 hover:opacity-80 cursor-pointer"
              >
                <X size={16} />
                Reject
              </button>
              <button
                type="button"
                onClick={handlePOApprove}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold text-white transition-colors hover:scale-103 bg-green-600 hover:opacity-80 cursor-pointer"
              >
                <Check size={16} />
                Approve
              </button>
            </>
          )}

          <RejectPurchaseOrderModal
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            onReject={handlePOReject}
          />

          {/* "Approved" status indicator button (non-interactive, matches image) */}
          {isApproved && (
            <button
              type="button"
              disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white cursor-default"
              style={{ backgroundColor: "#16a34a" }}
            >
              Approved
              <Check size={16} />
            </button>
          )}
        </div>

        {/* Right — amount summary, no border wrapper */}
        {poData?.po_aggregates && (
          <AmountSummary aggregates={poData.po_aggregates} />
        )}
      </div>

    </div>
  );
}

function RejectPurchaseOrderModal({
  isOpen,
  onClose,
  onReject,
}) {
  const [rejection_reason, setRejection_reason] = useState("");

  const isValid = rejection_reason.trim().length >= 10;
  const charsLeft = 10 - rejection_reason.trim().length;

  const handleReject = () => {
    if (!isValid) return;
    // Returns boolean `true` indicating the PO was rejected
    onReject(true, rejection_reason);
    setRejection_reason("");
  };

  const handleClose = () => {
    setRejection_reason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X />
          </button>

          {/* Content */}
          <div className="px-8 pb-8 pt-8">
            <h2
              className="mb-6 text-center text-xl font-semibold text-gray-900"
            >
              Why are you Rejecting this Purchase Order?
            </h2>

            <div className="relative">
              <textarea
                value={rejection_reason}
                onChange={(e) => setRejection_reason(e.target.value)}
                placeholder="Write a minimum of 10 characters to enable rejection"
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
              />

              {/* Character counter hint */}
              {!isValid && rejection_reason.length > 0 && (
                <p className="mt-1.5 text-right text-xs text-amber-600">
                  {charsLeft} more character{charsLeft !== 1 ? "s" : ""} needed
                </p>
              )}
              {isValid && (
                <p className="mt-1.5 text-right text-xs text-green-600">
                  ✓ Ready to submit
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-100 px-8 py-5">
            {/* Go Back */}
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-700 active:scale-[0.98]"
            >
              Go Back
            </button>

            {/* Reject */}
            <button
              onClick={handleReject}
              disabled={!isValid}
              className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                isValid
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </>
  );
}