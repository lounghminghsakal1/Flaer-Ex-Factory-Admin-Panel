"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "../../../create/_components/DatePicker";

// ─── Portal wrapper — renders children at document.body, fixing any
//     "div cannot be child of tbody/tr" DOM nesting errors when modals
//     are rendered from inside table rows.
function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Batching Modal ───────────────────────────────────────────────────────────
export function BatchingModal({
  isOpen,
  onClose,
  onSave,
  skuName,
  totalQuantity,
  initialBatches = [],
}) {
  const emptyBatch = () => ({
    _id: Math.random().toString(36).slice(2),
    batch_code: "",
    quantity: "",
    manufacturing_date: null,
    expiry_date: null,
  });

  const [batches, setBatches] = useState(() =>
    initialBatches.length
      ? initialBatches.map((b) => ({ ...b, _id: Math.random().toString(36).slice(2) }))
      : [emptyBatch()]
  );

  // Re-seed when modal opens — preserve existing values if present
  useEffect(() => {
    if (!isOpen) return;
    setBatches(
      initialBatches.length
        ? initialBatches.map((b) => ({ ...b, _id: Math.random().toString(36).slice(2) }))
        : [emptyBatch()]
    );
  }, [isOpen]); // intentionally only re-run on isOpen change

  const totalEntered = batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  const remaining = Number(totalQuantity) - totalEntered;

  const updateBatch = (id, key, val) =>
    setBatches((prev) => prev.map((b) => (b._id === id ? { ...b, [key]: val } : b)));

  const removeBatch = (id) =>
    setBatches((prev) => prev.filter((b) => b._id !== id));

  const handleAddBatch = () => {
    if (totalEntered >= Number(totalQuantity)) {
      toast.error(`All ${totalQuantity} units are already allocated across batches.`);
      return;
    }
    setBatches((prev) => [...prev, emptyBatch()]);
  };

  const handleSave = () => {
    for (const b of batches) {
      if (!b.batch_code.trim()) { toast.error("Batch code is required for all rows."); return; }
      if (!b.quantity || Number(b.quantity) <= 0) { toast.error("Quantity must be > 0 for all rows."); return; }
    }
    if (totalEntered !== Number(totalQuantity)) {
      toast.error(`Total batch qty (${totalEntered}) must equal received qty (${totalQuantity}).`);
      return;
    }
    onSave(batches);
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
            <h2 className="text-lg font-bold text-gray-900">Batching</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SKU info bar */}
          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-500">SKU</span>
              <span className="font-semibold text-gray-800">{skuName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-800">{totalQuantity}</span>
              <span className="text-gray-500">Quantity</span>
              {remaining > 0 && (
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {remaining} remaining
                </span>
              )}
              {remaining < 0 && (
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  {Math.abs(remaining)} over
                </span>
              )}
              {remaining === 0 && batches.some((b) => b.quantity) && (
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                  All allocated
                </span>
              )}
            </div>
          </div>

          {/* Batch table */}
          <div className="px-6 py-4">
            <div className="border border-gray-100 rounded-xl overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">S.No</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Batch Code</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Quantity</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Manufacturing Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Expiry Date</th>
                    <th className="px-4 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {batches.map((b, idx) => (
                    <tr key={b._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-500 align-middle">{idx + 1}</td>
                      <td className="px-4 py-3 align-middle">
                        <input
                          value={b.batch_code}
                          onChange={(e) => updateBatch(b._id, "batch_code", e.target.value)}
                          placeholder="Batch code"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-primary bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={b.quantity}
                          onKeyDown={(e) => { if ([".", "-", "e"].includes(e.key)) e.preventDefault(); }}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || Number(v) > 0) updateBatch(b._id, "quantity", v);
                          }}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-primary bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle" style={{ overflow: "visible" }}>
                        <DatePicker
                          disableFuture
                          value={b.manufacturing_date}
                          onChange={(d) => updateBatch(b._id, "manufacturing_date", d)}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle" style={{ overflow: "visible" }}>
                        <DatePicker
                          value={b.expiry_date}
                          onChange={(d) => updateBatch(b._id, "expiry_date", d)}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          onClick={() => removeBatch(b._id)}
                          className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="px-4 py-3 border-t border-gray-50">
                      <button
                        onClick={handleAddBatch}
                        className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-75 transition-opacity cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add Batch
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-4 px-6 pb-5">
            <button
              onClick={onClose}
              className="flex-1 max-w-[180px] px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 max-w-[180px] px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Serial Modal ─────────────────────────────────────────────────────────────
export function SerialModal({
  isOpen,
  onClose,
  onSave,
  skuName,
  totalQuantity,
  initialSerials = [],
}) {
  const makeSerials = (qty) =>
    Array.from({ length: Number(qty) || 1 }, () => ({
      _id: Math.random().toString(36).slice(2),
      value: "",
    }));

  const [serials, setSerials] = useState(() =>
    initialSerials.length
      ? initialSerials.map((s) => ({ _id: Math.random().toString(36).slice(2), value: s }))
      : makeSerials(totalQuantity)
  );

  // Re-seed on open — preserve existing serial values if present
  useEffect(() => {
    if (!isOpen) return;
    setSerials(
      initialSerials.length
        ? initialSerials.map((s) => ({ _id: Math.random().toString(36).slice(2), value: s }))
        : makeSerials(totalQuantity)
    );
  }, [isOpen]); // intentionally only re-run on isOpen change

  const handleSave = () => {
    const values = serials.map((s) => s.value.trim());
    if (values.some((v) => !v)) { toast.error("All serial numbers must be filled."); return; }
    const unique = new Set(values);
    if (unique.size !== values.length) { toast.error("Serial numbers must be unique."); return; }
    if (values.length !== Number(totalQuantity)) {
      toast.error(`Need exactly ${totalQuantity} serial numbers.`);
      return;
    }
    onSave(values);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Serial Numbers</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mx-6 mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-sm font-semibold text-gray-800">{skuName}</span>
            <span className="text-sm text-gray-500">{totalQuantity} serial numbers required</span>
          </div>

          <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
            {serials.map((s, idx) => (
              <div key={s._id} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6 text-right shrink-0">{idx + 1}</span>
                <input
                  value={s.value}
                  onChange={(e) =>
                    setSerials((prev) =>
                      prev.map((x) => (x._id === s._id ? { ...x, value: e.target.value } : x))
                    )
                  }
                  placeholder={`Serial number ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 px-6 pb-5">
            <button
              onClick={onClose}
              className="flex-1 max-w-[180px] px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 max-w-[180px] px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}