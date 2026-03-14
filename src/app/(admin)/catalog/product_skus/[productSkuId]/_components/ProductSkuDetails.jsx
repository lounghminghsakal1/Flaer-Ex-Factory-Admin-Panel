"use client";
import { useState, useEffect } from "react";
import {
  Upload, Trash2, Plus, X, ImageIcon,
  Package, Tag, DollarSign, Info,
  Hash, CheckCircle2, Circle, XCircle, BarChart3,
} from "lucide-react";
import { toast } from "react-toastify";
import SearchableDropdown from "../../../../../../../components/shared/SearchableDropdown";
import { useConfirm } from "../../../../../../../components/hooks/context/ConfirmContext";
import HeaderWithBackAction from "../../../../../../../components/shared/HeaderWithBackAction";
import { useConfirmModal } from "../../../../../../../components/shared/ConfirmModal";

export default function ProductSkuDetailsPage({ productSkuId }) {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [skuData, setSkuData] = useState(null);
  const [pricingMode, setPricingMode] = useState("conversion");
  const [optionTypes, setOptionTypes] = useState([]);

  const [form, setForm] = useState({
    sku_name: "", display_name: "", sku_code: "",
    dimension: "", weight: "", unit_price: "", mrp: "",
    selling_price: "", uom: "piece", status: "active",
    conversion_factor: "", multiplication_factor: "", threshold_quantity: "",
  });

  const [options, setOptions] = useState([]);
  const [skuMedia, setSkuMedia] = useState([]);

  const confirm = useConfirm();
  const { confirmModal, askConfirm } = useConfirmModal();

  const UOM_OPTIONS = [
    { id: "sq_ft", name: "Sq ft" }, 
    { id: "ml", name: "Ml" },
    { id: "l", name: "L" }, 
    { id: "gm", name: "Gm" },
    { id: "kg", name: "Kg" }, 
    { id: "mm", name: "Mm" },
    { id: "packet", name: "Packet" }, 
    { id: "unit", name: "Unit" },
    { id: "piece", name: "Piece" }, 
    {id: "m", name: "Metere"}
  ];

  const STATUS_CONFIG = {
    active: {
      label: "Active",
      card: "border-emerald-500 bg-emerald-50 text-emerald-700",
      accent: "accent-green-600"
    },
    inactive: {
      label: "Inactive",
      card: "border-gray-500 bg-gray-50 text-gray-700",
      accent: "accent-gray-600"
    },
    deleted: {
      label: "Deleted",
      card: "border-red-500 bg-red-50 text-red-600",
      accent: "accent-red-600"
    }
  };

  useEffect(() => { fetchProductSkuData(); fetchOptionTypes(); }, [productSkuId]);

  const fetchProductSkuData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus/${productSkuId}`);
      const result = await res.json();
      if (!res.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      const data = result?.data;
      setSkuData(data);
      setForm({
        sku_name: data.sku_name || "", display_name: data.display_name || "",
        sku_code: data.sku_code || "", dimension: data.dimension || "",
        weight: data.weight || "", unit_price: data.unit_price || "",
        mrp: data.mrp || "", selling_price: data.selling_price || "",
        uom: data.uom || "piece", status: data.status || "active",
        conversion_factor: data.conversion_factor || "",
        multiplication_factor: data.multiplication_factor || "",
        threshold_quantity: data.threshold_quantity || "",
      });
      setPricingMode(data.multiplication_factor && !data.conversion_factor ? "multiplication" : "conversion");
      setOptions(data.option_type_values?.length > 0
        ? data.option_type_values.map((opt) => ({
          option_type_id: opt.option_type.id, value_id: opt.option_value.id,
          original_value_id: opt.option_value.id, type: opt.option_type.name,
          value: opt.option_value.name, isExisting: true,
        })) : []);
      setSkuMedia(data.sku_media?.length > 0 ? data.sku_media : []);
    } catch (err) {
      toast.error("Failed to fetch product sku data " + err.message);
    } finally { setLoading(false); }
  };

  async function fetchOptionTypes() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/option_types?only_names=true`);
      const result = await res.json();
      if (!res.ok || result.status === "failure") throw new Error(result.errors[0] ?? "Something went wrong");
      setOptionTypes(result.data || []);
    } catch (err) { console.error(err); }
  }

  function updateForm(next) { setForm((prev) => ({ ...prev, ...next })); }

  function handleMrpChange(value) {
    const cf = Number(form.conversion_factor) || 1;
    const unitPrice = value ? Number((Number(value) / cf).toFixed(2)) : "";
    updateForm({ mrp: value, unit_price: unitPrice, selling_price: value });
  }
  function handleUnitPriceChange(value) {
    const mf = Number(form.multiplication_factor) || 1;
    const calc = value ? Number((Number(value) * mf).toFixed(2)) : "";
    updateForm({ unit_price: value, mrp: calc, selling_price: calc });
  }
  function handleConversionFactorChange(value) {
    updateForm({ conversion_factor: value });
    if (pricingMode === "conversion" && form.mrp)
      updateForm({ unit_price: Number((Number(form.mrp) / (Number(value) || 1)).toFixed(2)) });
  }
  function handleMultiplicationFactorChange(value) {
    updateForm({ multiplication_factor: value });
    if (pricingMode === "multiplication" && form.unit_price) {
      const calc = Number((Number(form.unit_price) * (Number(value) || 1)).toFixed(2));
      updateForm({ mrp: calc, selling_price: calc });
    }
  }

  function addOptionRow() { setOptions((prev) => [...prev, { type: "", value: "", isExisting: false }]); }
  async function deleteOptionRow(index) {
    const opt = options[index];
    if (opt.isExisting && opt.type && opt.value) {
      const ok = await confirm(`Remove "${opt.type}: ${opt.value}"?`);
      if (!ok) return;
    }
    setOptions(options.filter((_, i) => i !== index));
  }
  function updateOptionType(index, type) { const u = [...options]; u[index].type = type; setOptions(u); }
  function updateOptionValue(index, value) {
    const u = [...options]; u[index].value = value;
    if (u[index].isExisting) { u[index].isValueChanged = true; delete u[index].value_id; }
    setOptions(u);
  }
  function getSelectedTypes(ci) { return options.map((o, i) => (i !== ci ? o.type : null)).filter(Boolean); }
  function handleCancelEdit() { setIsEditing(false); fetchProductSkuData(); }

  async function handleUpdate() {
    if (!form.sku_name.trim()) return toast.error("SKU name is required");
    if (!form.display_name.trim()) return toast.error("Display name is required");
    if (!form.sku_code.trim()) return toast.error("SKU code is required");
    if (Number(form.selling_price) > Number(form.mrp)) return toast.error("Selling price cannot exceed MRP");
    if (pricingMode === "conversion") {
      if (Math.abs(Number(form.unit_price) - Number(form.mrp) / Number(form.conversion_factor)) > 0.01)
        return toast.error("MRP and unit price don't match conversion factor");
    } else {
      if (Math.abs(Number(form.mrp) - Number(form.unit_price) * Number(form.multiplication_factor)) > 0.01)
        return toast.error("MRP and unit price don't match multiplication factor");
    }
    setUpdating(true);
    try {
      const option_type_values = options.filter((o) => o.type && o.value).map((o) => {
        if (o.isExisting && !o.isValueChanged) return { option_type_id: o.option_type_id, value_id: o.original_value_id };
        if (o.isExisting && o.isValueChanged) return { option_type_id: o.option_type_id, option_value: o.value };
        return { option_type: o.type, option_value: o.value };
      });
      const sku_media = skuMedia.map((m) => m.isNew
        ? { media_url: m.media_url, media_type: m.media_type || "image", active: m.active ?? true, sequence: m.sequence }
        : { id: m.id, media_url: m.media_url, media_type: m.media_type, active: m.active, sequence: m.sequence });
      const payload = {
        product_sku: {
          sku_name: form.sku_name.trim(), display_name: form.display_name.trim(),
          sku_code: form.sku_code.trim(), dimension: form.dimension.trim(),
          weight: form.weight, unit_price: Number(form.unit_price),
          mrp: Number(form.mrp), selling_price: Number(form.selling_price),
          uom: form.uom, status: form.status, threshold_quantity: Number(form.threshold_quantity) || 1,
        },
      };
      if (pricingMode === "conversion") {
        payload.product_sku.conversion_factor = Number(form.conversion_factor) || 1;
        payload.product_sku.multiplication_factor = null;
      } else {
        payload.product_sku.multiplication_factor = Number(form.multiplication_factor) || 1;
        payload.product_sku.conversion_factor = null;
      }
      if (option_type_values.length > 0) payload.product_sku.option_type_values = option_type_values;
      if (sku_media.length > 0) payload.product_sku.sku_media = sku_media;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus/${productSkuId}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) {
        let msg = "Failed to update SKU";
        if (Array.isArray(result?.errors)) msg = result.errors.join(", ");
        else if (typeof result?.errors === "object") msg = Object.values(result.errors).flat().join(", ");
        else if (result?.message) msg = result.message;
        return toast.error(msg);
      }
      toast.success("SKU updated successfully");
      setIsEditing(false);
      fetchProductSkuData();
    } catch (err) { toast.error(err.message); } finally { setUpdating(false); }
  }

  const field = isEditing
    ? "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none  focus:ring-blue-500/20 focus:border-blue-500 transition-all"
    : "w-full px-3 py-2 text-sm border border-transparent rounded-lg bg-gray-50 text-gray-700";
  const autoField = isEditing
    ? "w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-blue-50/60 text-primary focus:outline-none  focus:ring-blue-500/20 focus:border-blue-400 transition-all"
    : field;
  const lbl = "block text-xs font-medium text-gray-500 mb-1.5";
  const req = <span className="text-red-400 ml-0.5">*</span>;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
        <span className="text-sm text-gray-400">Loading SKU…</span>
      </div>
    </div>
  );

  if (!skuData) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">SKU not found.</p>
    </div>
  );

  const statusCfg = STATUS_CONFIG[form.status] ?? STATUS_CONFIG.active;

  return (
    <>
      {confirmModal}
      <div className="min-h-screen bg-gray-50/40">

        {/*  Header  */}
        <HeaderWithBackAction
          title="Product SKU Details"
          isEditing={isEditing}
          loading={updating}
          onActionClick={isEditing ? handleUpdate : () => setIsEditing(true)}
          defaultBackPath="/catalog/product_skus"
        />

        {/*  Page body  */}
        <div className="px-6 py-6">
          <div className="flex gap-6 items-start">

            {/*  MAIN CONTENT  */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Basic Information */}
              <Section title="Basic Information" icon={<Hash size={13} />}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>SKU Name{req}</label>
                    <input className={field} value={form.sku_name} disabled={!isEditing}
                      onChange={(e) => updateForm({ sku_name: e.target.value })} placeholder="Enter SKU name" />
                  </div>
                  <div>
                    <label className={lbl}>Display Name{req}</label>
                    <input className={field} value={form.display_name} disabled={!isEditing}
                      onChange={(e) => updateForm({ display_name: e.target.value })} placeholder="Enter display name" />
                  </div>
                  <div>
                    <label className={lbl}>SKU Code{req}</label>
                    <input className={`${field} font-mono`} value={form.sku_code} disabled={!isEditing}
                      onChange={(e) => updateForm({ sku_code: e.target.value })} placeholder="e.g. SKU-001" />
                  </div>
                  <div>
                    <label className={lbl}>Dimension</label>
                    <input className={field} value={form.dimension} disabled={!isEditing}
                      onChange={(e) => updateForm({ dimension: e.target.value })} placeholder="e.g. 10×20×5 cm" />
                  </div>
                  <div>
                    <label className={lbl}>Weight</label>
                    <input className={field} type="number" min="0" value={form.weight} disabled={!isEditing}
                      onChange={(e) => updateForm({ weight: e.target.value })} placeholder="Enter weight"
                      onWheel={(e) => e.target.blur()} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-1.5">
                      Status <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-3">
                      {["active", "inactive", "deleted"].map((val) => {
                        const cfg = STATUS_CONFIG[val];
                        const selected = form.status === val;

                        return (
                          <label
                            key={val}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer
            ${selected ? cfg.card : "border-gray-200 bg-white hover:border-gray-300"}
            ${!isEditing ? "opacity-60 cursor-default" : ""}
          `}
                          >
                            <input
                              type="radio"
                              name="status"
                              value={val}
                              checked={selected}
                              disabled={!isEditing}
                              onChange={() => updateForm({ status: val })}
                              className={`w-4 h-4 focus:ring-0 focus:outline-none ${cfg.accent}`}
                            />

                            <span className="text-sm font-medium">
                              {cfg.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </Section>

              {/* Pricing */}
              <Section title="Pricing" icon={<DollarSign size={13} />}>
                {/* Toggle */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-5 w-fit">
                  {["conversion", "multiplication"].map((mode) => (
                    <button key={mode} type="button" disabled={!isEditing}
                      onClick={() => isEditing && setPricingMode(mode)}
                      className={`py-1.5 px-4 rounded-md text-xs font-medium transition-all whitespace-nowrap
                        ${pricingMode === mode ? "bg-primary text-gray-100 shadow-sm" : "text-gray-500"}
                        ${!isEditing ? "cursor-default" : "cursor-pointer"}`}>
                      {mode === "conversion" ? "MRP → Unit Price" : "Unit Price → MRP"}
                    </button>
                  ))}
                </div>

                {/* Price inputs */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {pricingMode === "conversion" ? (<>
                    <div>
                      <label className={lbl}>MRP{req}</label>
                      <CurrencyInput className={field} value={form.mrp} disabled={!isEditing} onChange={(e) => handleMrpChange(e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>Unit Price <AutoBadge /></label>
                      <CurrencyInput className={autoField} value={form.unit_price} disabled={!isEditing} onChange={(e) => updateForm({ unit_price: e.target.value })} />
                    </div>
                    <div>
                      <label className={lbl}>Selling Price <AutoBadge /></label>
                      <CurrencyInput className={autoField} value={form.selling_price} disabled={!isEditing} onChange={(e) => updateForm({ selling_price: e.target.value })} />
                    </div>
                  </>) : (<>
                    <div>
                      <label className={lbl}>Unit Price{req}</label>
                      <CurrencyInput className={field} value={form.unit_price} disabled={!isEditing} onChange={(e) => handleUnitPriceChange(e.target.value)} />
                    </div>
                    <div>
                      <label className={lbl}>MRP <AutoBadge /></label>
                      <CurrencyInput className={autoField} value={form.mrp} disabled={!isEditing} onChange={(e) => updateForm({ mrp: e.target.value })} />
                    </div>
                    <div>
                      <label className={lbl}>Selling Price <AutoBadge /></label>
                      <CurrencyInput className={autoField} value={form.selling_price} disabled={!isEditing} onChange={(e) => updateForm({ selling_price: e.target.value })} />
                    </div>
                  </>)}
                </div>

                {/* Secondary row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  {pricingMode === "conversion" ? (
                    <div>
                      <label className={lbl}>Conversion Factor</label>
                      <input type="number" min="1" step="any" className={field} disabled={!isEditing}
                        value={form.conversion_factor} onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleConversionFactorChange(e.target.value)} />
                    </div>
                  ) : (
                    <div>
                      <label className={lbl}>Multiplication Factor</label>
                      <input type="number" min="1" step="any" className={field} disabled={!isEditing}
                        value={form.multiplication_factor} onWheel={(e) => e.target.blur()}
                        onChange={(e) => handleMultiplicationFactorChange(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Threshold Qty</label>
                    <input type="number" min="1" step="any" className={field} disabled={!isEditing}
                      value={form.threshold_quantity} onWheel={(e) => e.target.blur()}
                      onChange={(e) => updateForm({ threshold_quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className={lbl}>Unit of Measure</label>
                    <select className={field} value={form.uom} disabled={!isEditing}
                      onChange={(e) => updateForm({ uom: e.target.value })}>
                      {UOM_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                    <Info size={13} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-primary">
                      {pricingMode === "conversion"
                        ? "Unit Price = MRP ÷ Conversion Factor. Selling Price defaults to MRP."
                        : "MRP = Unit Price × Multiplication Factor. Selling Price follows MRP."}
                    </p>
                  </div>
                )}
              </Section>

              {/* Option Values */}
              <OptionValuesSection
                options={options}
                isEditing={isEditing}
                optionTypes={optionTypes}
                setOptionTypes={setOptionTypes}
                getSelectedTypes={getSelectedTypes}
                updateOptionType={updateOptionType}
                updateOptionValue={updateOptionValue}
                deleteOptionRow={deleteOptionRow}
                addOptionRow={addOptionRow}
              />

              {/* Media */}
              <SkuMediaSection skuMedia={skuMedia} setSkuMedia={setSkuMedia} isEditing={isEditing} askConfirm={askConfirm} />

            </div>

            {/*  SIDEBAR  */}
            <div className="w-68 shrink-0 space-y-4" style={{ width: "272px" }}>

              {/* SKU Details */}
              <aside className="bg-white rounded-xl border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <Info size={12} className="text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">SKU Details</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  <MetaRow label="SKU ID" value={`#${skuData.id}`} mono />
                  <MetaRow label="SKU Code" value={skuData.sku_code} mono />
                  <MetaRow label="Master SKU" value={skuData.master ? "Yes" : "No"} accent={skuData.master} />
                  <MetaRow label="Bundle SKU" value={skuData.is_bundle_sku ? "Yes" : "No"} />
                  <MetaRow label="Bundle Factor" value={skuData.bundle_factor ?? "—"} />
                  <MetaRow label="UOM" value={skuData.uom ?? "—"} />
                  <MetaRow label="Threshold Qty" value={skuData.threshold_quantity ?? "—"} />
                  <MetaRow label="Additional Info" value={skuData.additional_info ?? "—"} />
                </div>
              </aside>

              {/* Price Snapshot —> read mode only */}
              {!isEditing && skuData.mrp && (
                <aside className="bg-white rounded-xl border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={12} className="text-gray-400" />
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price Snapshot</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-gray-500">MRP</span>
                      <span className="text-base font-bold text-gray-900 tabular-nums">
                        ₹{Number(skuData.mrp).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Selling Price</span>
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        ₹{Number(skuData.selling_price).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Unit Price</span>
                      <span className="text-sm font-medium text-gray-700 tabular-nums">
                        ₹{Number(skuData.unit_price).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {skuData.mrp && skuData.selling_price && skuData.mrp !== skuData.selling_price && (
                      <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Discount</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {Math.round(((skuData.mrp - skuData.selling_price) / skuData.mrp) * 100)}% off
                        </span>
                      </div>
                    )}
                  </div>
                </aside>
              )}

            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* Reusable Section card  */
function Section({ title, icon, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/*  Currency input  */
function CurrencyInput({ className, value, disabled, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none pointer-events-none">₹</span>
      <input type="number" min="0" step="any"
        className={`${className} pl-7`}
        value={value} disabled={disabled} onChange={onChange}
        placeholder="0.00" onWheel={(e) => e.target.blur()} />
    </div>
  );
}

/*  Auto-calculated badge  */
function AutoBadge() {
  return (
    <span className="ml-1 text-[10px] font-medium text-primary bg-blue-50 border border-blue-100 px-1.5 py-px rounded">
      auto
    </span>
  );
}

/*  Sidebar metadata row  */
function MetaRow({ label, value, mono, accent }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs font-medium max-w-[55%] text-right truncate ml-2
        ${accent ? "text-primary" : "text-gray-800"}
        ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

/*  OPTION VALUES SECTION  */
function OptionValuesSection({
  options, isEditing, optionTypes, setOptionTypes,
  getSelectedTypes, updateOptionType, updateOptionValue,
  deleteOptionRow, addOptionRow,
}) {
  const hasOptions = options.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Card header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
        <Tag size={13} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">Option Values</h3>
      </div>

      <div className="p-5">
        {/* Empty view mode */}
        {!isEditing && !hasOptions && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-300">
            <Tag size={22} strokeWidth={1.5} className="mb-2" />
            <p className="text-sm text-gray-400">No option values added</p>
          </div>
        )}

        {(hasOptions || isEditing) && (
          <table className="w-full border border-gray-200 rounded-md border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 rounded-tl-xl w-[35%]">
                  Option Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-l border-gray-200">
                  Value
                </th>
                {isEditing && (
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-l border-gray-200 rounded-tr-xl w-[44px]">
                    Del
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {options.map((opt, i) => (
                <tr key={i} className="group border-b border-gray-100 last:border-b-0">
                  {/* Option Type */}
                  <td className="px-4 py-2.5 align-middle border-b border-gray-100 last:border-b-0">
                    {isEditing && !opt.isExisting ? (
                      <SearchableDropdown
                        options={optionTypes
                          .filter((o) => !getSelectedTypes(i).includes(o.name))
                          .map((o) => ({ id: o.name, name: o.name }))}
                        value={opt.type}
                        creatable
                        onChange={(t) => updateOptionType(i, t)}
                        placeholder="Search or type..."
                        emptyMessage="No option types"
                        onCreateOption={(v) => setOptionTypes((p) => [...p, { name: v }])}
                      />
                    ) : (
                      <span className="font-medium text-gray-700">{opt.type || "—"}</span>
                    )}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-2.5 align-middle border-l border-b border-gray-100 last:border-b-0">
                    {isEditing ? (
                      <input
                        value={opt.value || ""}
                        onChange={(e) => updateOptionValue(i, e.target.value)}
                        placeholder="Enter value"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none  focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    ) : (
                      <span className="text-gray-600">{opt.value || "—"}</span>
                    )}
                  </td>

                  {/* Delete */}
                  {isEditing && (
                    <td className="px-3 py-2.5 align-middle text-center border-l border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => deleteOptionRow(i)}
                        className="p-1.5 text-red-300 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {isEditing && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-2.5 bg-gray-50/50 rounded-b-xl"
                  >
                    <button
                      onClick={addOptionRow}
                      className="flex items-center justify-center rounded-full border p-2 border-primary mx-auto gap-1.5 cursor-pointer text-xs font-medium text-primary hover:bg-primary hover:text-gray-100 transition"
                    >
                      <Plus size={20} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/*  MEDIA SECTION  */
function SkuMediaSection({ skuMedia, setSkuMedia, isEditing, askConfirm }) {
  const [uploading, setUploading] = useState(false);
  const [mediaPopup, setMediaPopup] = useState(false);

  const handleMediaUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file); fd.append("media_for", "product sku");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/upload_media`, { method: "POST", body: fd });
        const result = await res.json();
        if (!res.ok || result.status === "failure") throw new Error(result.errors[0] ?? "Something went wrong");
        uploadedUrls.push(result.data.media_url);
      }
      const maxSeq = skuMedia.length > 0 ? Math.max(...skuMedia.map((m) => m.sequence)) : 0;
      const newMedia = uploadedUrls.map((url, idx) => ({
        id: Date.now() + idx, media_url: url, media_type: "image",
        active: true, sequence: maxSeq + idx + 1, isNew: true,
      }));
      if (skuMedia.length === 0 && newMedia.length > 0) newMedia[0].sequence = 1;
      setSkuMedia((prev) => [...prev, ...newMedia]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err) { toast.error("Upload failed: " + err.message); } finally { setUploading(false); }
  };

  const setPrimary = (id) => {
    setSkuMedia((prev) => {
      const sel = prev.find((m) => m.id === id);
      if (!sel || sel.sequence === 1) return prev;
      return prev.map((m) => {
        if (m.id === id) return { ...m, sequence: 1 };
        if (m.sequence === 1) return { ...m, sequence: sel.sequence };
        return m;
      });
    });
    setMediaPopup(false);
  };

  const removeMedia = async (id) => {
    const target = skuMedia.find((m) => m.id === id);
    if (target?.sequence === 1) return toast.error("Cannot remove the primary image");
    const ok = await askConfirm({ title: "Remove Image", message: "Remove this image? This cannot be undone.", confirmLabel: "Remove", cancelLabel: "Cancel", variant: "danger" });
    if (!ok) return;
    setSkuMedia((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      const primary = filtered.find((m) => m.sequence === 1);
      const others = filtered.filter((m) => m.sequence !== 1).sort((a, b) => a.sequence - b.sequence);
      return [primary, ...others.map((m, idx) => ({ ...m, sequence: idx + 2 }))].filter(Boolean);
    });
  };

  const sorted = [...skuMedia].sort((a, b) => a.sequence - b.sequence);
  const primary = sorted.find((m) => m.sequence === 1);
  const rest = sorted.filter((m) => m.sequence !== 1);
  const showViewAll = sorted.length > 4;
  const visibleRest = rest.slice(0, showViewAll ? 3 : rest.length);

  return (
    <>
      <Section
        title={`Media${skuMedia.length > 0 ? ` (${skuMedia.length})` : ""}`}
        icon={<ImageIcon size={13} />}
      >
        {skuMedia.length === 0 && !isEditing && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <ImageIcon size={32} strokeWidth={1.5} className="mb-2" />
            <p className="text-sm text-gray-400">No media uploaded yet</p>
          </div>
        )}
        {skuMedia.length === 0 && isEditing && (
          <label className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all group">
            <Upload size={24} strokeWidth={1.5} className="text-gray-300 group-hover:text-primary mb-2 transition-colors" />
            <p className="text-sm text-gray-400 group-hover:text-primary transition-colors">
              {uploading ? "Uploading…" : "Click or drag to upload images"}
            </p>
            <p className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP supported</p>
            <input type="file" multiple accept="image/*" className="hidden" disabled={uploading}
              onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) handleMediaUpload(f); e.target.value = ""; }} />
          </label>
        )}
        {skuMedia.length > 0 && (
          <div className="flex items-start gap-3 flex-wrap">
            {/* Primary img */}
            {primary && (
              <div className="relative w-48 h-48 shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 group">
                <img src={primary.media_url} className="w-full h-full object-cover" alt="Primary" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
                  <span className="text-[10px] font-bold text-white tracking-wide uppercase bg-blue-500 px-2 py-0.5 rounded-full">Primary</span>
                </div>
              </div>
            )}
            {/* Rest */}
            {visibleRest.map((m) => (
              <div key={m.id} className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                <img src={m.media_url} className="w-full h-full object-cover" alt="SKU media" />
                <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{m.sequence}</span>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-1.5 p-2">
                    <button onClick={() => setPrimary(m.id)}
                      className="w-full py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition">Set Primary</button>
                    <button onClick={() => removeMedia(m.id)}
                      className="w-full py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-medium transition">Remove</button>
                  </div>
                )}
              </div>
            ))}
            {/* View all */}
            {showViewAll && (
              <button onClick={() => setMediaPopup(true)}
                className="w-32 h-32 shrink-0 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-blue-300 hover:bg-blue-50/30 transition-all bg-gray-50/50">
                <span className="text-xl font-bold text-gray-500">+{sorted.length - 4}</span>
                <span className="text-xs text-gray-400 mt-1">View all</span>
              </button>
            )}
            {/* Add */}
            {isEditing && (
              <label className="w-32 h-32 shrink-0 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all bg-gray-50/50 group">
                <Upload size={18} strokeWidth={1.5} className="text-gray-300 group-hover:text-primary mb-1 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-primary transition-colors">{uploading ? "Uploading…" : "Add Image"}</span>
                <input type="file" multiple accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) handleMediaUpload(f); e.target.value = ""; }} />
              </label>
            )}
          </div>
        )}
      </Section>

      {mediaPopup && (
        <MediaPopup media={sorted} isEditing={isEditing}
          onSetPrimary={setPrimary} onRemove={removeMedia}
          onClose={() => setMediaPopup(false)} onUpload={handleMediaUpload} uploading={uploading} />
      )}
    </>
  );
}

/* MEDIA POPUP  */
function MediaPopup({ media, isEditing, onSetPrimary, onRemove, onClose, onUpload, uploading }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-900">
            All Media <span className="text-gray-400 font-normal ml-1">({media.length} images)</span>
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-4 gap-3">
            {media.map((m, idx) => (
              <div key={m.id} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={m.media_url} className="w-full h-full object-cover" alt={`Media ${idx + 1}`} />
                </div>
                {isEditing && m.sequence !== 1 && (
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition rounded-xl flex flex-col items-center justify-center gap-1.5 p-2">
                    <button onClick={() => onSetPrimary(m.id)} className="w-full py-1 bg-blue-500 text-white text-xs rounded-lg font-medium">Set Primary</button>
                    <button onClick={() => onRemove(m.id)} className="w-full py-1 bg-red-500 text-white text-xs rounded-lg font-medium">Remove</button>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  {m.sequence === 1
                    ? <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Primary</span>
                    : <span className="bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium">{m.sequence}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t px-5 py-3 bg-gray-50/80 flex gap-2 items-center">
          {isEditing && (
            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
              <Plus size={13} /> Add More Images {uploading && "(Uploading…)"}
              <input type="file" multiple accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) onUpload(f); e.target.value = ""; }} />
            </label>
          )}
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition">Close</button>
        </div>
      </div>
    </div>
  );
}
