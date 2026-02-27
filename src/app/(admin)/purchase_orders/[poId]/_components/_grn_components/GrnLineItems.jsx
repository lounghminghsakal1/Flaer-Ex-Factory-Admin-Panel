"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Package, Edit2, X, CheckCircle2, AlertCircle, Save, ClipboardCheck } from "lucide-react";
import { toast } from "react-toastify";
import { BatchingModal, SerialModal } from "./TrackingModals";
import { ViewBatchModal, ViewSerialModal, QCBatchModal, QCSerialModal, ReasonModal, QCBatchViewModal, QCSerialViewModal } from "./QCModals";
import GrnSkuDropdown from "./GrnSkuDropdown";

// ─── Two-line header ───────────────────────────────────────────────────────────
function TwoLineHeader({ line1, line2, cls = "" }) {
  return (
    <th className={`px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${cls}`}>
      <span className="block leading-tight">{line1}</span>
      {line2 && <span className="block leading-tight">{line2}</span>}
    </th>
  );
}

// ─── Tracking button (used in normal editable rows) ───────────────────────────
function TrackingButton({ trackingType, qty, batches = [], serials = [], onOpenBatch, onOpenSerial }) {
  const isBatch = trackingType === "batch";
  const isSerial = trackingType === "serial";
  const hasValidQty = qty && Number(qty) > 0;
  if (!isBatch && !isSerial) return null;

  const batchCount = batches.length;
  const serialCount = serials.length;
  const batchTotalQty = batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const batchMismatch = isBatch && hasValidQty && batchCount > 0 && batchTotalQty !== Number(qty);
  const serialMismatch = isSerial && hasValidQty && serialCount > 0 && serialCount !== Number(qty);

  const label = isBatch
    ? batchCount > 0 ? `Batches (${batchCount})` : "+ Add Batches"
    : serialCount > 0 ? `Serials (${serialCount})` : "+ Add Serials";

  return (
    <div className="mt-1 flex flex-col gap-0.5">
      <button
        type="button"
        disabled={!hasValidQty}
        onClick={isBatch ? onOpenBatch : onOpenSerial}
        className={`text-[11px] font-medium transition-colors whitespace-nowrap text-left w-fit
          ${!hasValidQty ? "text-gray-300 cursor-not-allowed"
            : (batchCount > 0 || serialCount > 0) ? "text-emerald-600 hover:text-emerald-700 cursor-pointer"
              : "text-primary hover:opacity-75 cursor-pointer"}`}
      >
        {label}
      </button>
      {batchMismatch && <span className="text-[10px] text-red-500 leading-tight">Batch qty ({batchTotalQty}) ≠ received ({qty})</span>}
      {serialMismatch && <span className="text-[10px] text-red-500 leading-tight">Serial count ({serialCount}) ≠ received ({qty})</span>}
    </div>
  );
}

