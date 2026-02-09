"use client";
import { useState, useEffect, useRef } from "react";
import {
  X,
  Edit2,
  Save,
  Upload,
  ImageIcon,
  Trash2,
  Plus,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import { useConfirm } from "../../../../../../components/hooks/context/ConfirmContext";

export default function SkuDetailsPopup({ sku, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [skuData, setSkuData] = useState(null);
  const [pricingMode, setPricingMode] = useState("conversion");
  const [optionTypes, setOptionTypes] = useState([]);

  const [form, setForm] = useState({
    sku_name: "",
    display_name: "",
    sku_code: "",
    dimension: "",
    weight: "",
    unit_price: "",
    mrp: "",
    selling_price: "",
    uom: "piece",
    status: "active",
    conversion_factor: "",
    multiplication_factor: "",
    threshold_quantity: "",
  });

  const [options, setOptions] = useState([]);
  const [skuMedia, setSkuMedia] = useState([]);

  const UOM_OPTIONS = [
    { id: "sq_ft", name: "Sq ft" },
    { id: "ml", name: "Ml" },
    { id: "l", name: "L" },
    { id: "gm", name: "Gm" },
    { id: "kg", name: "Kg" },
    { id: "m", name: "Mm" },
    { id: "packet", name: "Packet" },
    { id: "unit", name: "Unit" },
    { id: "piece", name: "Piece" },
  ];

  const confirm = useConfirm();

  useEffect(() => {
    fetchSkuDetails();
    fetchOptionTypes();
  }, []);

  async function fetchSkuDetails() {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus/${sku.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch SKU details");
      const result = await response.json();
      const data = result.data;
      setSkuData(data);

      // Set form data
      setForm({
        sku_name: data.sku_name || "",
        display_name: data.display_name || "",
        sku_code: data.sku_code || "",
        dimension: data.dimension || "",
        weight: data.weight || "",
        unit_price: data.unit_price || "",
        mrp: data.mrp || "",
        selling_price: data.selling_price || "",
        uom: data.uom || "piece",
        status: data.status || "active",
        conversion_factor: data.conversion_factor || "",
        multiplication_factor: data.multiplication_factor || "",
        threshold_quantity: data.threshold_quantity || "",
      });

      // Determine pricing mode
      if (data.conversion_factor && !data.multiplication_factor) {
        setPricingMode("conversion");
      } else if (data.multiplication_factor && !data.conversion_factor) {
        setPricingMode("multiplication");
      } else if (data.conversion_factor) {
        setPricingMode("conversion"); // Fallback to conversion
      } else {
        setPricingMode("conversion");
      }

      // Set options
      if (data.option_type_values && data.option_type_values.length > 0) {
        const extractedOptions = data.option_type_values.map((opt) => ({
          option_type_id: opt.option_type.id,
          value_id: opt.option_value.id,
          original_value_id: opt.option_value.id,
          type: opt.option_type.name,
          value: opt.option_value.name,
          isExisting: true,
        }));
        setOptions(extractedOptions);
      }

      // Set media
      if (data.sku_media && data.sku_media.length > 0) {
        setSkuMedia(data.sku_media);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load SKU details");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptionTypes() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/option_types?only_names=true`
      );
      if (!res.ok) throw new Error("Failed to fetch option types");
      const result = await res.json();
      setOptionTypes(result.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load option types");
    }
  }

  function updateForm(next) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function handleMrpChange(value) {
    const mrpValue = value;
    const conversionFactor = Number(form.conversion_factor) || 1;
    const unitPrice =
      mrpValue && conversionFactor
        ? Number((Number(mrpValue) / conversionFactor).toFixed(2))
        : "";
    updateForm({ mrp: mrpValue, unit_price: unitPrice, selling_price: mrpValue });
  }

  function handleUnitPriceChange(value) {
    const unitValue = value;
    const multiplicationFactor = Number(form.multiplication_factor) || 1;
    const calculatedPrice =
      unitValue && multiplicationFactor
        ? Number((Number(unitValue) * multiplicationFactor).toFixed(2))
        : "";
    updateForm({
      unit_price: unitValue,
      mrp: calculatedPrice,
      selling_price: calculatedPrice,
    });
  }

  function handleConversionFactorChange(value) {
    updateForm({ conversion_factor: value });
    if (pricingMode === "conversion" && form.mrp) {
      const conversionFactor = Number(value) || 1;
      const unitPrice = Number((Number(form.mrp) / conversionFactor).toFixed(2));
      updateForm({ unit_price: unitPrice });
    }
  }

  function handleMultiplicationFactorChange(value) {
    updateForm({ multiplication_factor: value });
    if (pricingMode === "multiplication" && form.unit_price) {
      const multiplicationFactor = Number(value) || 1;
      const calculatedPrice = Number(
        (Number(form.unit_price) * multiplicationFactor).toFixed(2)
      );
      updateForm({ mrp: calculatedPrice, selling_price: calculatedPrice });
    }
  }

  function handlePricingModeChange(mode) {
    setPricingMode(mode);
  }

  function addOptionRow() {
    setOptions([...options, { type: "", value: "", isExisting: false }]);
  }

  async function deleteOptionRow(index) {
    const optionToRemove = options[index];
    if (
      optionToRemove.isExisting &&
      optionToRemove.type &&
      optionToRemove.value
    ) {
      const ok = await confirm(
        `Remove "${optionToRemove.type}: ${optionToRemove.value}"?`
      );
      if (!ok) return;
    }
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOptionType(index, type) {
    const updated = [...options];
    updated[index].type = type;
    setOptions(updated);
  }

  function updateOptionValue(index, value) {
    const updated = [...options];
    updated[index].value = value;
    if (updated[index].isExisting) {
      updated[index].isValueChanged = true;
      delete updated[index].value_id;
    }

    setOptions(updated);
  }

  function getSelectedTypes(currentIndex) {
    return options
      .map((o, idx) => (idx !== currentIndex ? o.type : null))
      .filter(Boolean);
  }

  async function handleUpdate() {
    if (!form.sku_name.trim()) {
      toast.error("SKU name is required");
      return;
    }

    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (!form.sku_code.trim()) {
      toast.error("SKU code is required");
      return;
    }

    if (form.selling_price > form.mrp) {
      toast.error("Selling price cannot be greater than mrp");
      return;
    }

    if (pricingMode === "conversion") {
      const expected = Number(form.mrp) / Number(form.conversion_factor);
      const actual = Number(form.unit_price);

      if (Math.abs(actual - expected) > 0.01) {
        toast.error("MRP and unit price not matching conversion factor");
        return;
      }
    }

    if (pricingMode === "multiplication") {
      const expected = Number(form.unit_price) * Number(form.multiplication_factor);
      const actual = Number(form.mrp);

      if (Math.abs(actual - expected) > 0.01) {
        toast.error("MRP and unit price not matching multiplication factor");
        return;
      }
    }

    setUpdating(true);

    try {
      // Build option_type_values array
      const option_type_values = options
        .filter(opt => opt.type && opt.value)
        .map(opt => {

          // CASE 1 → Existing + Not Changed
          if (opt.isExisting && !opt.isValueChanged) {
            return {
              option_type_id: opt.option_type_id,
              value_id: opt.original_value_id
            };
          }

          // CASE 2 → Existing + Changed Value
          if (opt.isExisting && opt.isValueChanged) {
            return {
              option_type_id: opt.option_type_id,
              option_value: opt.value
            };
          }

          // CASE 3 → New Option
          return {
            option_type: opt.type,
            option_value: opt.value
          };

        });

      // Build sku_media array
      const sku_media = skuMedia.map((media) => {
        if (media.isNew) {
          return {
            media_url: media.media_url,
            media_type: media.media_type || "image",
            active: media.active !== undefined ? media.active : true,
            sequence: media.sequence,
          };
        } else {
          return {
            id: media.id,
            media_url: media.media_url,
            media_type: media.media_type,
            active: media.active,
            sequence: media.sequence,
          };
        }
      });

      const payload = {
        product_sku: {
          sku_name: form.sku_name.trim(),
          display_name: form.display_name.trim(),
          sku_code: form.sku_code.trim(),
          dimension: form.dimension.trim(),
          weight: form.weight,
          unit_price: Number(form.unit_price),
          mrp: Number(form.mrp),
          selling_price: Number(form.selling_price),
          uom: form.uom,
          status: form.status,
          threshold_quantity: Number(form.threshold_quantity) || 1,
        },
      };

      // pricing factors based on mode
      if (pricingMode === "conversion") {
        payload.product_sku.conversion_factor =
          Number(form.conversion_factor) || 1;
        payload.product_sku.multiplication_factor = null;
      }

      if (pricingMode === "multiplication") {
        payload.product_sku.multiplication_factor =
          Number(form.multiplication_factor) || 1;
        payload.product_sku.conversion_factor = null;
      }

      // option_type_values if exists
      if (option_type_values.length > 0) {
        payload.product_sku.option_type_values = option_type_values;
      }

      // sku_media if exists
      if (sku_media.length > 0) {
        payload.product_sku.sku_media = sku_media;
      }

      console.log("Update SKU payload:", payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus/${sku.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = "Failed to update SKU";
        if (Array.isArray(result?.errors)) {
          errorMessage = result.errors.join(", ");
        } else if (typeof result?.errors === "object") {
          errorMessage = Object.values(result.errors).flat().join(", ");
        } else if (result?.message) {
          errorMessage = result.message;
        }
        toast.error(errorMessage);
        return;
      }

      toast.success("SKU updated successfully");
      setIsEditing(false);
      onSuccess?.();
      onClose();
      fetchSkuDetails(); // Refresh data
    } catch (err) {
      console.error("Update SKU error:", err);
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  }

  const inputClass = isEditing
    ? "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    : "w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed";

  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading SKU details...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SKU Details</h3>
            <p className="text-sm text-gray-500 mt-0.5">{form.sku_code}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer"
              >
                <Edit2 size={16} />
                Edit
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                <Save size={16} />
                {updating ? "Updating..." : "Update SKU"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 border-2 p-2 rounded-md hover:text-gray-50 hover:bg-red-500 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Master SKU Badge */}
          {skuData?.master && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900">
                  Master SKU
                </div>
                <div className="text-xs text-green-700">
                  This is the primary variant for this product
                </div>
              </div>
            </div>
          )}

          {/* Pricing Mode */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Pricing Mode</h4>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingMode"
                  value="conversion"
                  checked={pricingMode === "conversion"}
                  onChange={(e) => handlePricingModeChange(e.target.value)}
                  disabled={!isEditing}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pricingMode === "conversion"
                    ? "border-blue-600 bg-white"
                    : "border-gray-300 bg-white"
                    } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {pricingMode === "conversion" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  Conversion Factor (MRP → Unit Price)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingMode"
                  value="multiplication"
                  checked={pricingMode === "multiplication"}
                  onChange={(e) => handlePricingModeChange(e.target.value)}
                  disabled={!isEditing}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pricingMode === "multiplication"
                    ? "border-blue-600 bg-white"
                    : "border-gray-300 bg-white"
                    } ${!isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {pricingMode === "multiplication" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  Multiplication Factor (Unit Price → MRP)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {pricingMode === "conversion" && (
                <div>
                  <label className={labelClass}>Conversion Factor</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className={inputClass}
                    value={form.conversion_factor}
                    onChange={(e) =>
                      handleConversionFactorChange(e.target.value)
                    }
                    onWheel={(e) => e.target.blur()}
                    disabled={!isEditing}
                  />
                </div>
              )}

              {pricingMode === "multiplication" && (
                <div>
                  <label className={labelClass}>Multiplication Factor</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className={inputClass}
                    value={form.multiplication_factor}
                    onChange={(e) =>
                      handleMultiplicationFactorChange(e.target.value)
                    }
                    onWheel={(e) => e.target.blur()}
                    disabled={!isEditing}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Threshold Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className={inputClass}
                  value={form.threshold_quantity}
                  onChange={(e) =>
                    updateForm({ threshold_quantity: e.target.value })
                  }
                  onWheel={(e) => e.target.blur()}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className={labelClass}>UOM</label>
                <select
                  className={inputClass}
                  value={form.uom}
                  onChange={(e) => updateForm({ uom: e.target.value })}
                  disabled={!isEditing}
                >
                  {UOM_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs text-blue-800">
                  <strong>
                    {pricingMode === "conversion"
                      ? "Conversion Mode:"
                      : "Multiplication Mode:"}
                  </strong>{" "}
                  {pricingMode === "conversion"
                    ? "Enter MRP → Unit Price will be auto-calculated as MRP ÷ Conversion Factor"
                    : "Enter Unit Price → MRP & Selling Price will be auto-calculated as Unit Price × Multiplication Factor"}
                </p>
              </div>
            )}
          </div>

          {/* SKU Information */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              SKU Information
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>SKU Name *</label>
                <input
                  className={inputClass}
                  value={form.sku_name}
                  onChange={(e) => updateForm({ sku_name: e.target.value })}
                  placeholder="Enter SKU name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className={labelClass}>Display Name *</label>
                <input
                  className={inputClass}
                  value={form.display_name}
                  onChange={(e) => updateForm({ display_name: e.target.value })}
                  placeholder="Enter display name"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className={labelClass}>SKU Code *</label>
                <input
                  className={inputClass}
                  value={form.sku_code}
                  onChange={(e) => updateForm({ sku_code: e.target.value })}
                  placeholder="Enter SKU code"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => updateForm({ status: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Dimension</label>
                <input
                  className={inputClass}
                  value={form.dimension}
                  onChange={(e) => updateForm({ dimension: e.target.value })}
                  placeholder="Enter dimension"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className={labelClass}>Weight</label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={form.weight}
                  onChange={(e) => updateForm({ weight: e.target.value })}
                  placeholder="Enter weight"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Pricing Details
            </h4>

            <div className="grid grid-cols-3 gap-3">
              {pricingMode === "conversion" ? (
                <>
                  <div>
                    <label className={labelClass}>MRP *</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={inputClass}
                      value={form.mrp}
                      onChange={(e) => handleMrpChange(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Unit Price (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={
                        isEditing
                          ? `${inputClass} bg-blue-50`
                          : inputClass
                      }
                      value={form.unit_price}
                      onChange={(e) =>
                        updateForm({ unit_price: e.target.value })
                      }
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Selling Price (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={
                        isEditing
                          ? `${inputClass} bg-blue-50`
                          : inputClass
                      }
                      value={form.selling_price}
                      onChange={(e) =>
                        updateForm({ selling_price: e.target.value })
                      }
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      disabled={!isEditing}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Unit Price *</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={inputClass}
                      value={form.unit_price}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>MRP (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={
                        isEditing
                          ? `${inputClass} bg-blue-50`
                          : inputClass
                      }
                      value={form.mrp}
                      onChange={(e) => updateForm({ mrp: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Selling Price (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={
                        isEditing
                          ? `${inputClass} bg-blue-50`
                          : inputClass
                      }
                      value={form.selling_price}
                      onChange={(e) =>
                        updateForm({ selling_price: e.target.value })
                      }
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      disabled={!isEditing}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Option Values */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Option Values
            </h4>

            {options.length === 0 && !isEditing ? (
              <div className="text-center py-6 text-gray-500 text-sm border border-gray-200 rounded-lg">
                No options added
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <OptionRow
                    key={i}
                    option={opt}
                    optionTypes={optionTypes}
                    selectedTypes={getSelectedTypes(i)}
                    onTypeChange={(type) => updateOptionType(i, type)}
                    onValueChange={(value) => updateOptionValue(i, value)}
                    onRemoveOption={() => deleteOptionRow(i)}
                    onCreateNewOption={(newOption) => {
                      setOptionTypes((prev) => [...prev, { name: newOption }]);
                    }}
                    isEditing={isEditing}
                  />
                ))}
              </div>
            )}

            {isEditing && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={addOptionRow}
                  className="h-10 w-10 rounded-full border border-gray-400 flex items-center justify-center hover:bg-green-600 hover:text-white transition"
                >
                  <Plus />
                </button>
              </div>
            )}
          </div>

          {/* SKU Media */}
          <SkuMediaSection
            skuMedia={skuMedia}
            setSkuMedia={setSkuMedia}
            isEditing={isEditing}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-80 ml-76 px-4 py-2 bg-gray-400 text-gray-200 rounded-lg hover:bg-gray-800 transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Option Row Component
function OptionRow({
  option,
  optionTypes,
  selectedTypes,
  onTypeChange,
  onValueChange,
  onRemoveOption,
  onCreateNewOption,
  isEditing,
}) {
  return (
    <div className="border border-gray-300 rounded-lg p-3">
      <div className="grid grid-cols-[1.2fr_2fr_auto] gap-3 items-start">
        {/* Option Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">
            Option Type
          </label>

          {isEditing && !option.isExisting ? (
            <SearchableDropdown
              options={optionTypes
                .filter((opt) => !selectedTypes.includes(opt.name))
                .map((opt) => ({ id: opt.name, name: opt.name }))}
              value={option.type}
              creatable
              onChange={(value) => onTypeChange(value)}
              placeholder="Search or type to add"
              emptyMessage="No option types available"
              onCreateOption={onCreateNewOption}
            />
          ) : (
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
              {option.type || "—"}
            </div>
          )}
        </div>

        {/* Option Value */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Value</label>

          {isEditing ? (
            <input
              value={option.value || ""}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Enter value"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
              {option.value || "—"}
            </div>
          )}
        </div>

        {/* Delete Button */}
        {isEditing && (
          <button onClick={onRemoveOption} className="mt-6">
            <Trash2 className="text-red-500 hover:text-red-700" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// SKU Media Section Component
function SkuMediaSection({ skuMedia, setSkuMedia, isEditing }) {
  const [uploading, setUploading] = useState(false);
  const [mediaPopup, setMediaPopup] = useState(false);

  // Upload media to S3
  const handleMediaUpload = async (files) => {
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("media_for", "product sku");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/upload_media`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Upload failed");

        const result = await response.json();
        uploadedUrls.push(result.data.media_url);
      }

      // Get current max sequence
      const maxSequence =
        skuMedia.length > 0
          ? Math.max(...skuMedia.map((m) => m.sequence))
          : 0;

      // Add new media with proper sequence
      const newMedia = uploadedUrls.map((url, idx) => ({
        id: Date.now() + idx,
        media_url: url,
        media_type: "image",
        active: true,
        sequence: maxSequence + idx + 1,
        isNew: true,
      }));

      // If this is the first upload, set sequence to 1 (primary)
      if (skuMedia.length === 0 && newMedia.length > 0) {
        newMedia[0].sequence = 1;
      }

      setSkuMedia((prev) => [...prev, ...newMedia]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  // Set image as primary
  const setPrimary = (id) => {
    setSkuMedia((prev) => {
      const selectedMedia = prev.find((m) => m.id === id);
      if (!selectedMedia || selectedMedia.sequence === 1) return prev;

      return prev.map((m) => {
        if (m.id === id) {
          return { ...m, sequence: 1 };
        } else if (m.sequence === 1) {
          return { ...m, sequence: selectedMedia.sequence };
        }
        return m;
      });
    });

    setMediaPopup(false);
  };

  // Remove image (cannot remove primary)
  const removeMedia = async (id) => {
    const mediaToRemove = skuMedia.find((m) => m.id === id);

    if (mediaToRemove?.sequence === 1) {
      toast.error("Cannot remove primary image");
      return;
    }

    const confirmed = await confirm(
      "Are you sure you want to remove this image?"
    );
    if (!confirmed) return;

    setSkuMedia((prev) => {
      const filtered = prev.filter((m) => m.id !== id);

      // Reorder sequences without changing primary
      const primary = filtered.find((m) => m.sequence === 1);
      const others = filtered
        .filter((m) => m.sequence !== 1)
        .sort((a, b) => a.sequence - b.sequence);

      return [
        primary,
        ...others.map((m, idx) => ({ ...m, sequence: idx + 2 })),
      ].filter(Boolean);
    });
  };

  const sortedMedia = [...skuMedia].sort((a, b) => a.sequence - b.sequence);
  const primary = sortedMedia.find((m) => m.sequence === 1);
  const otherImages = sortedMedia.filter((m) => m.sequence !== 1);
  const visibleOthers = otherImages.slice(0, 3);
  const hiddenCount = otherImages.length - 3;

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">SKU Media</h4>

        {skuMedia.length === 0 && !isEditing ? (
          <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-lg">
            No media uploaded
          </div>
        ) : skuMedia.length === 0 && isEditing ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <label className="cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 mb-1">
                Click to upload images
              </p>
              {uploading && <p className="text-xs text-blue-600">Uploading...</p>}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) handleMediaUpload(files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {/* PRIMARY IMAGE */}
              {primary && (
                <div className="relative group shrink-0 w-40 h-28">
                  <img
                    src={primary.media_url}
                    className="w-full h-full object-cover rounded-lg border-2 border-blue-500"
                    alt="Primary"
                  />
                  <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                    Primary
                  </span>
                </div>
              )}

              {/* OTHER IMAGES */}
              {visibleOthers.map((m) => (
                <div key={m.id} className="relative group flex-shrink-0 w-20 h-20">
                  <img
                    src={m.media_url}
                    className="w-full h-full object-cover rounded-lg border border-gray-300"
                    alt="SKU"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center gap-1">
                      <button
                        onClick={() => setPrimary(m.id)}
                        className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700"
                      >
                        Primary
                      </button>
                      <button
                        onClick={() => removeMedia(m.id)}
                        className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* ADD MORE (show if less than 4 images and editing) */}
              {isEditing && skuMedia.length < 4 && (
                <label className="shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  {uploading ? (
                    <span className="text-xs">Uploading...</span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        Add
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) handleMediaUpload(files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}

              {/* VIEW ALL BUTTON */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setMediaPopup(true)}
                  className="shrink-0 w-20 h-20 border border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-900">
                    +{hiddenCount}
                  </span>
                  <span className="text-[10px] text-gray-500">View</span>
                </button>
              )}

            </div>

            {/* Add more button below grid (if 4+ images and editing) */}
            {isEditing && skuMedia.length >= 4 && (
              <label className="flex w-80 mx-auto items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                <Plus size={14} />
                Add More Images
                {uploading && <span className="text-xs">(Uploading...)</span>}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) handleMediaUpload(files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Media Popup */}
      {mediaPopup && (
        <MediaPopup
          media={sortedMedia}
          isEditing={isEditing}
          onSetPrimary={setPrimary}
          onRemove={removeMedia}
          onClose={() => setMediaPopup(false)}
          onUpload={handleMediaUpload}
          uploading={uploading}
        />
      )}
    </>
  );
}

// Media Popup Component
function MediaPopup({
  media,
  isEditing,
  onSetPrimary,
  onRemove,
  onClose,
  onUpload,
  uploading,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">SKU Media</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-3 gap-4">
            {media.map((m, index) => (
              <div key={m.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={m.media_url}
                    className="w-full h-full object-cover"
                    alt={`Media ${index + 1}`}
                  />
                </div>

                {/* Overlay */}
                {isEditing && m.sequence !== 1 && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => onSetPrimary(m.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Set as Primary
                    </button>
                    <button
                      onClick={() => onRemove(m.id)}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Sequence Badge */}
                <div className="absolute top-2 left-2">
                  {m.sequence === 1 ? (
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Primary
                    </span>
                  ) : (
                    <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium">
                      {m.sequence}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 bg-gray-50 flex gap-2">
          {isEditing && (
            <label className="flex-1 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer text-center">
              <Plus size={14} className="inline mr-1" />
              Add More Images
              {uploading && <span className="ml-2">(Uploading...)</span>}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) onUpload(files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}