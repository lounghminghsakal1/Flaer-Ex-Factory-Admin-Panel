"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Package, Edit2, X } from "lucide-react";
import { toast } from "react-toastify";
import { BatchingModal, SerialModal } from "./TrackingModals";
import GrnSkuDropdown from "./GrnSkuDropdown";

// ─── Read-only row ────────────────────────────────────────────────────────────
function ReadOnlyRow({ row }) {
  const tracking = row.tracking_type;
  // API returns received_batches / received_serials; fall back to normalised batches/serials
  const batches = row.received_batches || row.batches || [];
  const serials = row.received_serials || row.serials || [];

  const trackingDisplay =
    tracking === "untracked"
      ? <span className="text-xs text-gray-400 italic">Untracked</span>
      : batches.length > 0
        ? <span className="text-gray-600 text-xs">Batches ({batches.length})</span>
        : serials.length > 0
          ? <span className="text-gray-600 text-xs">Serials ({serials.length})</span>
          : <span className="text-gray-400">—</span>;

  const displayName = row.product_name || row.sku_name || "—";

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-2 py-2 w-[200px] max-w-[200px]">
        <span title={displayName} className="block truncate text-sm text-gray-800">
          {displayName}
        </span>
      </td>
      <td className="px-2 py-2 w-[85px]">
        <span className="text-sm text-gray-600">₹{row.unit_price != null ? Number(row.unit_price).toLocaleString() : "—"}</span>
      </td>
      <td className="px-2 py-2 w-[80px] text-center text-sm text-gray-700">
        {row.received_quantity != null ? Math.floor(Number(row.received_quantity)) : "—"}
      </td>
      <td className="px-2 py-2 w-[100px]">{trackingDisplay}</td>
      <td className="px-2 py-2 w-[80px]">
        <span className="text-sm text-gray-600">₹{row.accepted_amount != null ? Number(row.accepted_amount).toLocaleString() : "—"}</span>
      </td>
      <td className="px-2 py-2 w-[80px]">
        <span className="text-sm text-gray-600">₹{row.received_amount != null ? Number(row.received_amount).toLocaleString() : "—"}</span>
      </td>
      <td className="px-2 py-2 w-[80px]">
        <span className="text-sm text-gray-600">₹{row.rejected_amount != null ? Number(row.rejected_amount).toLocaleString() : "—"}</span>
      </td>
      <td className="px-2 py-2 w-8" />
    </tr>
  );
}