// ─── Read-only row (normal view) ──────────────────────────────────────────────
// Always shows clickable batch/serial links (view-only).
// "View QC" link under Accepted Qty opens read-only QC breakdown modal.
function ReadOnlyRow({ row }) {
  const [viewBatchOpen, setViewBatchOpen] = useState(false);
  const [viewSerialOpen, setViewSerialOpen] = useState(false);
  const [qcBatchViewOpen, setQcBatchViewOpen] = useState(false);
  const [qcSerialViewOpen, setQcSerialViewOpen] = useState(false);

  const tracking = row.tracking_type;
  const batches = row.received_batches || row.batches || [];
  const serials = row.received_serials || row.serials || [];
  const acceptedBatches = row.accepted_batches || [];
  const rejectedBatches = row.rejected_batches || [];
  const acceptedSerials = Array.isArray(row.accepted_serials) ? row.accepted_serials : [];
  const rejectedSerials = Array.isArray(row.rejected_serials) ? row.rejected_serials : [];

  const hasQCBatchData = tracking === "batch" && (acceptedBatches.length > 0 || rejectedBatches.length > 0);
  const hasQCSerialData = tracking === "serial" && (acceptedSerials.length > 0 || rejectedSerials.length > 0);

  const trackingDisplay =
    tracking === "untracked"
      ? <span className="text-xs text-gray-400 italic">Untracked</span>
      : batches.length > 0
        ? (
          <button
            onClick={() => setViewBatchOpen(true)}
            className="mt-0.5 text-[11px] font-medium text-gray-400 hover:text-primary cursor-pointer transition-colors block whitespace-nowrap"
          >
            View Batches ({batches.length})
          </button>
        )
        : serials.length > 0
          ? (
            <button
              onClick={() => setViewSerialOpen(true)}
              className="mt-0.5 text-[11px] font-medium text-gray-400 hover:text-primary cursor-pointer transition-colors block whitespace-nowrap"
            >
              View Serials ({serials.length})
            </button>
          )
          : null;

  const displayName = row.product_name || row.sku_name || "—";
  const acceptedQty = row.accepted_quantity != null ? Number(row.accepted_quantity) : null;
  const rejectedQty = row.rejected_quantity != null ? Number(row.rejected_quantity) : null;

  return (
    <>
      {tracking === "batch" && (
        <>
          <ViewBatchModal isOpen={viewBatchOpen} onClose={() => setViewBatchOpen(false)} skuName={displayName} batches={batches} />
          <QCBatchViewModal
            isOpen={qcBatchViewOpen}
            onClose={() => setQcBatchViewOpen(false)}
            skuName={displayName}
            receivedBatches={batches}
            acceptedBatches={acceptedBatches}
            rejectedBatches={rejectedBatches}
          />
        </>
      )}
      {tracking === "serial" && (
        <>
          <ViewSerialModal isOpen={viewSerialOpen} onClose={() => setViewSerialOpen(false)} skuName={displayName} serials={serials} />
          <QCSerialViewModal
            isOpen={qcSerialViewOpen}
            onClose={() => setQcSerialViewOpen(false)}
            skuName={displayName}
            receivedSerials={serials}
            acceptedSerials={acceptedSerials}
            rejectedSerials={rejectedSerials}
          />
        </>
      )}
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
        {/* SKU Name */}
        <td className="px-2 py-2 w-[240px] max-w-[240px]">
          <span title={displayName} className="block truncate text-sm text-gray-800">{displayName}</span>
        </td>
        {/* Unit Price */}
        <td className="px-2 py-2 w-[75px]">
          <span className="text-sm text-gray-600">{row.unit_price != null ? `₹${Number(row.unit_price).toLocaleString()}` : "—"}</span>
        </td>
        {/* Received Qty */}
        <td className="px-2 py-2 w-[80px]">
          <div className="text-sm text-gray-700">{row.received_quantity != null ? Math.floor(Number(row.received_quantity)) : "—"}</div>
          {trackingDisplay && <div className="mt-0.5">{trackingDisplay}</div>}
        </td>
        {/* Accepted Qty + QC breakdown link */}
        <td className="px-2 py-2 w-[80px]">
          {acceptedQty !== null ? (
            <div>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold min-w-[28px]">
                {acceptedQty}
              </span>
              {hasQCBatchData && (
                <button
                  onClick={() => setQcBatchViewOpen(true)}
                  className="mt-0.5 text-[11px] font-medium text-gray-400 hover:text-primary cursor-pointer transition-colors block whitespace-nowrap"
                >
                  View QC
                </button>
              )}
              {hasQCSerialData && (
                <button
                  onClick={() => setQcSerialViewOpen(true)}
                  className="mt-0.5 text-[11px] font-medium text-gray-400 hover:text-primary cursor-pointer transition-colors block whitespace-nowrap"
                >
                  View QC
                </button>
              )}
            </div>
          ) : <span className="text-gray-300 text-sm">—</span>}
        </td>
        {/* Rejected Qty */}
        <td className="px-2 py-2 w-[80px]">
          {rejectedQty !== null ? (
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold min-w-[28px]
            ${rejectedQty > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"}`}>
              {rejectedQty}
            </span>
          ) : <span className="text-gray-300 text-sm">—</span>}
        </td>
        {/* Accepted Amt */}
        <td className="px-2 py-2 w-[75px]">
          <span className="text-sm text-gray-600">{row.accepted_amount != null ? `₹${Number(row.accepted_amount).toLocaleString()}` : "—"}</span>
        </td>
        {/* Received Amt */}
        <td className="px-2 py-2 w-[75px]">
          <span className="text-sm text-gray-600">{row.received_amount != null ? `₹${Number(row.received_amount).toLocaleString()}` : "—"}</span>
        </td>
        {/* Rejected Amt */}
        <td className="px-2 py-2 w-[75px]">
          <span className="text-sm text-gray-600">{row.rejected_amount != null ? `₹${Number(row.rejected_amount).toLocaleString()}` : "—"}</span>
        </td>
        <td className="px-2 py-2 w-8" />
      </tr>
    </>
  );
}

// ─── QC Row ───────────────────────────────────────────────────────────────────
function QCRow({ row, qcData, onQCDataChange, onConfirmed }) {
  const [viewBatchOpen, setViewBatchOpen] = useState(false);
  const [viewSerialOpen, setViewSerialOpen] = useState(false);
  const [batchQcOpen, setBatchQcOpen] = useState(false);
  const [serialQcOpen, setSerialQcOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);

  // Per-row confirmed state (yellow = saved but not confirmed, green = confirmed via modal)
  const [isBatchConfirmed, setIsBatchConfirmed] = useState(false);
  const [isSerialConfirmed, setIsSerialConfirmed] = useState(false);

  const tracking = row.tracking_type;
  const isBatch = tracking === "batch";
  const isSerial = tracking === "serial";
  const isUntracked = tracking === "untracked";

  const batches = row.received_batches || row.batches || [];
  const serials = row.received_serials || row.serials || [];
  const displayName = row.product_name || row.sku_name || "—";
  const receivedQty = row.received_quantity != null ? Math.floor(Number(row.received_quantity)) : 0;
  const receivedAmt = row.received_amount != null ? Number(row.received_amount) : null;

  const untrackedInitializedRef = useRef(false);

  const qc = qcData || null;
  const hasQC = qc !== null && qc.acceptedCount !== null;

  // Untracked: default accepted = receivedQty, user can lower it
  const untrackedAccepted = qc?.untrackedAccepted ?? "";
  const parsedUntrackedAccepted = untrackedAccepted !== "" ? Number(untrackedAccepted) : receivedQty;
  const untrackedRejected = receivedQty - parsedUntrackedAccepted;

  const acceptedCount = isUntracked
    ? parsedUntrackedAccepted
    : (hasQC ? qc.acceptedCount : null);

  const rejectedCount = isUntracked
    ? untrackedRejected
    : (hasQC ? qc.rejectedCount : null);

  const rejectionReason = qc?.rejectionReason || "";

  // Initialise untracked qcData with defaults if not yet set
  // useEffect(() => {
  //   if (
  //     isUntracked &&
  //     !untrackedInitializedRef.current &&
  //     (qc == null || qc.untrackedAccepted == null)
  //   ) {
  //     untrackedInitializedRef.current = true;

  //     onQCDataChange({
  //       ...(qc || {}),
  //       untrackedAccepted: String(receivedQty),
  //       acceptedCount: receivedQty,
  //       rejectedCount: 0,
  //     });
  //   }
  // }, [isUntracked, qc, receivedQty]);

  const handleUntrackedChange = (val) => {
    if (val === "") {
      onQCDataChange({
        ...qc,
        untrackedAccepted: "",
        acceptedCount: 0,
        rejectedCount: receivedQty,
      });
      return;
    }

    const num = Math.min(Number(val), receivedQty);

    if (!Number.isFinite(num) || num < 0) return;

    onQCDataChange({
      ...qc,
      untrackedAccepted: String(num),
      acceptedCount: num,
      rejectedCount: receivedQty - num,
    });
  };

  return (
    <>
      {isBatch && <ViewBatchModal isOpen={viewBatchOpen} onClose={() => setViewBatchOpen(false)} skuName={displayName} batches={batches} />}
      {isSerial && <ViewSerialModal isOpen={viewSerialOpen} onClose={() => setViewSerialOpen(false)} skuName={displayName} serials={serials} />}
      {isBatch && (
        <QCBatchModal
          isOpen={batchQcOpen}
          onClose={() => setBatchQcOpen(false)}
          onSave={(result) => {
            onQCDataChange({ ...(qc || {}), ...result });
            setIsBatchConfirmed(true);
            onConfirmed(); // ← notify parent so allQCDone unlocks Submit
          }}
          skuName={displayName}
          batches={batches}
          savedQcData={qc}
        />
      )}
      {isSerial && (
        <QCSerialModal
          isOpen={serialQcOpen}
          onClose={() => setSerialQcOpen(false)}
          onSave={(result) => {
            onQCDataChange({ ...(qc || {}), ...result });
            setIsSerialConfirmed(true);
            onConfirmed(); // ← notify parent so allQCDone unlocks Submit
          }}
          skuName={displayName}
          serials={serials}
          savedQcData={qc}
        />
      )}
      <ReasonModal
        isOpen={reasonOpen}
        onClose={() => setReasonOpen(false)}
        onSave={(reason) => onQCDataChange({ ...(qc || {}), rejectionReason: reason })}
        existingReason={rejectionReason}
      />

      <tr className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
        {/* Col 1 — SKU Name */}
        <td className="px-2 py-3 w-[280px] max-w-[280px]">
          <span title={displayName} className="block truncate text-sm text-gray-800 font-medium">{displayName}</span>
        </td>

        {/* Col 2 — Received Qty + view link */}
        <td className="px-2 py-3 w-[100px]">
          <div className="text-sm text-gray-800 font-medium">{receivedQty}</div>
          {isBatch && (
            <button onClick={() => setViewBatchOpen(true)} className="mt-0.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors block whitespace-nowrap">
              View Batches
            </button>
          )}
          {isSerial && (
            <button onClick={() => setViewSerialOpen(true)} className="mt-0.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors block whitespace-nowrap">
              View Serials
            </button>
          )}
          {isUntracked && <div className="text-[10px] text-gray-400 italic mt-0.5">Untracked</div>}
        </td>

        {/* Col 3 — Received Amount */}
        <td className="px-2 py-3 w-[110px]">
          <span className="text-sm text-gray-600">
            {receivedAmt != null ? `₹${receivedAmt.toLocaleString()}` : "—"}
          </span>
        </td>

        {/* Col 4 — QC Check */}
        <td className="px-2 py-3 w-[110px]">
          {isBatch && (
            <button
              onClick={() => setBatchQcOpen(true)}
              className={`text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1
                ${isBatchConfirmed
                  ? "text-emerald-600 hover:text-emerald-700"
                  : hasQC
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-primary hover:opacity-75"}`}
            >
              {(hasQC || isBatchConfirmed) && <CheckCircle2 className="w-3 h-3 shrink-0" />}
              {isBatchConfirmed ? "Confirmed" : hasQC ? "Confirm Batches" : "Check Batches"}
            </button>
          )}
          {isSerial && (
            <button
              onClick={() => setSerialQcOpen(true)}
              className={`text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1
                ${isSerialConfirmed
                  ? "text-emerald-600 hover:text-emerald-700"
                  : hasQC
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-primary hover:opacity-75"}`}
            >
              {(hasQC || isSerialConfirmed) && <CheckCircle2 className="w-3 h-3 shrink-0" />}
              {isSerialConfirmed ? "Confirmed" : hasQC ? "Confirm Serials" : "Check Serials"}
            </button>
          )}
          {isUntracked && (
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Accepted qty</p>
              <input
                type="number" min="0" max={receivedQty} step="1"
                value={untrackedAccepted}
                onChange={(e) => handleUntrackedChange(e.target.value)}
                onKeyDown={(e) => { if ([".", "-", "e"].includes(e.key)) e.preventDefault(); }}
                onWheel={(e) => e.target.blur()}
                placeholder={String(receivedQty)}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">of {receivedQty} received</p>
              {Number(untrackedAccepted) > receivedQty && (
                <p className="text-[10px] text-red-500 mt-0.5">Max {receivedQty}</p>
              )}
            </div>
          )}
        </td>

        {/* Col 5 — Accepted Qty */}
        <td className="px-2 py-3 w-[90px]">
          {acceptedCount !== null ? (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold min-w-[28px]">
              {acceptedCount}
            </span>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>

        {/* Col 6 — Rejected Qty + reason link */}
        <td className="px-2 py-3 w-[100px]">
          {rejectedCount !== null ? (
            <div className="flex flex-col gap-0.5">
              <span className={`inline-flex items-center justify-center w-fit px-2 py-0.5 rounded-md text-xs font-semibold
                ${rejectedCount > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"}`}>
                {rejectedCount}
              </span>
              {rejectedCount > 0 && (
                <button
                  onClick={() => setReasonOpen(true)}
                  className={`text-[11px] font-medium cursor-pointer transition-colors w-fit whitespace-nowrap
                    ${rejectionReason ? "text-gray-500 hover:text-gray-700" : "text-amber-500 hover:text-amber-600"}`}
                >
                  {rejectionReason ? "Edit Reason" : "⚠ Add Reason"}
                </button>
              )}
            </div>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>
      </tr>
    </>
  );
}

// ─── Editable existing row ────────────────────────────────────────────────────
function EditableExistingRow({ row, skuOptions, onChange }) {
  const [batchingOpen, setBatchingOpen] = useState(false);
  const [serialOpen, setSerialOpen] = useState(false);

  const trackingType = row.tracking_type;
  const skuDisplayName = row.product_name || row.sku_name || "—";
  const batches = row.batches || [];
  const serials = row.serials || [];
  const selectedSku = skuOptions.find((sku) => sku.product_sku_id === row.product_sku_id) || {};
  const remainingQty = Math.trunc(selectedSku?.remaining_quantity ?? 0);

  const handleQtyChange = (v) => {
    const intVal = v === "" ? "" : String(Math.floor(Number(v)));
    if (intVal === "" || Number(intVal) > 0) onChange({ ...row, received_quantity: intVal });
  };

  return (
    <>
      {trackingType === "batch" && (
        <BatchingModal key={`batch-existing-${row._id}`} isOpen={batchingOpen} onClose={() => setBatchingOpen(false)}
          onSave={(newBatches) => onChange({ ...row, batches: newBatches })}
          skuName={skuDisplayName} totalQuantity={row.received_quantity || 0} initialBatches={batches} />
      )}
      {trackingType === "serial" && (
        <SerialModal key={`serial-existing-${row._id}`} isOpen={serialOpen} onClose={() => setSerialOpen(false)}
          onSave={(newSerials) => onChange({ ...row, serials: newSerials })}
          skuName={skuDisplayName} totalQuantity={row.received_quantity || 0} initialSerials={serials} />
      )}
      <tr className="border-b border-amber-100 bg-amber-50/30">
        <td className="px-2 py-2 w-[240px] max-w-[240px]">
          <span title={skuDisplayName} className="block truncate text-sm text-gray-800 font-medium">{skuDisplayName}</span>
        </td>
        <td className="px-2 py-2 w-[75px]">
          <div className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 truncate">
            {row.unit_price ? `₹${Number(row.unit_price).toLocaleString()}` : "—"}
          </div>
        </td>
        <td className="px-2 py-2 w-[80px]">
          <input type="number" min="1" step="1" value={row.received_quantity}
            onChange={(e) => handleQtyChange(e.target.value)}
            onKeyDown={(e) => { if ([".", "-", "e"].includes(e.key)) e.preventDefault(); }}
            placeholder="Qty"
            className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-primary text-center"
            onWheel={(e) => e.target.blur()} />
          {selectedSku && row.received_quantity > remainingQty && (
            <p className="text-[11px] text-red-600 mt-0.5">Only {remainingQty} remaining</p>
          )}
          <TrackingButton trackingType={trackingType} qty={row.received_quantity}
            batches={batches} serials={serials}
            onOpenBatch={() => setBatchingOpen(true)} onOpenSerial={() => setSerialOpen(true)} />
        </td>
        <td className="px-2 py-2 w-[80px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[80px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[75px]"><span className="text-[10px] text-gray-400 italic">Pending</span></td>
        <td className="px-2 py-2 w-[75px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[75px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-4" />
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
  const remainingQty = selectedSku ? Number(selectedSku.remaining_quantity) : Infinity;
  const batches = row.batches || [];
  const serials = row.serials || [];

  const handleSkuChange = (option) => {
    onChange({ ...row, product_sku_id: option.product_sku_id, unit_price: option.unit_price ? String(option.unit_price) : "", tracking_type: option.tracking_type || "", received_quantity: "", batches: [], serials: [] });
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

  const handleTrackingOpen = (type) => {
    if (!row.received_quantity || Number(row.received_quantity) <= 0) return;
    if (Number(row.received_quantity) > remainingQty) { toast.error(`Received qty exceeds remaining (${remainingQty}). Fix qty first.`); return; }
    if (type === "batch") setBatchingOpen(true); else setSerialOpen(true);
  };

  const availableOptions = skuOptions.filter((o) => !usedSkuIds.includes(o.product_sku_id) || o.product_sku_id === row.product_sku_id);

  return (
    <>
      {trackingType === "batch" && (
        <BatchingModal key={`batch-new-${row._id}-${row.received_quantity}`} isOpen={batchingOpen} onClose={() => setBatchingOpen(false)}
          onSave={(b) => onChange({ ...row, batches: b })} skuName={selectedSku?.product_name || ""}
          totalQuantity={row.received_quantity || 0} initialBatches={batches} />
      )}
      {trackingType === "serial" && (
        <SerialModal key={`serial-new-${row._id}-${row.received_quantity}`} isOpen={serialOpen} onClose={() => setSerialOpen(false)}
          onSave={(s) => onChange({ ...row, serials: s })} skuName={selectedSku?.product_name || ""}
          totalQuantity={row.received_quantity || 0} initialSerials={serials} />
      )}
      <tr className="border-b border-blue-100 bg-blue-50/30">
        <td className="px-2 py-2 w-[240px] max-w-[240px]" style={{ overflow: "visible" }}>
          <GrnSkuDropdown options={availableOptions} value={row.product_sku_id} onChange={handleSkuChange} disabled={false} placeholder="Select SKU..." />
        </td>
        <td className="px-2 py-2 w-[75px]">
          <div className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 truncate">
            {row.unit_price ? `₹${Number(row.unit_price).toLocaleString()}` : "—"}
          </div>
        </td>
        <td className="px-2 py-2 w-[80px]">
          <input type="number" min="1" step="1" value={row.received_quantity}
            onChange={(e) => handleQtyChange(e.target.value)}
            onKeyDown={(e) => { if ([".", "-", "e"].includes(e.key)) e.preventDefault(); }}
            placeholder="Qty"
            className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-primary text-center"
            onWheel={(e) => e.target.blur()} />
          {selectedSku && row.received_quantity > remainingQty && (
            <p className="text-[11px] text-red-600 mt-0.5">Only {remainingQty} remaining</p>
          )}
          <TrackingButton trackingType={trackingType} qty={row.received_quantity}
            batches={batches} serials={serials}
            onOpenBatch={() => handleTrackingOpen("batch")} onOpenSerial={() => handleTrackingOpen("serial")} />
        </td>
        <td className="px-2 py-2 w-[80px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[80px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[75px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[75px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[75px]"><span className="text-gray-300 text-sm">—</span></td>
        <td className="px-2 py-2 w-[10px]">
          <button onClick={onRemove} className="mx-auto text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </td>
      </tr>
    </>
  );
}

// ─── Main Export ─
export default function GrnLineItems({
  grnId, poId, grnStatus, initialLineItems, onSaved,
  setCanSendToQC = null, submittedQC = null, setSubmittedQC = null,
  setCanComplete = null, setIsLineItemsEditing = null, setHasSubmitted = null,
}) {
  const isQCPending = grnStatus === "qc_pending";
  const isCompleted = grnStatus === "completed";

  // showQCTable: true = QC table visible, false = normal table visible
  const [showQCTable, setShowQCTable] = useState(isQCPending && !submittedQC);

  // Track which rows have been "confirmed" via their modal so we can gate Submit QC
  // Map of rowKey → true (confirmed) | false (not yet confirmed)
  const [confirmedRowKeys, setConfirmedRowKeys] = useState({});

  useEffect(() => {
    setCanComplete?.(!showQCTable);
  }, [showQCTable]);

  useEffect(() => {
    setShowQCTable(isQCPending && !submittedQC);
  }, [isQCPending, submittedQC]);

  const makeNewRow = () => ({
    _id: Math.random().toString(36).slice(2),
    product_sku_id: null, unit_price: "", tracking_type: "",
    received_quantity: "", batches: [], serials: [], isNew: true,
  });

  const normalizeExisting = (items) =>
    (items || []).map((item) => {
      const rawBatches = item.received_batches || item.batches || [];
      const batches = rawBatches.map((b) => ({
        _id: Math.random().toString(36).slice(2),
        batch_code: b.batch_code || "",
        quantity: b.quantity != null ? String(b.quantity) : "",
        manufacture_date: b.manufacture_date ? new Date(b.manufacture_date) : null,
        expiry_date: b.expiry_date ? new Date(b.expiry_date) : null,
      }));
      const rawSerials = item.received_serials || item.serials || [];
      const serials = rawSerials.map((s) => typeof s === "string" ? s : s.serial_number || s.value || "");
      return {
        ...item,
        received_amount: item.received_amount,
        accepted_amount: item.accepted_amount,
        rejected_amount: item.rejected_amount,
        _id: String(item.id ?? item.product_sku_id ?? Math.random()),
        received_quantity: item.received_quantity != null ? String(Math.floor(Number(item.received_quantity))) : "",
        batches,
        serials,
        isNew: false,
      };
    });

  const [existingRows, setExistingRows] = useState(() => initialLineItems || []);
  const [editingRows, setEditingRows] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [skuOptions, setSkuOptions] = useState([]);
  const [loadingSku, setLoadingSku] = useState(false);
  const [saving, setSaving] = useState(false);

  // qcDataMap — populated from API on mount (if qc_pending) and updated as user interacts with QC modals
  const [qcDataMap, setQcDataMap] = useState({});
  const [qcDataLoading, setQcDataLoading] = useState(false);
  const qcDataFetchedRef = useRef(false);
  const skuFetchedRef = useRef(false);

  useEffect(() => { setExistingRows(initialLineItems || []); }, [initialLineItems]);

  const canEdit = grnStatus === "created";

  // ── Fetch QC data from API when status is qc_pending ─
  useEffect(() => {
    if (!isQCPending || !grnId || qcDataFetchedRef.current) return;
    qcDataFetchedRef.current = true;
    setQcDataLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grnId}`)
      .then((r) => r.json())
      .then((data) => {
        const lineItems = data?.data?.line_items || data?.data?.grn_line_items || data?.line_items || [];
        const map = {};

        lineItems.forEach((item) => {
          const rowKey = String(item.id ?? item.product_sku_id);
          const tracking = item.tracking_type;
          const receivedQty = item.received_quantity != null ? Math.floor(Number(item.received_quantity)) : 0;

          // For untracked: accepted_quantity is null when QC has never been submitted.
          // In that case seed accepted = receivedQty, rejected = 0 (fully accepted by default).
          // When accepted_quantity is explicitly set (even 0), respect the saved value.
          const qcNeverSubmitted =
            tracking === "untracked" &&
            (
              item.accepted_quantity == null ||
              (
                Number(item.accepted_quantity) === 0 &&
                Number(item.rejected_quantity) === 0 &&
                !item.rejection_reason
              )
            );
          const acceptedCount = qcNeverSubmitted ? receivedQty : (item.accepted_quantity != null ? Number(item.accepted_quantity) : receivedQty);
          const rejectedCount = qcNeverSubmitted ? 0 : (item.rejected_quantity != null ? Number(item.rejected_quantity) : 0);

          const accepted_batches = item.accepted_batches || [];
          const rejected_batches = item.rejected_batches || [];
          const accepted_serials = Array.isArray(item.accepted_serials) ? item.accepted_serials : [];
          const rejected_serials = Array.isArray(item.rejected_serials) ? item.rejected_serials : [];

          map[rowKey] = {
            acceptedCount,
            rejectedCount,
            accepted_batches,
            rejected_batches,
            accepted_serials,
            rejected_serials,
            rejectionReason: item.rejection_reason || "",
            ...(tracking === "untracked" ? { untrackedAccepted: String(acceptedCount) } : {}),
          };
        });

        setQcDataMap(map);
      })
      .catch(() => {
        const map = {};
        (initialLineItems || []).forEach((item) => {
          const rowKey = String(item.id ?? item.product_sku_id);
          const tracking = item.tracking_type;
          const receivedQty = item.received_quantity != null ? Math.floor(Number(item.received_quantity)) : 0;
          const qcNeverSubmitted = tracking === "untracked" && item.accepted_quantity == null;
          const acceptedCount = qcNeverSubmitted ? receivedQty : (item.accepted_quantity != null ? Number(item.accepted_quantity) : receivedQty);
          const rejectedCount = qcNeverSubmitted ? 0 : (item.rejected_quantity != null ? Number(item.rejected_quantity) : 0);

          map[rowKey] = {
            acceptedCount,
            rejectedCount,
            accepted_batches: item.accepted_batches || [],
            rejected_batches: item.rejected_batches || [],
            accepted_serials: Array.isArray(item.accepted_serials) ? item.accepted_serials : [],
            rejected_serials: Array.isArray(item.rejected_serials) ? item.rejected_serials : [],
            rejectionReason: item.rejection_reason || "",
            ...(tracking === "untracked" ? { untrackedAccepted: String(acceptedCount) } : {}),
          };
        });
        setQcDataMap(map);
      })
      .finally(() => setQcDataLoading(false));
  }, [isQCPending, grnId]);

  // ── SKU options for edit mode ──
  useEffect(() => {
    if (!isEditing || skuFetchedRef.current || !grnId || !poId) return;
    skuFetchedRef.current = true;
    setLoadingSku(true);
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/po_receiving_summary?po_id=${poId}&grn_id=${grnId}`)
      .then((r) => r.json())
      .then((d) => setSkuOptions(d?.data || []))
      .catch(() => toast.error("Failed to load SKU options."))
      .finally(() => setLoadingSku(false));
  }, [isEditing, grnId, poId]);

  const handleEnterEditMode = () => {
    setEditingRows(normalizeExisting(existingRows));
    setNewRows([]);
    setIsEditing(true);
    setIsLineItemsEditing?.(true);
  };

  const handleCancelEdit = () => {
    setEditingRows([]);
    setNewRows([]);
    setIsEditing(false);
    setIsLineItemsEditing?.(false);
  };

  const usedSkuIds = [
    ...editingRows.map((r) => r.product_sku_id).filter(Boolean),
    ...newRows.map((r) => r.product_sku_id).filter(Boolean),
  ];

  const validateRows = (rows, isExisting = false) => {
    for (const row of rows) {
      const sku = skuOptions.find((o) => o.product_sku_id === row.product_sku_id);
      const skuName = row.product_name || row.sku_name || sku?.product_name || "Unknown SKU";
      if (!row.product_sku_id) { toast.error("Please select a SKU for all rows."); return false; }
      const qty = Number(row.received_quantity);
      if (!row.received_quantity || qty <= 0) { toast.error(`Received qty must be > 0 for "${skuName}".`); return false; }
      if (!isExisting) {
        const remainingQty = sku ? Number(sku.remaining_quantity) : Infinity;
        if (qty > remainingQty) { toast.error(`Qty for "${skuName}" (${qty}) exceeds remaining (${remainingQty}).`); return false; }
      }
      const tt = sku?.tracking_type || row.tracking_type;
      if (tt === "batch") {
        if (!row.batches?.length) { toast.error(`Add batch details for "${skuName}".`); return false; }
        const batchTotal = row.batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
        if (batchTotal !== qty) { toast.error(`Batch total (${batchTotal}) must match received qty (${qty}) for "${skuName}".`); return false; }
      }
      if (tt === "serial") {
        if (!row.serials?.length) { toast.error(`Add serial numbers for "${skuName}".`); return false; }
        if (row.serials.length !== qty) { toast.error(`Serial count (${row.serials.length}) must match received qty (${qty}) for "${skuName}".`); return false; }
      }
    }
    return true;
  };

  const buildPayloadItem = (r) => {
    const sku = skuOptions.find((o) => o.product_sku_id === r.product_sku_id);
    const tt = sku?.tracking_type || r.tracking_type;
    const item = { product_sku_id: r.product_sku_id, received_quantity: Number(r.received_quantity), unit_price: Number(r.unit_price) };
    if (tt === "batch" && r.batches?.length > 0) {
      item.received_batches = r.batches.map((b) => ({ batch_code: b.batch_code, quantity: Number(b.quantity), manufacture_date: b.manufacture_date || null, expiry_date: b.expiry_date || null }));
    }
    if (tt === "serial" && r.serials?.length > 0) item.received_serials = r.serials;
    return item;
  };

  const handleSave = async () => {
    if (editingRows.length === 0 && newRows.length === 0) { toast.error("No line items to save."); return; }
    if (!validateRows(editingRows, true)) return;
    if (!validateRows(newRows, false)) return;
    const grn_line_items = [...editingRows.map(buildPayloadItem), ...newRows.map(buildPayloadItem)];
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grnId}/grn_line_items`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grn_line_items }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Line items saved.");
        setEditingRows([]);
        setNewRows([]);
        setIsEditing(false);
        setIsLineItemsEditing?.(false);
        onSaved?.();
      } else throw new Error(data?.errors?.[0]);
    } catch (err) { toast.error("Failed to save GRN line items " + err); }
    finally { setSaving(false); }
  };

  // ── QC Save ───────────────────────────────────────────────────────────────────
  const handleQCSave = async () => {
    const rows = normalizeExisting(existingRows);

    // Check all non-untracked rows are confirmed via modal
    const unconfirmedRows = [];
    for (const row of rows) {
      const tracking = row.tracking_type;
      const rowKey = String(row._id || row.id);
      const displayName = row.product_name || row.sku_name || "Unknown";

      if (tracking === "batch" && !confirmedRowKeys[rowKey]) {
        unconfirmedRows.push(displayName);
      } else if (tracking === "serial" && !confirmedRowKeys[rowKey]) {
        unconfirmedRows.push(displayName);
      }
    }

    if (unconfirmedRows.length > 0) {
      toast.error(`Please confirm QC for: ${unconfirmedRows.join(", ")}`, { autoClose: 4000 });
      return;
    }

    for (const row of rows) {
      const tracking = row.tracking_type;
      const rowKey = String(row._id || row.id);
      const qc = qcDataMap[rowKey];
      const displayName = row.product_name || row.sku_name || "Unknown";

      if (tracking !== "untracked") {
        if (!qc || qc.acceptedCount === null) {
          toast.error(`Please complete QC check for "${displayName}".`);
          return;
        }
        if ((qc.rejectedCount ?? 0) > 0 && !qc.rejectionReason) {
          toast.error(`Please provide a rejection reason for "${displayName}".`);
          return;
        }
      }
    }

    const grn_line_items = rows.map((row) => {
      const rowKey = String(row._id || row.id);
      const qc = qcDataMap[rowKey];
      const tracking = row.tracking_type;
      const receivedQty = Math.floor(Number(row.received_quantity));
      const item = {
        id: row.id,
        product_sku_id: row.product_sku_id,
        accepted_quantity: qc?.acceptedCount ?? receivedQty,
        rejected_quantity: qc?.rejectedCount ?? 0,
      };
      if (tracking === "batch") { item.accepted_batches = qc?.accepted_batches || []; item.rejected_batches = qc?.rejected_batches || []; }
      if (tracking === "serial") { item.accepted_serials = qc?.accepted_serials || []; item.rejected_serials = qc?.rejected_serials || []; }
      if ((qc?.rejectedCount ?? 0) > 0 && qc?.rejectionReason) item.rejection_reason = qc.rejectionReason;
      return item;
    });

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grnId}/qc_line_items`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grn_line_items }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("QC results saved successfully.");
        setShowQCTable(false);
        setSubmittedQC?.(true);
        setHasSubmitted?.(true);
        onSaved?.();
      } else throw new Error(data?.errors?.[0]);
    } catch (err) { toast.error("Failed to save QC results: " + err); }
    finally { setSaving(false); }
  };

  // ── allQCDone check ───────────────────────────────────────────────────────────
  const normalizedRowsForQC = normalizeExisting(existingRows);

  // allQCDone = every row has data AND (batch/serial rows must be confirmed)
  const allQCDone = normalizedRowsForQC.every((row) => {
    const tracking = row.tracking_type;
    const rowKey = String(row._id || row.id);
    const qc = qcDataMap[rowKey];

    if (tracking === "untracked") {
      // Untracked is always fine — defaults to fully accepted
      return true;
    }
    // batch / serial: must be confirmed via modal
    if (!confirmedRowKeys[rowKey]) return false;
    if (!qc || qc.acceptedCount === null) return false;
    if ((qc.rejectedCount ?? 0) > 0 && !qc.rejectionReason) return false;
    return true;
  });

  // ── QC Table ──────────────────────────────────────────────────────────────────
  if (showQCTable) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-primary">GRN Line Items</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">QC Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQCTable(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Close QC View
            </button>
            <button
              onClick={handleQCSave}
              disabled={saving || !allQCDone}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all
                ${allQCDone && !saving ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Submit QC"}
            </button>
          </div>
        </div>

        {qcDataLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading QC data...</span>
          </div>
        ) : (
          <>
            <div className="border border-gray-200 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-[280px] max-w-[280px]">SKU Name</th>
                      <TwoLineHeader line1="Received" line2="Qty" cls="w-[100px]" />
                      <TwoLineHeader line1="Received" line2="Amt." cls="w-[110px]" />
                      <TwoLineHeader line1="QC" line2="Check" cls="w-[110px]" />
                      <TwoLineHeader line1="Accepted" line2="Qty" cls="w-[90px]" />
                      <TwoLineHeader line1="Rejected" line2="Qty" cls="w-[100px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedRowsForQC.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Package className="w-8 h-8" />
                            <span className="text-sm">No line items found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : normalizedRowsForQC.map((row) => {
                      const rowKey = String(row._id || row.id);
                      return (
                        <QCRow
                          key={rowKey}
                          row={row}
                          qcData={qcDataMap[rowKey]}
                          onQCDataChange={(data) => setQcDataMap((prev) => ({ ...prev, [rowKey]: data }))}
                          onConfirmed={() => setConfirmedRowKeys((prev) => ({ ...prev, [rowKey]: true }))}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {!allQCDone && normalizedRowsForQC.length > 0 && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Complete and confirm QC for all items before submitting.
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Normal View ───────────────────────────────────────────────────────────────
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-primary">GRN Line Items</h3>
        <div className="flex items-center gap-2">
          {isQCPending && (
            <button
              onClick={() => setShowQCTable(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              QC Check
            </button>
          )}

          {isEditing ? (
            <>
              <button onClick={handleCancelEdit} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 cursor-pointer">
                <X className="w-3.5 h-3.5" />Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-all cursor-pointer">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : canEdit ? (
            <button onClick={handleEnterEditMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary hover:text-gray-100 transition-colors cursor-pointer">
              <Edit2 className="w-3.5 h-3.5" />Edit Items
            </button>
          ) : null}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl">
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-[240px] max-w-[240px]">SKU Name</th>
                <TwoLineHeader line1="Unit" line2="Price" cls="w-[75px]" />
                <TwoLineHeader line1="Received" line2="Qty" cls="w-[80px]" />
                <TwoLineHeader line1="Accepted" line2="Qty" cls="w-[80px]" />
                <TwoLineHeader line1="Rejected" line2="Qty" cls="w-[80px]" />
                <TwoLineHeader line1="Accepted" line2="Amt." cls="w-[75px]" />
                <TwoLineHeader line1="Received" line2="Amt." cls="w-[75px]" />
                <TwoLineHeader line1="Rejected" line2="Amt." cls="w-[75px]" />
                <th className="px-2 py-2.5 w-4" />
              </tr>
            </thead>
            <tbody>
              {isEditing ? (
                <>
                  {editingRows.map((row, idx) => (
                    <EditableExistingRow key={row._id} row={row} skuOptions={skuOptions}
                      onChange={(updated) => setEditingRows((prev) => prev.map((r, i) => i === idx ? updated : r))} />
                  ))}
                  {newRows.map((row, idx) => (
                    <EditableRow key={row._id} row={row} skuOptions={skuOptions} usedSkuIds={usedSkuIds}
                      onChange={(updated) => setNewRows((prev) => prev.map((r, i) => i === idx ? updated : r))}
                      onRemove={() => setNewRows((prev) => prev.filter((_, i) => i !== idx))} />
                  ))}
                  <tr>
                    <td colSpan={9} className="px-3 py-3 border-t border-gray-50">
                      {loadingSku ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" />Loading SKUs...</div>
                      ) : (
                        <button onClick={() => setNewRows((prev) => [...prev, makeNewRow()])}
                          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-75 transition-opacity cursor-pointer">
                          <Plus className="w-4 h-4" />Add another row
                        </button>
                      )}
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  {existingRows.map((row) => (
                    <ReadOnlyRow
                      key={row.id ?? row.product_sku_id}
                      row={row}
                    />
                  ))}
                  {existingRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Package className="w-8 h-8" />
                          <span className="text-sm">No line items yet.</span>
                          {canEdit && (
                            <button onClick={handleEnterEditMode} className="mt-1 text-xs text-primary font-medium hover:underline cursor-pointer">
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