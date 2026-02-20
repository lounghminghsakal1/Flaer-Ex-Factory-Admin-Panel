"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import SkuDropdown from "./SkuDropdown";
import { createSkuMappings, getAllProductSkus } from "./skuMappingApi";

// ─── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer
        ${value ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
          ${value ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

// ─── Input class helper ────────────────────────────────────────────────────
const inputCls = (hasError) =>
  `h-9 px-3 text-[13px] rounded-md border outline-none w-full transition-all
  placeholder:text-gray-300 text-gray-800 bg-white
  ${hasError
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
    : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
  }`;

// ─── Empty row factory ─────────────────────────────────────────────────────
const emptyRow = () => ({
  _id: Math.random().toString(36).slice(2),
  product_sku_id: null,
  vendor_sku_code: "",
  vendor_unit_price: "",
  active: true,
  errors: {},
});

// ─── Main Modal ────────────────────────────────────────────────────────────
export default function MapSkuModal({ vendorId, onClose, onSaved }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [allSkus, setAllSkus] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all product SKUs for dropdown — preserved from original
  useEffect(() => {
    getAllProductSkus(vendorId)
      .then(setAllSkus)
      .catch(() => toast.error("Failed to load product SKUs"))
      .finally(() => setLoadingSkus(false));
  }, []);

  // Close on Escape — preserved from original
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Transform allSkus into the shape SkuDropdown expects: { id, name, subLabel? }
  // Handles both id/name and _id/sku_name shapes from the API
  const skuOptions = allSkus.map((s) => ({
    id: s.id ?? s._id,
    name: s.name ?? s.sku_name,
    subLabel: s.code ?? s.sku_code ?? undefined,
  }));

  // All already-selected SKU IDs (to exclude from sibling rows)
  const selectedSkuIds = rows.map((r) => r.product_sku_id).filter(Boolean);

  const updateRow = (id, field, value) =>
    setRows((prev) =>
      prev.map((r) =>
        r._id === id
          ? { ...r, [field]: value, errors: { ...r.errors, [field]: "" } }
          : r
      )
    );

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (id) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r._id !== id));
  };

  const validateRows = () => {
    let valid = true;
    const updated = rows.map((r) => {
      const e = {};
      if (!r.product_sku_id) { e.product_sku_id = "SKU is required"; valid = false; }
      if (!r.vendor_sku_code.trim()) { e.vendor_sku_code = "Code is required"; valid = false; }
      if (!r.vendor_unit_price) { e.vendor_unit_price = "Price is required"; valid = false; }
      else {
        const price = parseFloat(r.vendor_unit_price);
        if (isNaN(price) || price <= 0) { e.vendor_unit_price = "Must be > 0"; valid = false; }
      }
      return { ...r, errors: e };
    });
    setRows(updated);
    return valid;
  };

  // Save handler — calls createSkuMappings, preserved from original
  const handleSave = async () => {
    if (!validateRows()) {
      toast.error("Please fix the errors in each row.");
      return;
    }
    setSaving(true);
    try {
      const mappings = rows.map((r) => ({
        product_sku_id: r.product_sku_id,
        vendor_sku_code: r.vendor_sku_code.trim(),
        vendor_unit_price: parseFloat(r.vendor_unit_price),
        active: r.active,
      }));
      await createSkuMappings(vendorId, mappings);
      toast.success(
        `${mappings.length} SKU mapping${mappings.length > 1 ? "s" : ""} added successfully!`
      );
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to map SKUs. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal — max-w-4xl for wider SKU name column */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50 rounded-t-xl border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-800">Map SKU to Vendor</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Add one or more SKU mappings for this vendor
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body — overflow-y-auto is fine; dropdown escapes via portal */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingSkus ? (
            <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Loading SKUs…</span>
            </div>
          ) : (
            <>
              {/* Column Headers */}
              <div className="grid grid-cols-[minmax(180px,2.5fr)_1.4fr_1fr_auto_auto] gap-3 mb-2 px-1">
                <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">SKU Name</p>
                <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Vendor SKU Code</p>
                <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Unit Price (₹)</p>
                <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Active</p>
                <p className="w-8" />
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <div key={row._id} className="flex flex-col gap-0.5">
                    <div className="grid grid-cols-[minmax(180px,2.5fr)_1.4fr_1fr_auto_auto] gap-3 items-start">

                      {/* SKU Dropdown — portal-rendered, never clips behind modal */}
                      <div className="flex flex-col gap-0.5">
                        <SkuDropdown
                          value={row.product_sku_id}
                          onChange={(id) => updateRow(row._id, "product_sku_id", id)}
                          options={skuOptions}
                          excludeIds={selectedSkuIds.filter((id) => id !== row.product_sku_id)}
                          placeholder="Search & select SKU"
                          searchPlaceholder="Search SKU name or code…"
                          hasError={!!row.errors.product_sku_id}
                        />
                        {row.errors.product_sku_id && (
                          <p className="text-[10.5px] text-red-500">{row.errors.product_sku_id}</p>
                        )}
                      </div>

                      {/* Vendor SKU Code */}
                      <div className="flex flex-col gap-0.5">
                        <input
                          className={inputCls(row.errors.vendor_sku_code)}
                          placeholder="e.g. SLS-PLY-6MM"
                          value={row.vendor_sku_code}
                          onChange={(e) => updateRow(row._id, "vendor_sku_code", e.target.value)}
                        />
                        {row.errors.vendor_sku_code && (
                          <p className="text-[10.5px] text-red-500">{row.errors.vendor_sku_code}</p>
                        )}
                      </div>

                      {/* Unit Price */}
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={row.vendor_unit_price}
                          onChange={(e) => {
                            const val = e.target.value;

                            // allow only numbers + decimal
                            if (/^\d*\.?\d{0,2}$/.test(val)) {
                              updateRow(row._id, "vendor_unit_price", val);
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          className={inputCls(row.errors.vendor_unit_price)}
                        />
                        {row.errors.vendor_unit_price && (
                          <p className="text-[10.5px] text-red-500">{row.errors.vendor_unit_price}</p>
                        )}
                      </div>

                      {/* Active Toggle */}
                      <div className="h-9 flex items-center justify-center px-1">
                        <Toggle value={row.active} onChange={(v) => updateRow(row._id, "active", v)} />
                      </div>

                      {/* Remove Row */}
                      <div className="h-9 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row._id)}
                          disabled={rows.length === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Row */}
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-[12.5px] text-gray-500 hover:border-secondary hover:text-primary hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2} />
                  Add another row
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
          <p className="text-[12px] text-gray-400">
            {rows.length} row{rows.length > 1 ? "s" : ""} to be mapped
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition hover:scale-105 cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-[13px]"
            >
              <X size={14} strokeWidth={2} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingSkus}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer bg-green-600 text-white hover:bg-green-700 text-[13px]"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
              {saving ? "Saving…" : "Map SKU"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}