// ─── Editable existing row (edit mode for already-saved items) ─────────────────
function EditableExistingRow({ row, skuOptions, onChange }) {
  const [batchingOpen, setBatchingOpen] = useState(false);
  const [serialOpen, setSerialOpen] = useState(false);

  const trackingType = row.tracking_type;
  const isBatch = trackingType === "batch";
  const isSerial = trackingType === "serial";
  const isUntracked = trackingType === "untracked";

  const qty = Number(row.received_quantity) || 0;
  const hasValidQty = qty > 0;

  // normalizeExisting maps received_batches → batches, received_serials → serials
  const batches = row.batches || [];
  const serials = row.serials || [];
  const batchCount = batches.length;
  const serialCount = serials.length;

  // Inline mismatch indicators
  const batchTotalQty = batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const batchMismatch = isBatch && hasValidQty && batchCount > 0 && batchTotalQty !== qty;
  const serialMismatch = isSerial && hasValidQty && serialCount > 0 && serialCount !== qty;

  // API field is sku_name; product_name used by some other shapes
  const skuDisplayName = row.product_name || row.sku_name || "—";

  const trackingLabel = isBatch
    ? batchCount > 0 ? `Batches (${batchCount})` : "Add Batches"
    : isSerial
      ? serialCount > 0 ? `Serials (${serialCount})` : "Add Serials"
      : null;

  const selectedSku = skuOptions.find((sku) => sku.product_sku_id === row.product_sku_id) || {};
  const remainingQty = Math.trunc(selectedSku?.remaining_quantity ?? 0);
  
  const handleQtyChange = (v) => {
    const intVal = v === "" ? "" : String(Math.floor(Number(v)));
    if (intVal === "" || Number(intVal) > 0) {
      // Preserve existing batches/serials — mismatch is caught at save time
      onChange({ ...row, received_quantity: intVal });
    }
  };

  const handleTrackingClick = () => {
    if (!hasValidQty) return;
    if (isBatch) setBatchingOpen(true);
    else if (isSerial) setSerialOpen(true);
  };

  return (
    <>
      {isBatch && (
        <BatchingModal
          key={`batch-existing-${row._id}`}
          isOpen={batchingOpen}
          onClose={() => setBatchingOpen(false)}
          onSave={(newBatches) => onChange({ ...row, batches: newBatches })}
          skuName={skuDisplayName}
          totalQuantity={row.received_quantity || 0}
          initialBatches={batches}
        />
      )}
      {isSerial && (
        <SerialModal
          key={`serial-existing-${row._id}`}
          isOpen={serialOpen}
          onClose={() => setSerialOpen(false)}
          onSave={(newSerials) => onChange({ ...row, serials: newSerials })}
          skuName={skuDisplayName}
          totalQuantity={row.received_quantity || 0}
          initialSerials={serials}
        />
      )}

      <tr className="border-b border-amber-100 bg-amber-50/30">
        {/* SKU name — read-only for existing rows */}
        <td className="px-2 py-2 w-[200px] max-w-[200px]">
          <span title={skuDisplayName} className="block truncate text-sm text-gray-800 font-medium">
            {skuDisplayName}
          </span>
        </td>

        {/* Unit Price — read-only */}
        <td className="px-2 py-2 w-[85px]">
          <div className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 truncate">
            {row.unit_price ? `₹${Number(row.unit_price).toLocaleString()}` : "—"}
          </div>
        </td>

        {/* Received Qty — editable */}
        <td className="px-2 py-2 w-[80px]">
          <input
            type="number"
            min="1"
            step="1"
            value={row.received_quantity}
            onChange={(e) => handleQtyChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "." || e.key === "-" || e.key === "e") e.preventDefault(); }}
            placeholder="Qty"
            className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-primary text-center"
          />
          {selectedSku && row.received_quantity > remainingQty && (<p className="text-[12px] text-red-700">Only {remainingQty} qty(s) remaining</p>)}
        </td>

        {/* Tracking — editable for batch/serial */}
        <td className="px-2 py-2 w-[100px]">
          {isUntracked ? (
            <span className="text-xs text-gray-400 italic">Untracked</span>
          ) : isBatch || isSerial ? (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={!hasValidQty}
                onClick={handleTrackingClick}
                className={`text-xs font-medium transition-colors whitespace-nowrap text-left ${!hasValidQty ? "text-gray-300 cursor-not-allowed" : "text-primary hover:opacity-75 cursor-pointer"
                  }`}
              >
                {trackingLabel}
              </button>
              {batchMismatch && (
                <span className="text-[10px] text-red-500 leading-tight">
                  Batch qty ({batchTotalQty}) ≠ received ({qty})
                </span>
              )}
              {serialMismatch && (
                <span className="text-[10px] text-red-500 leading-tight">
                  Serial count ({serialCount}) ≠ received ({qty})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </td>

        {/* Amounts — pending save */}
        <td className="px-2 py-2 w-[80px]">
          <span className="text-[10px] text-gray-400 italic">Pending save</span>
        </td>
        <td className="px-2 py-2 w-[80px]"><span className="text-sm text-gray-300">—</span></td>
        <td className="px-2 py-2 w-[80px]"><span className="text-sm text-gray-300">—</span></td>

        {/* No remove — existing rows cannot be deleted here */}
        <td className="px-2 py-2 w-8" />
      </tr>
    </>
  );
}

// ─── Editable new row ─────────────────────────────────────────────────────────
function EditableRow({ row, skuOptions, usedSkuIds, onChange, onRemove }) {
  const [batchingOpen, setBatchingOpen] = useState(false);
  const [serialOpen, setSerialOpen] = useState(false);

  const selectedSku = skuOptions.find((o) => o.product_sku_id === row.product_sku_id) || null;
  const trackingType = selectedSku?.tracking_type || row.tracking_type;
  const isBatch = trackingType === "batch";
  const isSerial = trackingType === "serial";
  const isUntracked = trackingType === "untracked";

  const remainingQty = selectedSku ? Number(selectedSku.remaining_quantity) : Infinity;
  const hasValidQty = row.received_quantity && Number(row.received_quantity) > 0;

  const qty = Number(row.received_quantity) || 0;
  const batchCount = row.batches?.length || 0;
  const serialCount = row.serials?.length || 0;
  const batchTotalQty = (row.batches || []).reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const batchMismatch = isBatch && hasValidQty && batchCount > 0 && batchTotalQty !== qty;
  const serialMismatch = isSerial && hasValidQty && serialCount > 0 && serialCount !== qty;

  const trackingLabel = isBatch
    ? batchCount > 0 ? `Batches (${batchCount})` : "Add Batches"
    : isSerial
      ? serialCount > 0 ? `Serials (${serialCount})` : "Add Serials"
      : null;

  const handleSkuChange = (option) => {
    onChange({
      ...row,
      product_sku_id: option.product_sku_id,
      unit_price: option.unit_price ? String(option.unit_price) : "",
      tracking_type: option.tracking_type || "",
      received_quantity: "",
      batches: [],
      serials: [],
    });
  };

  const handleQtyChange = (v) => {
    const intVal = v === "" ? "" : String(Math.floor(Number(v)));
    if (intVal === "" || Number(intVal) > 0) {
      if (selectedSku && intVal !== "" && Number(intVal) > remainingQty) {
        toast.warn(`Qty (${intVal}) exceeds remaining (${remainingQty}) for this SKU.`, { toastId: `qty-warn-${row._id}` });
      }
      onChange({ ...row, received_quantity: intVal, batches: [], serials: [] });
    }
  };

  const handleTrackingClick = () => {
    if (!hasValidQty) return;
    if (Number(row.received_quantity) > remainingQty) {
      toast.error(`Received qty (${row.received_quantity}) exceeds remaining (${remainingQty}). Fix qty first.`);
      return;
    }
    if (isBatch) setBatchingOpen(true);
    else if (isSerial) setSerialOpen(true);
  };

  const availableOptions = skuOptions.filter(
    (o) => !usedSkuIds.includes(o.product_sku_id) || o.product_sku_id === row.product_sku_id
  );

  return (
    <>
      {isBatch && (
        <BatchingModal
          key={`batch-new-${row._id}-${row.received_quantity}`}
          isOpen={batchingOpen}
          onClose={() => setBatchingOpen(false)}
          onSave={(batches) => onChange({ ...row, batches })}
          skuName={selectedSku?.product_name || ""}
          totalQuantity={row.received_quantity || 0}
          initialBatches={row.batches || []}
        />
      )}
      {isSerial && (
        <SerialModal
          key={`serial-new-${row._id}-${row.received_quantity}`}
          isOpen={serialOpen}
          onClose={() => setSerialOpen(false)}
          onSave={(serials) => onChange({ ...row, serials })}
          skuName={selectedSku?.product_name || ""}
          totalQuantity={row.received_quantity || 0}
          initialSerials={row.serials || []}
        />
      )}

      <tr className="border-b border-blue-100 bg-blue-50/30">
        <td className="px-2 py-2 w-[200px] max-w-[200px]" style={{ overflow: "visible" }}>
          <GrnSkuDropdown
            options={availableOptions}
            value={row.product_sku_id}
            onChange={handleSkuChange}
            disabled={false}
            placeholder="Select SKU..."
          />
        </td>

        <td className="px-2 py-2 w-[85px]">
          <div className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 truncate">
            {row.unit_price ? `₹${Number(row.unit_price).toLocaleString()}` : "—"}
          </div>
        </td>

        <td className="px-2 py-2 w-[80px]">
          <input
            type="number"
            min="1"
            step="1"
            value={row.received_quantity}
            onChange={(e) => handleQtyChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "." || e.key === "-" || e.key === "e") e.preventDefault(); }}
            placeholder="Qty"
            className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-primary text-center"
          />
          {selectedSku && row.received_quantity > remainingQty && (<p className="text-[12px] text-red-700">Only {remainingQty} qty(s) remaining</p>)}
        </td>

        <td className="px-2 py-2 w-[100px]">
          {isUntracked ? (
            <span className="text-xs text-gray-400 italic">Untracked</span>
          ) : isBatch || isSerial ? (
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={!hasValidQty}
                onClick={handleTrackingClick}
                className={`text-xs font-medium transition-colors whitespace-nowrap text-left ${!hasValidQty ? "text-gray-300 cursor-not-allowed" : "text-primary hover:opacity-75 cursor-pointer"
                  }`}
              >
                {trackingLabel}
              </button>
              {batchMismatch && (
                <span className="text-[10px] text-red-500 leading-tight">
                  Batch qty ({batchTotalQty}) ≠ received ({qty})
                </span>
              )}
              {serialMismatch && (
                <span className="text-[10px] text-red-500 leading-tight">
                  Serial count ({serialCount}) ≠ received ({qty})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </td>

        <td className="px-2 py-2 w-[80px]"><span className="text-sm text-gray-300">—</span></td>
        <td className="px-2 py-2 w-[80px]"><span className="text-sm text-gray-300">—</span></td>
        <td className="px-2 py-2 w-[80px]"><span className="text-sm text-gray-300">—</span></td>

        <td className="px-2 py-2 w-8">
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * Props:
 *  - grnId: string
 *  - poId: string
 *  - grnStatus: string  ← NEW: "created" | other
 *  - initialLineItems: array
 *  - onSaved: () => void
 */
export default function GrnLineItems({ grnId, poId, grnStatus, initialLineItems, onSaved }) {
  const makeNewRow = () => ({
    _id: Math.random().toString(36).slice(2),
    product_sku_id: null,
    unit_price: "",
    tracking_type: "",
    received_quantity: "",
    batches: [],
    serials: [],
    isNew: true,
  });

  // Normalize existing items into editable shape.
  // API may return batches as received_batches and serials as received_serials.
  const normalizeExisting = (items) =>
    (items || []).map((item) => {
      // Normalize batch shape: API uses manufacture_date, local modal uses manufacturing_date
      const rawBatches = item.received_batches || item.batches || [];
      const batches = rawBatches.map((b) => ({
        _id: Math.random().toString(36).slice(2),
        batch_code: b.batch_code || "",
        quantity: b.quantity != null ? String(b.quantity) : "",
        manufacturing_date: b.manufacturing_date
          ? new Date(b.manufacturing_date)
          : b.manufacture_date
            ? new Date(b.manufacture_date)
            : null,

        expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
      }));

      // Normalize serials: API returns array of strings or objects
      const rawSerials = item.received_serials || item.serials || [];
      const serials = rawSerials.map((s) =>
        typeof s === "string" ? s : s.serial_number || s.value || ""
      );

      return {
        ...item,
        _id: String(item.id ?? item.product_sku_id ?? Math.random()),
        received_quantity:
          item.received_quantity != null ? String(Math.floor(Number(item.received_quantity))) : "",
        batches,
        serials,
        isNew: false,
      };
    });

  const [existingRows, setExistingRows] = useState(() => initialLineItems || []);
  const [editingRows, setEditingRows] = useState([]); // copies of existing rows being edited
  const [newRows, setNewRows] = useState([]);          // brand-new rows added in edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [skuOptions, setSkuOptions] = useState([]);
  const [loadingSku, setLoadingSku] = useState(false);
  const [saving, setSaving] = useState(false);
  const skuFetchedRef = useRef(false);

  // Keep existingRows in sync when parent refreshes initialLineItems
  useEffect(() => {
    setExistingRows(initialLineItems || []);
  }, [initialLineItems]);

  // Only show Edit Items button when GRN status is "created"
  const canEdit = grnStatus === "created";

  // Fetch SKU options once when entering edit mode
  useEffect(() => {
    if (!isEditing || skuFetchedRef.current || !grnId || !poId) return;
    skuFetchedRef.current = true;
    setLoadingSku(true);
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/po_receiving_summary?po_id=${poId}&grn_id=${grnId}`
    )
      .then((r) => r.json())
      .then((d) => setSkuOptions(d?.data || []))
      .catch(() => toast.error("Failed to load SKU options."))
      .finally(() => setLoadingSku(false));
  }, [isEditing, grnId, poId]);

  const handleEnterEditMode = () => {
    setEditingRows(normalizeExisting(existingRows));
    setNewRows([]); // start with NO new rows — user adds via button
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditingRows([]);
    setNewRows([]);
    setIsEditing(false);
  };

  // Combined used SKU IDs to prevent duplicates in new rows
  const usedSkuIds = [
    ...editingRows.map((r) => r.product_sku_id).filter(Boolean),
    ...newRows.map((r) => r.product_sku_id).filter(Boolean),
  ];

  // ── Validation ────────────────────────────────────────────────────────────
  const validateRows = (rows, isExisting = false) => {
    for (const row of rows) {
      const sku = skuOptions.find((o) => o.product_sku_id === row.product_sku_id);
      const skuName = row.product_name || row.sku_name || sku?.product_name || "Unknown SKU";

      if (!row.product_sku_id) {
        toast.error("Please select a SKU for all rows.");
        return false;
      }

      const qty = Number(row.received_quantity);
      if (!row.received_quantity || qty <= 0) {
        toast.error(`Received qty must be > 0 for "${skuName}".`);
        return false;
      }

      // Remaining qty check only for new rows
      if (!isExisting) {
        const remainingQty = sku ? Number(sku.remaining_quantity) : Infinity;
        if (qty > remainingQty) {
          toast.error(`Qty for "${skuName}" (${qty}) exceeds remaining (${remainingQty}).`);
          return false;
        }
      }

      const tt = sku?.tracking_type || row.tracking_type;

      if (tt === "batch") {
        if (!row.batches || row.batches.length === 0) {
          toast.error(`Add batch details for "${skuName}".`);
          return false;
        }
        const batchTotal = row.batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
        if (batchTotal !== qty) {
          toast.error(`Batch total qty (${batchTotal}) must match received qty (${qty}) for "${skuName}".`);
          return false;
        }
      }

      if (tt === "serial") {
        if (!row.serials || row.serials.length === 0) {
          toast.error(`Add serial numbers for "${skuName}".`);
          return false;
        }
        if (row.serials.length !== qty) {
          toast.error(`Serial count (${row.serials.length}) must match received qty (${qty}) for "${skuName}".`);
          return false;
        }
      }
    }
    return true;
  };

  const buildPayloadItem = (r) => {
    const sku = skuOptions.find((o) => o.product_sku_id === r.product_sku_id);
    const tt = sku?.tracking_type || r.tracking_type;
    const item = {
      product_sku_id: r.product_sku_id,
      received_quantity: Number(r.received_quantity),
      unit_price: Number(r.unit_price),
    };
    if (tt === "batch" && r.batches?.length > 0) {
      item.received_batches = r.batches.map((b) => ({
        batch_code: b.batch_code,
        quantity: Number(b.quantity),
        manufacture_date: b.manufacturing_date || null,
        expiry_date: b.expiry_date || null,
      }));
    }
    if (tt === "serial" && r.serials?.length > 0) {
      item.received_serials = r.serials;
    }
    return item;
  };

  const handleSave = async () => {
    if (editingRows.length === 0 && newRows.length === 0) {
      toast.error("No line items to save.");
      return;
    }

    // Validate existing edited rows first, then new rows
    if (!validateRows(editingRows, true)) return;
    if (!validateRows(newRows, false)) return;

    const grn_line_items = [
      ...editingRows.map(buildPayloadItem),
      ...newRows.map(buildPayloadItem),
    ];

    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grnId}/grn_line_items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grn_line_items }),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Line items saved.");
        setEditingRows([]);
        setNewRows([]);
        setIsEditing(false);
        onSaved?.();
      } else {
        throw new Error(data?.errors[0]);
      }
    } catch(err) {
      toast.error("Failed to save GRN line items "+err);
    } finally {
      setSaving(false);
    }
  };

  const HEADERS = [
    { label: "SKU Name", cls: "w-[200px] max-w-[200px]" },
    { label: "Unit Price", cls: "w-[85px]" },
    { label: "Received Qty", cls: "w-[80px] text-center" },
    { label: "Tracking Type", cls: "w-[100px]" },
    { label: "Accepted Amt.", cls: "w-[80px]" },
    { label: "Received Amt.", cls: "w-[80px]" },
    { label: "Rejected Amt.", cls: "w-[80px]" },
    { label: "Actions", cls: "w-8" },
  ];

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-primary">GRN Line Items</h3>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : canEdit ? (
            // Only show when status === "created"
            <button
              onClick={handleEnterEditMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />Edit Items
            </button>
          ) : null}
        </div>
      </div>

      {/* Table — no overflow-hidden so dropdowns escape */}
      <div className="border border-gray-200 rounded-xl">
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {HEADERS.map((h, i) => (
                  <th
                    key={i}
                    className={`px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h.cls}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isEditing ? (
                <>
                  {/* Existing rows in edit mode — amber tint to distinguish */}
                  {editingRows.map((row, idx) => (
                    <EditableExistingRow
                      key={row._id}
                      row={row}
                      skuOptions={skuOptions}
                      onChange={(updated) =>
                        setEditingRows((prev) => prev.map((r, i) => (i === idx ? updated : r)))
                      }
                    />
                  ))}

                  {/* New rows — blue tint */}
                  {newRows.map((row, idx) => (
                    <EditableRow
                      key={row._id}
                      row={row}
                      skuOptions={skuOptions}
                      usedSkuIds={usedSkuIds}
                      onChange={(updated) =>
                        setNewRows((prev) => prev.map((r, i) => (i === idx ? updated : r)))
                      }
                      onRemove={() => setNewRows((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  ))}

                  {/* Add another row */}
                  <tr>
                    <td colSpan={8} className="px-3 py-3 border-t border-gray-50">
                      {loadingSku ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />Loading SKUs...
                        </div>
                      ) : (
                        <button
                          onClick={() => setNewRows((prev) => [...prev, makeNewRow()])}
                          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-75 transition-opacity cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />Add another row
                        </button>
                      )}
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  {/* Read-only view */}
                  {existingRows.map((row) => (
                    <ReadOnlyRow key={row.id ?? row.product_sku_id} row={row} />
                  ))}

                  {existingRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Package className="w-8 h-8" />
                          <span className="text-sm">No line items yet.</span>
                          {canEdit && (
                            <button
                              onClick={handleEnterEditMode}
                              className="mt-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                            >
                              + Add line items
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}