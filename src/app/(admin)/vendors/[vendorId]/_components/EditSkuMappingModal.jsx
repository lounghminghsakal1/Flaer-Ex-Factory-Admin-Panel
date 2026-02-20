"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { updateSkuMapping } from "./skuMappingApi";

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0
        ${value ? "bg-blue-600" : "bg-gray-300"}
        ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${value ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

const inputCls = (hasError) =>
  `h-9 px-3 text-[13px] rounded-md border outline-none w-full transition-all
  placeholder:text-gray-300 text-gray-800 bg-white
  ${hasError
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
    : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
  }`;

export default function EditSkuMappingModal({ vendorId, mapping, onClose, onSaved }) {
  const [form, setForm] = useState({
    vendor_sku_code: mapping.vendor_sku_code ?? "",
    vendor_unit_price: mapping.vendor_unit_price ?? "",
    active: mapping.active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const validate = () => {
    const e = {};
    if (!form.vendor_sku_code.trim()) e.vendor_sku_code = "SKU code is required";
    const price = parseFloat(form.vendor_unit_price);
    if (!form.vendor_unit_price) e.vendor_unit_price = "Unit price is required";
    else if (isNaN(price) || price <= 0) e.vendor_unit_price = "Price must be greater than 0";
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await updateSkuMapping(vendorId, mapping.id, {
        product_sku_id: mapping.product_sku.id,
        vendor_sku_code: form.vendor_sku_code.trim(),
        vendor_unit_price: parseFloat(form.vendor_unit_price),
        active: form.active,
      });
      toast.success("SKU mapping updated successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-blue-50 rounded-t-xl border-gray-100">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-800">Edit SKU Mapping</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{mapping.product_sku.sku_code}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* SKU Name (read-only) */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">SKU Name</label>
            <div className="h-9 px-3 flex items-center rounded-md bg-gray-50 border border-gray-100 text-[13px] text-gray-500 truncate">
              {mapping.product_sku.sku_name}
            </div>
          </div>

          {/* Vendor SKU Code */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">
              Vendor SKU Code <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls(errors.vendor_sku_code)}
              placeholder="e.g. SLS-PLY-6MM-8X4"
              value={form.vendor_sku_code}
              onChange={(e) => set("vendor_sku_code", e.target.value)}
            />
            {errors.vendor_sku_code && <p className="text-[11px] text-red-500">{errors.vendor_sku_code}</p>}
          </div>

          {/* Unit Price */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-gray-700">
              Unit Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls(errors.vendor_unit_price)}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 1450.00"
              value={form.vendor_unit_price}

              onChange={(e) => {
                const val = e.target.value;

                // allow only numbers + optional decimal with max 2 digits
                if (/^\d*\.?\d{0,2}$/.test(val)) {
                  set("vendor_unit_price", val);
                }
              }}

              // prevent scroll changing value
              onWheel={(e) => e.target.blur()}
            />
            {errors.vendor_unit_price && <p className="text-[11px] text-red-500">{errors.vendor_unit_price}</p>}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
            <div>
              <p className="text-[13px] font-medium text-gray-700">Active</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Enable or disable this SKU mapping</p>
            </div>
            <Toggle value={form.active} onChange={(v) => set("active", v)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
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
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer bg-green-600 text-white hover:bg-green-700 text-[13px]"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}