"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus, CheckCircle2, Trash2, AlertCircle, Pencil } from "lucide-react";
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

// ─── Batching Modal ─
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
    manufacture_date: null,
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
                          onWheel={(e) => e.target.blur()}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle" style={{ overflow: "visible" }}>
                        <DatePicker
                          disableFuture
                          value={b.manufacture_date}
                          onChange={(d) => updateBatch(b._id, "manufacture_date", d)}
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
              className="flex-1 max-w-[180px] px-6 py-2.5 border border-gray-300 cursor-pointer text-gray-700 text-sm font-semibold rounded-xl hover:scale-103 hover:bg-gray-100 transition-all"
            >
              Go Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 max-w-[180px] px-6 py-2.5 bg-green-600 cursor-pointer text-white text-sm font-semibold rounded-xl hover:scale-103 hover:opacity-90 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Serial Modal ──

export function SerialModal({
  isOpen,
  onClose,
  onSave,
  skuName,
  totalQuantity,
  initialSerials = [],
  grnId,
  skuId,
  viewOnly = false,
}) {
  const makeChip = (value = "") => ({
    _id: Math.random().toString(36).slice(2),
    value,
  });

  const [chips, setChips] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [inputError, setInputError] = useState("");
  // editingId: the chip currently being edited (its value is in inputValue)
  const [editingId, setEditingId] = useState(null);
  const inputRef = useRef(null);
  const [shouldFocus, setShouldFocus] = useState(false);

  // Init
  useEffect(() => {
    if (!isOpen) return;
    setChips(initialSerials.length ? initialSerials.map((s) => makeChip(s)) : []);
    setInputValue("");
    setEditingId(null);
    setInputError("");
  }, [isOpen]);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
      setShouldFocus(false);
    }
  }, [chips, shouldFocus]);

  useEffect(() => {
    if (isOpen && !viewOnly) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const total = Number(totalQuantity);
  const entered = chips.length;
  const remaining = total - entered;
  const isFull = remaining <= 0;

  const isDuplicate = (val, excludeId = null) =>
    chips.some((c) => c.value === val.trim() && c._id !== excludeId);

  // Verify via API
  const verifySerial = async (serialNumber) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grnId}/verify_grn_serial`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku_id: skuId, serial_number: serialNumber }),
      }
    );
    const data = await res.json();
    if (data.status !== "success") throw new Error(data?.errors?.[0] || "Verification failed.");
  };

  // Add or confirm edit
  const commitInput = async () => {
    const val = inputValue.trim();
    if (!val) return;
    setInputError("");

    if (isDuplicate(val, editingId)) {
      setInputError("This serial number already exists.");
      return;
    }

    // If editing and value unchanged, just cancel edit
    if (editingId) {
      const original = chips.find((c) => c._id === editingId);
      if (original?.value === val) {
        setEditingId(null);
        setInputValue("");
        return;
      }
    }

    // If adding new and box is full, block
    if (!editingId && isFull) return;

    setAdding(true);
    try {
      await verifySerial(val);

      if (editingId) {
        // Update existing chip
        setChips((prev) =>
          prev.map((c) => (c._id === editingId ? { ...c, value: val } : c))
        );
        setEditingId(null);
      } else {
        // Add new chip
        setChips((prev) => [...prev, makeChip(val)]);
      }

      setInputValue("");
      // inputRef.current?.focus();
      // setInputValue("");
      setShouldFocus(true);
    } catch (err) {
      const msg = err.message;
      setInputError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setInputError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitInput();
    }
    if (e.key === "Escape" && editingId) {
      setEditingId(null);
      setInputValue("");
      setInputError("");
    }
    // Backspace on empty input cancels edit mode (doesn't delete chip)
    if (e.key === "Backspace" && !inputValue && !editingId && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  };

  // Click chip to move it into the input for editing
  const startEdit = (chip) => {
    setEditingId(chip._id);
    setInputValue(chip.value);
    setInputError("");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 30);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setInputValue("");
    setInputError("");
    inputRef.current?.focus();
  };

  // Remove chip
  const removeChip = (id) => {
    if (editingId === id) {
      setEditingId(null);
      setInputValue("");
      setInputError("");
    }
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
    : isFull
      ? "All serials entered"
      : "Enter a serial number…";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Serial Numbers</h2>
              {viewOnly && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  View Only
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
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
            <span className="text-sm font-semibold text-gray-700">
              {viewOnly ? "Serials" : "Enter Serials"} ({entered})
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {entered} entered
              </span>
              <span className="text-gray-300">|</span>
              {remaining > 0 ? (
                <span className="text-amber-500">{remaining} remaining</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All done!
                </span>
              )}
            </div>
          </div>

          <div className="px-6 pb-2 flex-1 min-h-0 flex flex-col gap-3">

            {/* ── Input box (top) ── */}
            {!viewOnly && (
              <div className="shrink-0">
                {/* Edit mode banner */}
                {editingId && (
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Editing serial
                    </span>
                    <button
                      onClick={cancelEdit}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div
                  className={`w-64 mx-auto flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors
                    ${editingId
                      ? "border-blue-400 ring-2 ring-blue-100 bg-white"
                      : isFull && !editingId
                        ? "border-gray-100 bg-gray-50"
                        : "border-gray-200 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
                    }
                  `}
                >
                  <input
                    ref={inputRef}
                    className="w-56 border-none outline-none bg-transparent text-sm text-gray-800 placeholder-gray-300 font-mono"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={inputPlaceholder}
                    disabled={adding || (isFull && !editingId)}
                  />

                  {/* Verifying spinner or Add button */}
                  {adding ? (
                    <span className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin shrink-0" />
                  ) : (
                    <button
                      onClick={commitInput}
                      disabled={!inputValue.trim() || (isFull && !editingId)}
                      className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold transition-all
                        ${inputValue.trim() && (!isFull || editingId)
                          ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      {editingId ? "Update" : "Add"}
                    </button>
                  )}
                </div>

                {/* Error */}
                {inputError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-500">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {inputError}
                  </div>
                )}

                {/* Hints */}
                {!isFull && !inputError && !editingId && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                    <span>
                      <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Enter</kbd>
                      {" "}to add
                    </span>
                    <span>·</span>
                    <span>
                      <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">⌫</kbd>
                      {" "}remove last
                    </span>
                    <span>·</span>
                    <span>Click a serial to edit</span>
                  </div>
                )}
                {editingId && !inputError && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                    <span>
                      <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Enter</kbd>
                      {" "}to update
                    </span>
                    <span>·</span>
                    <span>
                      <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Esc</kbd>
                      {" "}to cancel
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Chips display box (bottom) ── */}
            <div
              className={`min-h-[110px] max-h-[220px] overflow-y-auto border rounded-xl p-2 flex flex-wrap gap-1.5 content-start
                ${viewOnly ? "bg-gray-50 border-gray-100" : "bg-gray-50 border-gray-100"}
              `}
            >
              {chips.map((chip, idx) => {
                const isBeingEdited = editingId === chip._id;
                return (
                  <div
                    key={chip._id}
                    className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md border text-xs font-medium max-w-[220px] transition-all
                      ${isBeingEdited
                        ? "bg-blue-100 border-blue-400 text-blue-700 ring-1 ring-blue-300"
                        : viewOnly
                          ? "bg-blue-50 border-blue-200 text-blue-700 cursor-default"
                          : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 cursor-pointer"
                      }
                    `}
                    onClick={() => !viewOnly && !isBeingEdited && startEdit(chip)}
                    title={viewOnly ? undefined : isBeingEdited ? "Currently editing" : "Click to edit"}
                  >
                    {/* Index badge */}
                    <span className="text-[10px] font-bold text-gray-800 bg-gray-100 rounded px-1.5 shrink-0 font-mono">
                      #{idx + 1}
                    </span>

                    <span className="truncate max-w-[140px] font-mono">{chip.value}</span>

                    {/* Editing indicator */}
                    {isBeingEdited && (
                      <Pencil className="w-3 h-3 text-blue-400 shrink-0" />
                    )}

                    {/* Remove button */}
                    {!viewOnly && (
                      <button
                        className="w-4 h-4 flex items-center justify-center rounded text-blue-300 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                        onClick={(e) => { e.stopPropagation(); removeChip(chip._id); }}
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* All full message */}
              {!viewOnly && isFull && (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  All {total} serial numbers entered
                </div>
              )}

              {/* Empty state */}
              {chips.length === 0 && (
                <div className="w-full flex items-center justify-center py-4 text-xs text-gray-400">
                  {viewOnly ? "No serial numbers recorded." : "Added serials will appear here…"}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center items-center gap-3 px-6 pb-5 pt-3 border-t border-gray-100 mt-2 shrink-0">
            <button
              onClick={onClose}
              className="max-w-[160px] px-3 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 hover:scale-103 transition-all cursor-pointer"
            >
              {viewOnly ? "Close" : "Go Back"}
            </button>

            {!viewOnly && (
              <button
                onClick={handleSave}
                disabled={entered !== total || !!editingId}
                className={`px-3 py-2.5 text-sm font-semibold rounded-xl hover:scale-103 transition-all flex items-center justify-center gap-2
                  ${entered === total && !editingId
                    ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {entered === total && !editingId && <CheckCircle2 className="w-4 h-4" />}
                {editingId
                  ? "Finish editing first"
                  : entered === total
                    ? "Save Serials"
                    : `Save (${entered} / ${total})`
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}