"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, CheckSquare, Square, Minus, Eye } from "lucide-react";

// ─── Portal ───────────────────────────────────────────────────────────────────
function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

const formatDate = (d) => {
  if (!d) return "—";
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d); }
};

// ─── View-only Batch Modal ────────────────────────────────────────────────────
export function ViewBatchModal({ isOpen, onClose, skuName, batches = [] }) {
  if (!isOpen) return null;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-bold text-gray-900">Received Batches</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {batches.length} batch{batches.length !== 1 ? "es" : ""} · {batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)} units total
            </span>
          </div>
          <div className="px-6 py-4">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Batch Code</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Qty</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">Mfg. Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {batches.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-800">{b.batch_code || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{b.quantity ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(b.manufacturing_date || b.manufacture_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(b.expiry_date)}</td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No batches found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end px-6 pb-5">
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── View-only Serial Modal ───────────────────────────────────────────────────
export function ViewSerialModal({ isOpen, onClose, skuName, serials = [] }) {
  if (!isOpen) return null;
  const half = Math.ceil(serials.length / 2);
  const col1 = serials.slice(0, half);
  const col2 = serials.slice(half);
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-bold text-gray-900">Received Serials</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">{serials.length} serial{serials.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="px-6 py-4">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="max-h-[340px] overflow-y-auto">
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {[col1, col2].map((col, colIdx) => (
                    <div key={colIdx} className="divide-y divide-gray-50">
                      {col.map((serial, rowIdx) => {
                        const globalIdx = colIdx === 0 ? rowIdx : half + rowIdx;
                        return (
                          <div key={serial} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="text-[10px] font-bold text-gray-400 font-mono w-6 shrink-0">#{globalIdx + 1}</span>
                            <span className="text-xs font-mono text-gray-800 truncate">{serial}</span>
                          </div>
                        );
                      })}
                      {col.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">—</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end px-6 pb-5">
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Reason Modal ─────────────────────────────────────────────────────────────
export function ReasonModal({ isOpen, onClose, onSave, existingReason = "" }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason(existingReason || "");
  }, [isOpen, existingReason]);

  const isValid = reason.trim().length >= 10;
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Rejection Reason</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Please provide a reason for rejection</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Enter reason (minimum 10 characters)..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              {!isValid && reason.length > 0 ? (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="w-3 h-3" />At least 10 characters required
                </span>
              ) : <span />}
              <span className="text-xs text-gray-400 ml-auto">{reason.trim().length} chars</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 pb-5 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => { if (isValid) { onSave(reason.trim()); onClose(); } }}
              disabled={!isValid}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors
                ${isValid ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              Save Reason
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── QC Batch Modal ───────────────────────────────────────────────────────────
// onSave is called when user clicks "Confirm QC" — parent marks the row as confirmed.
export function QCBatchModal({ isOpen, onClose, onSave, skuName, batches = [], savedQcData = null }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const acceptedMap = {};
    const rejectedMap = {};

    if (savedQcData?.accepted_batches?.length) {
      savedQcData.accepted_batches.forEach((ab) => {
        acceptedMap[ab.batch_code] = Number(ab.quantity);
      });
    }
    if (savedQcData?.rejected_batches?.length) {
      savedQcData.rejected_batches.forEach((rb) => {
        rejectedMap[rb.batch_code] = Number(rb.quantity);
      });
    }

    const hasAnyPriorData =
      Object.keys(acceptedMap).length > 0 || Object.keys(rejectedMap).length > 0;

    setRows(
      batches.map((b) => {
        const receivedQty = Number(b.quantity) || 0;
        let acceptedQty;

        if (!hasAnyPriorData) {
          acceptedQty = receivedQty;
        } else if (b.batch_code in acceptedMap) {
          acceptedQty = acceptedMap[b.batch_code];
        } else if (b.batch_code in rejectedMap) {
          acceptedQty = Math.max(0, receivedQty - rejectedMap[b.batch_code]);
        } else {
          acceptedQty = receivedQty;
        }

        return {
          ...b,
          _id: Math.random().toString(36).slice(2),
          accepted_quantity: String(acceptedQty),
        };
      })
    );
  }, [isOpen]);

  const totalReceived = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalAccepted = rows.reduce((s, r) => s + (Number(r.accepted_quantity) || 0), 0);
  const totalRejected = totalReceived - totalAccepted;

  const updateRow = (id, val) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const max = Number(r.quantity) || 0;
        if (val === "") return { ...r, accepted_quantity: "" };
        const num = Math.floor(Number(val));
        if (isNaN(num) || num < 0) return r;
        return { ...r, accepted_quantity: String(Math.min(num, max)) };
      })
    );
  };

  const allValid = rows.length > 0 && rows.every((r) => r.accepted_quantity !== "" && Number(r.accepted_quantity) >= 0);

  const handleSave = () => {
    if (!allValid) return;

    const toDate = (d) => {
      if (!d) return null;
      if (d instanceof Date) return d.toISOString().split("T")[0];
      return d;
    };

    const accepted_batches = rows
      .filter((r) => Number(r.accepted_quantity) > 0)
      .map((r) => ({
        batch_code: r.batch_code,
        quantity: Number(r.accepted_quantity),
        manufacture_date: toDate(r.manufacturing_date || r.manufacture_date),
        expiry_date: toDate(r.expiry_date),
      }));

    const rejected_batches = rows
      .filter((r) => Number(r.accepted_quantity) < Number(r.quantity))
      .map((r) => ({
        batch_code: r.batch_code,
        quantity: Number(r.quantity) - Number(r.accepted_quantity),
        manufacture_date: toDate(r.manufacturing_date || r.manufacture_date),
        expiry_date: toDate(r.expiry_date),
      }));

    // onSave triggers parent to mark row as confirmed (yellow → green)
    onSave({
      accepted_batches,
      rejected_batches,
      acceptedCount: totalAccepted,
      rejectedCount: totalRejected,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">QC — Batch Review</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SKU + live summary */}
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-gray-500">Received: <span className="text-gray-800">{totalReceived}</span></span>
              <span className="text-emerald-600">Accepted: {totalAccepted}</span>
              {totalRejected > 0 && <span className="text-red-500">Rejected: {totalRejected}</span>}
              {totalRejected === 0 && totalReceived > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> Fully accepted
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="px-6 py-4 max-h-[420px] overflow-y-auto">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Batch Code</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">
                      <span className="block">Received</span><span className="block">Qty</span>
                    </th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-32">
                      <span className="block">Accepted</span><span className="block">Qty</span>
                    </th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">
                      <span className="block">Rejected</span><span className="block">Qty</span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">Mfg. Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r, idx) => {
                    const received = Number(r.quantity) || 0;
                    const accepted = r.accepted_quantity === "" ? 0 : Number(r.accepted_quantity);
                    const rejected = received - accepted;
                    const isOver = accepted > received;
                    return (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-800">{r.batch_code}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-center">{received}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={received}
                            step="1"
                            value={r.accepted_quantity}
                            onChange={(e) => updateRow(r._id, e.target.value)}
                            onKeyDown={(e) => { if ([".", "-", "e"].includes(e.key)) e.preventDefault(); }}
                            onWheel={(e) => e.target.blur()}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-sm text-center focus:outline-none bg-white
                              ${isOver ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-primary"}`}
                          />
                          {isOver && <p className="text-[10px] text-red-500 mt-0.5 text-center">Max {received}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rejected > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-semibold">
                              {rejected}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.manufacturing_date || r.manufacture_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.expiry_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totals footer */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-800 text-center">{totalReceived}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                          {totalAccepted}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {totalRejected > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold">
                            {totalRejected}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center items-center gap-3 px-6 pb-5 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="w-40 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Go Back
            </button>
            <button
              onClick={handleSave}
              disabled={!allValid}
              className={`w-40 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2
                ${allValid ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm QC
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── QC Serial Modal ──────────────────────────────────────────────────────────
// onSave is called when user clicks "Confirm QC" — parent marks the row as confirmed.
export function QCSerialModal({ isOpen, onClose, onSave, skuName, serials = [], savedQcData = null }) {
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    if (!isOpen) return;

    const acceptedSerials = savedQcData?.accepted_serials || [];
    const rejectedSerials = savedQcData?.rejected_serials || [];

    if (acceptedSerials.length > 0) {
      setChecked(new Set(acceptedSerials));
    } else if (rejectedSerials.length > 0) {
      const rejectedSet = new Set(rejectedSerials);
      setChecked(new Set(serials.filter((s) => !rejectedSet.has(s))));
    } else {
      setChecked(new Set(serials));
    }
  }, [isOpen]);

  const allSelected = checked.size === serials.length;
  const noneSelected = checked.size === 0;

  const toggleAll = () => {
    if (allSelected) setChecked(new Set());
    else setChecked(new Set(serials));
  };

  const toggleOne = (s) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const acceptedCount = checked.size;
  const rejectedCount = serials.length - acceptedCount;

  const handleSave = () => {
    // onSave triggers parent to mark row as confirmed (yellow → green)
    onSave({
      accepted_serials: serials.filter((s) => checked.has(s)),
      rejected_serials: serials.filter((s) => !checked.has(s)),
      acceptedCount,
      rejectedCount,
    });
    onClose();
  };

  if (!isOpen) return null;
  const half = Math.ceil(serials.length / 2);
  const col1 = serials.slice(0, half);
  const col2 = serials.slice(half);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">QC — Serial Review</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SKU + live summary */}
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-gray-500">Total: <span className="text-gray-800">{serials.length}</span></span>
              <span className="text-emerald-600">Accepted: {acceptedCount}</span>
              {rejectedCount > 0 && <span className="text-red-500">Rejected: {rejectedCount}</span>}
              {rejectedCount === 0 && serials.length > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> All accepted
                </span>
              )}
            </div>
          </div>

          {/* Select all row */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer">
              {allSelected ? <CheckSquare className="w-4 h-4 text-primary" />
                : !noneSelected ? <Minus className="w-4 h-4 text-primary" />
                : <Square className="w-4 h-4 text-gray-400" />}
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs text-gray-400">{acceptedCount} of {serials.length} selected as accepted</span>
          </div>

          {/* Serial grid */}
          <div className="px-6 pb-4">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="max-h-[340px] overflow-y-auto">
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {[col1, col2].map((col, colIdx) => (
                    <div key={colIdx} className="divide-y divide-gray-50">
                      {col.map((serial, rowIdx) => {
                        const globalIdx = colIdx === 0 ? rowIdx : half + rowIdx;
                        const isChecked = checked.has(serial);
                        return (
                          <label
                            key={serial}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                              ${isChecked ? "bg-white hover:bg-gray-50" : "bg-red-50/40 hover:bg-red-50/70"}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleOne(serial)}
                              className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer accent-primary"
                            />
                            <span className="text-[10px] font-bold text-gray-400 font-mono w-6 shrink-0">#{globalIdx + 1}</span>
                            <span className={`text-xs font-mono truncate ${isChecked ? "text-gray-800" : "text-gray-400 line-through"}`}>
                              {serial}
                            </span>
                            {!isChecked && <span className="ml-auto shrink-0 text-[9px] font-bold text-red-400 uppercase">Rejected</span>}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center items-center gap-3 px-6 pb-5 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="w-40 max-w-[160px] px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Go Back
            </button>
            <button
              onClick={handleSave}
              className="w-40 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm QC
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Read-only QC Batch View Modal ────────────────────────────────────────────
// Shows per-batch accepted / rejected breakdown. No editing — purely informational.
// accepted_batches and rejected_batches come directly from the row (API data).
export function QCBatchViewModal({ isOpen, onClose, skuName, receivedBatches = [], acceptedBatches = [], rejectedBatches = [] }) {
  if (!isOpen) return null;

  // Build a lookup so we can show accepted + rejected qty per batch code
  const acceptedMap = {};
  acceptedBatches.forEach((b) => { acceptedMap[b.batch_code] = Number(b.quantity) || 0; });
  const rejectedMap = {};
  rejectedBatches.forEach((b) => { rejectedMap[b.batch_code] = Number(b.quantity) || 0; });

  const totalReceived = receivedBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const totalAccepted = acceptedBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const totalRejected = rejectedBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-bold text-gray-900">QC Batch Breakdown</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary bar */}
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-gray-500">Received: <span className="text-gray-800">{totalReceived}</span></span>
              <span className="text-emerald-600">Accepted: {totalAccepted}</span>
              {totalRejected > 0 && <span className="text-red-500">Rejected: {totalRejected}</span>}
              {totalRejected === 0 && totalReceived > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> Fully accepted
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="px-6 py-4 max-h-[420px] overflow-y-auto">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Batch Code</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">
                      <span className="block">Received</span><span className="block">Qty</span>
                    </th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">
                      <span className="block">Accepted</span><span className="block">Qty</span>
                    </th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">
                      <span className="block">Rejected</span><span className="block">Qty</span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">Mfg. Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {receivedBatches.map((b, idx) => {
                    const received = Number(b.quantity) || 0;
                    const accepted = acceptedMap[b.batch_code] ?? received;
                    const rejected = rejectedMap[b.batch_code] ?? 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-800">{b.batch_code || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-center">{received}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            {accepted}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {rejected > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-semibold">
                              {rejected}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(b.manufacturing_date || b.manufacture_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(b.expiry_date)}</td>
                      </tr>
                    );
                  })}
                  {receivedBatches.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">No batch data available.</td></tr>
                  )}
                </tbody>

                {/* Totals footer */}
                {receivedBatches.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-800 text-center">{totalReceived}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
                          {totalAccepted}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {totalRejected > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold">
                            {totalRejected}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5" />
                      <td className="px-4 py-2.5" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 pb-5 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Read-only QC Serial View Modal ──────────────────────────────────────────
// Shows each serial with its accepted / rejected status. No editing.
export function QCSerialViewModal({ isOpen, onClose, skuName, receivedSerials = [], acceptedSerials = [], rejectedSerials = [] }) {
  if (!isOpen) return null;

  const acceptedSet = new Set(acceptedSerials);
  const rejectedSet = new Set(rejectedSerials);

  const acceptedCount = acceptedSerials.length;
  const rejectedCount = rejectedSerials.length;

  const half = Math.ceil(receivedSerials.length / 2);
  const col1 = receivedSerials.slice(0, half);
  const col2 = receivedSerials.slice(half);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-bold text-gray-900">QC Serial Breakdown</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary bar */}
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</span>
              <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-gray-500">Total: <span className="text-gray-800">{receivedSerials.length}</span></span>
              <span className="text-emerald-600">Accepted: {acceptedCount}</span>
              {rejectedCount > 0 && <span className="text-red-500">Rejected: {rejectedCount}</span>}
              {rejectedCount === 0 && receivedSerials.length > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> All accepted
                </span>
              )}
            </div>
          </div>

          {/* Serial grid */}
          <div className="px-6 py-4">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto">
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {[col1, col2].map((col, colIdx) => (
                    <div key={colIdx} className="divide-y divide-gray-50">
                      {col.map((serial, rowIdx) => {
                        const globalIdx = colIdx === 0 ? rowIdx : half + rowIdx;
                        const isAccepted = acceptedSet.size > 0 ? acceptedSet.has(serial) : !rejectedSet.has(serial);
                        return (
                          <div
                            key={serial}
                            className={`flex items-center gap-3 px-4 py-2.5 ${isAccepted ? "bg-white" : "bg-red-50/40"}`}
                          >
                            <span className="text-[10px] font-bold text-gray-400 font-mono w-6 shrink-0">#{globalIdx + 1}</span>
                            <span className={`text-xs font-mono truncate flex-1 ${isAccepted ? "text-gray-800" : "text-gray-400 line-through"}`}>
                              {serial}
                            </span>
                            {isAccepted ? (
                              <span className="shrink-0 text-[9px] font-bold text-emerald-500 uppercase">Accepted</span>
                            ) : (
                              <span className="shrink-0 text-[9px] font-bold text-red-400 uppercase">Rejected</span>
                            )}
                          </div>
                        );
                      })}
                      {col.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">—</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 pb-5 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}