import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ChevronDown, RotateCcw, Upload, Image } from 'lucide-react';
import { toast } from 'react-toastify';

function CreateSkuPopup({
  onClose,
  options: initialOptions = [],
  productName,
  productId,
  existingSkus,
  pricingMode: initialPricingMode,
  globalPricing: initialGlobalPricing,
  onSuccess,
  taxTypeId
}) {
  const [loading, setLoading] = useState(false);
  const [pricingMode, setPricingMode] = useState(initialPricingMode || "conversion");
  const [options, setOptions] = useState([{}]);
  const [optionTypes, setOptionTypes] = useState([]);
  const [skuMedia, setSkuMedia] = useState([]);

  const [globalPricing, setGlobalPricing] = useState({
    conversion_factor: initialGlobalPricing?.conversion_factor || 1,
    multiplication_factor: initialGlobalPricing?.multiplication_factor || 1,
    threshold_quantity: initialGlobalPricing?.threshold_quantity || 1
  });

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
    status: "active"
  });

  const UOM_OPTIONS = [
    { id: 'sq_ft', name: 'Sq ft' },
    { id: 'ml', name: 'Ml' },
    { id: 'l', name: 'L' },
    { id: 'gm', name: 'Gm' },
    { id: 'kg', name: 'Kg' },
    { id: 'm', name: 'Mm' },
    { id: 'packet', name: 'Packet' },
    { id: 'unit', name: 'Unit' },
    { id: 'piece', name: 'Piece' },
  ];

  useEffect(() => {
    fetchOptionTypes();
  }, []);

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
    setForm(prev => { return { ...prev, ...next } });
  }

  function updateGlobalPricing(next) {
    setGlobalPricing(prev => ({ ...prev, ...next }));
  }

  function handleMrpChange(value) {
    const mrpValue = value;
    const conversionFactor = Number(globalPricing.conversion_factor) || 1;
    const unitPrice = mrpValue && conversionFactor
      ? Number((Number(mrpValue) / conversionFactor).toFixed(2))
      : "";
    updateForm({ mrp: mrpValue, unit_price: unitPrice, selling_price: mrpValue });
  }

  function handleUnitPriceChange(value) {
    const unitValue = value;
    const multiplicationFactor = Number(globalPricing.multiplication_factor) || 1;
    const calculatedPrice = unitValue && multiplicationFactor
      ? Number((Number(unitValue) * multiplicationFactor).toFixed(2))
      : "";
    updateForm({
      unit_price: unitValue,
      mrp: calculatedPrice,
      selling_price: calculatedPrice
    });
  }

  function handlePricingModeChange(mode) {
    setPricingMode(mode);
    // Clear all price fields when switching modes
    updateForm({
      unit_price: "",
      mrp: "",
      selling_price: ""
    });
  }

  function handleConversionFactorChange(value) {
    updateGlobalPricing({ conversion_factor: value });
    if (pricingMode === "conversion" && form.mrp) {
      const conversionFactor = Number(value) || 1;
      const unitPrice = Number((Number(form.mrp) / conversionFactor).toFixed(2));
      updateForm({ unit_price: unitPrice });
    }
  }

  function handleMultiplicationFactorChange(value) {
    updateGlobalPricing({ multiplication_factor: value });
    if (pricingMode === "multiplication" && form.unit_price) {
      const multiplicationFactor = Number(value) || 1;
      const calculatedPrice = Number((Number(form.unit_price) * multiplicationFactor).toFixed(2));
      updateForm({ mrp: calculatedPrice, selling_price: calculatedPrice });
    }
  }

  // Add a new empty option row
  function addOptionRow() {
    setOptions([...options, { type: "", value: "" }]);
  }

  // Delete an option row
  function deleteOptionRow(index) {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  }
  // Update option type
  function updateOptionType(index, type) {
    const updated = [...options];
    updated[index].type = type;
    setOptions(updated);
  }

  // Update option value
  function updateOptionValue(index, value) {
    const updated = [...options];
    updated[index].value = value;
    setOptions(updated);
  }

  // Create new option type
  function createNewOptionType(newOptionName) {
    setOptionTypes(prev => [...prev, { name: newOptionName }]);
  }

  // Get selected types (except current row)
  function getSelectedTypes(currentIndex) {
    return options
      .map((o, idx) => idx !== currentIndex ? o.type : null)
      .filter(Boolean);
  }

  function validateForm() {
    if (!form.sku_name.trim()) {
      toast.error("SKU name is required");
      return false;
    }

    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return false;
    }

    if (!form.sku_code.trim()) {
      toast.error("SKU code is required");
      return false;
    }

    if (existingSkus?.some(s => s.sku_name === form.sku_name.trim())) {
      toast.error("SKU name already exists");
      return false;
    }

    if (existingSkus?.some(s => s.sku_code === form.sku_code.trim())) {
      toast.error("SKU code already exists");
      return false;
    }

    // Validate media - at least one image required
    // if (skuMedia.length === 0) {
    //   toast.error("At least one image is required");
    //   return false;
    // }

    // Validate based on pricing mode
    if (pricingMode === "conversion") {
      if (!form.mrp || !form.selling_price) {
        toast.error("MRP and Selling Price are required");
        return false;
      }

      if (Number(form.mrp) < 1 || Number(form.selling_price) < 1 || Number(form.unit_price) < 1) {
        toast.error("All prices must be at least 1");
        return false;
      }
    } else {
      if (!form.unit_price) {
        toast.error("Unit Price is required");
        return false;
      }

      if (Number(form.unit_price) < 1 || Number(form.mrp) < 1 || Number(form.selling_price) < 1) {
        toast.error("All prices must be at least 1");
        return false;
      }
    }

    return true;
  }

  async function handleCreateSku() {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Build option_type_values array from options (new structure)
      const option_type_values = options
        .filter(opt => opt.type && opt.value) // Only include options with both type and value
        .map(opt => ({
          option_type: opt.type,
          option_value: opt.value
        }));

      // Build sku_media array from skuMedia state
      const sku_media = skuMedia.map(media => ({
        media_url: media.media_url,
        media_type: media.media_type || 'image',
        active: media.active !== undefined ? media.active : true,
        sequence: media.sequence
      }));

      const payload = {
        product_sku: {
          product_id: productId,
          sku_name: form.sku_name.trim(),
          display_name: form.display_name.trim(),
          sku_code: form.sku_code.trim(),
          dimension: form.dimension.trim(),
          weight: form.weight.trim(),
          unit_price: Number(form.unit_price),
          mrp: Number(form.mrp),
          selling_price: Number(form.selling_price),
          uom: form.uom,
          status: form.status,
          master: false,
          threshold_quantity: Number(globalPricing.threshold_quantity) || 1
        }
      };

      // Add pricing factors based on mode
      if (pricingMode === "conversion") {
        payload.product_sku.conversion_factor = Number(globalPricing.conversion_factor) || 1;
      }

      if (pricingMode === "multiplication") {
        payload.product_sku.multiplication_factor = Number(globalPricing.multiplication_factor) || 1;
      }

      // Add tax type if exists
      if (taxTypeId) {
        payload.product_sku.tax_type_id = taxTypeId;
      }

      // Add option_type_values if exists
      if (option_type_values.length > 0) {
        payload.product_sku.option_type_values = option_type_values;
      }

      // Add sku_media if exists
      if (sku_media.length > 0) {
        payload.product_sku.sku_media = sku_media;
      }

      console.log("Create SKU payload:", payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = "Failed to create SKU";
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

      toast.success("SKU created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Create SKU error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full h-9 px-3 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-blue-50">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Create Product SKU</h3>
            <p className="text-xs text-gray-500 mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-100 cursor-pointer"
          >
            <X size={20} className='text-gray-700' />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 space-y-5">

          {/* Pricing Mode */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">Pricing Mode</h4>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="pricingMode"
                    value="conversion"
                    checked={pricingMode === "conversion"}
                    onChange={(e) => handlePricingModeChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pricingMode === "conversion"
                    ? 'border-blue-600 bg-white'
                    : 'border-gray-300 bg-white'
                    }`}>
                    {pricingMode === "conversion" && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-700">Conversion Factor (MRP → Unit Price)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="pricingMode"
                    value="multiplication"
                    checked={pricingMode === "multiplication"}
                    onChange={(e) => handlePricingModeChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pricingMode === "multiplication"
                    ? 'border-blue-600 bg-white'
                    : 'border-gray-300 bg-white'
                    }`}>
                    {pricingMode === "multiplication" && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-700">Multiplication Factor (Unit Price → MRP)</span>
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
                    value={globalPricing.conversion_factor}
                    onChange={(e) => handleConversionFactorChange(e.target.value)}
                    onWheel={(e) => e.target.blur()}
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
                    value={globalPricing.multiplication_factor}
                    onChange={(e) => handleMultiplicationFactorChange(e.target.value)}
                    onWheel={(e) => e.target.blur()}
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
                  value={globalPricing.threshold_quantity}
                  onChange={(e) => updateGlobalPricing({ threshold_quantity: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              <div>
                <label className={labelClass}>UOM</label>
                <select
                  className={inputClass}
                  value={form.uom}
                  onChange={(e) => updateForm({ uom: e.target.value })}
                >
                  {UOM_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-800">
                <strong>{pricingMode === "conversion" ? "Conversion Mode:" : "Multiplication Mode:"}</strong>
                {" "}
                {pricingMode === "conversion"
                  ? "Enter MRP → Unit Price will be auto-calculated as MRP ÷ Conversion Factor"
                  : "Enter Unit Price → MRP & Selling Price will be auto-calculated as Unit Price × Multiplication Factor"
                }
              </p>
            </div>
          </div>

          {/* SKU Information */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">SKU Information</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>SKU Name <span className='text-red-500'>*</span></label>
                <input
                  className={inputClass}
                  value={form.sku_name}
                  onChange={(e) => updateForm({ sku_name: e.target.value })}
                  placeholder="Enter SKU name"
                />
              </div>

              <div>
                <label className={labelClass}>Display Name <span className='text-red-500'>*</span></label>
                <input
                  className={inputClass}
                  value={form.display_name}
                  onChange={(e) => updateForm({ display_name: e.target.value })}
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className={labelClass}>SKU Code <span className='text-red-500'>*</span></label>
                <input
                  className={inputClass}
                  value={form.sku_code}
                  onChange={(e) => updateForm({ sku_code: e.target.value })}
                  placeholder="Enter SKU code"
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => updateForm({ status: e.target.value })}
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
                />
              </div>

              <div>
                <label className={labelClass}>Weight</label>
                <input
                  className={inputClass}
                  value={form.weight}
                  onChange={(e) => updateForm({ weight: e.target.value })}
                  placeholder="Enter weight"
                />
              </div>

            </div>
          </div>

          {/* Pricing Details */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">Pricing Details</h4>

            <div className="grid grid-cols-3 gap-3">
              {pricingMode === "conversion" ? (
                <>
                  <div>
                    <label className={labelClass}>MRP <span className='text-red-500'>*</span></label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={inputClass}
                      value={form.mrp}
                      onChange={(e) => handleMrpChange(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Unit Price (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={`${inputClass} bg-blue-50`}
                      value={form.unit_price}
                      onChange={(e) => updateForm({ unit_price: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Selling Price (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={`${inputClass} bg-blue-50`}
                      value={form.selling_price}
                      onChange={(e) => updateForm({ selling_price: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Unit Price <span className='text-red-500'>*</span></label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={inputClass}
                      value={form.unit_price}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>MRP (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={`${inputClass} bg-blue-50`}
                      value={form.mrp}
                      onChange={(e) => updateForm({ mrp: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Selling Price (Auto)</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className={`${inputClass} bg-blue-50`}
                      value={form.selling_price}
                      onChange={(e) => updateForm({ selling_price: e.target.value })}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Option Values */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-900">Option Values</h4>

            {/* ================= OPTIONS ================= */}
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
                  onCreateNewOption={createNewOptionType}
                />
              ))}

              <div className="flex justify-center">
                <button
                  onClick={addOptionRow}
                  className="h-10 w-10 rounded-full border border-gray-400
                       flex items-center justify-center
                       hover:bg-green-600 hover:text-white transition"
                >
                  <Plus />
                </button>
              </div>
            </div>
          </div>

          <SkuMediaSection
            skuMedia={skuMedia}
            setSkuMedia={setSkuMedia}
          />
        </div>


        {/* Footer */}
        <div className="border-t px-5 py-3 flex mx-auto gap-4 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSku}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating...' : 'Create SKU'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  option,
  optionTypes,
  selectedTypes,
  onTypeChange,
  onValueChange,
  onRemoveOption,
  onCreateNewOption
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available options
  const availableOptions = optionTypes
    .filter(opt => !selectedTypes.includes(opt.name))
    .filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Check if search term matches exactly with an existing option
  const exactMatch = optionTypes.some(
    opt => opt.name.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className="border border-gray-300 rounded-lg p-2 my-4">
      <div className="grid grid-cols-[1.2fr_2fr_auto] gap-3 items-start">

        {/* Option Type Dropdown with Create Option */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-8 px-3 text-sm border border-gray-300 rounded flex items-center justify-between hover:border-gray-400 transition-colors text-left bg-white"
          >
            <span className={option.type ? "text-gray-900" : "text-gray-400"}>
              {option.type || "Search or type to add"}
            </span>
            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
              {/* Search Input - Fixed at top */}
              <div className="p-1 border-b sticky top-0 bg-white">
                <input
                  type="text"
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary"
                  placeholder="Search or type to create..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Options List - Scrollable */}
              <div className="overflow-y-auto flex-1">
                {availableOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => {
                      onTypeChange(opt.name);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full px-3 py-1 text-sm text-left hover:bg-blue-50 transition-colors text-gray-900"
                  >
                    {opt.name}
                  </button>
                ))}

                {/* Create New Option Button */}
                {searchTerm && !exactMatch && (
                  <button
                    onClick={() => {
                      // Create new option type
                      if (onCreateNewOption) {
                        onCreateNewOption(searchTerm);
                      }
                      onTypeChange(searchTerm);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full flex items-center px-3 py-1 text-sm text-left bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-medium border-t"
                  >
                    <Plus size={20} /> Create "{searchTerm}"
                  </button>
                )}

                {/* Empty State */}
                {availableOptions.length === 0 && !searchTerm && (
                  <div className="px-3 py-1 text-sm text-gray-500 text-center">
                    No option types available
                  </div>
                )}

                {/* No Results */}
                {availableOptions.length === 0 && searchTerm && exactMatch && (
                  <div className="px-3 py-1 text-sm text-gray-500 text-center">
                    No matching options
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Single Value Input */}
        <div>
          <input
            value={option.value || ""}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Enter value"
            className="input w-full h-8"
          />
        </div>

        {/* Delete Button */}
        <button onClick={onRemoveOption} className="mt-1">
          <Trash2 className="text-red-500 hover:text-red-700" size={20} />
        </button>
      </div>
    </div>
  );
}

function SkuMediaSection({ skuMedia, setSkuMedia }) {
  const [uploading, setUploading] = useState(false);
  const [mediaPopup, setMediaPopup] = useState(false);

  // Upload media to S3 immediately
  const handleMediaUpload = async (files) => {
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('media_for', 'product sku');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/upload_media`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();
        uploadedUrls.push(result.data.media_url);
      }

      // Get current max sequence or 0 if no media exists
      const maxSequence = skuMedia.length > 0
        ? Math.max(...skuMedia.map(m => m.sequence))
        : 0;

      // Add new media with proper sequence
      const newMedia = files.map((file, idx) => ({
        id: Date.now() + idx,
        name: file.name,
        media_url: uploadedUrls[idx],
        media_type: 'image',
        active: true,
        sequence: maxSequence + idx + 1
      }));

      // If this is the first upload, set sequence to 1 (primary)
      if (skuMedia.length === 0 && newMedia.length > 0) {
        newMedia[0].sequence = 1;
      }

      setSkuMedia(prev => [...prev, ...newMedia]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Make selected image primary
  const setPrimary = (id) => {
    setSkuMedia(prev => {
      // Find current primary
      const currentPrimary = prev.find(m => m.sequence === 1);
      const selectedMedia = prev.find(m => m.id === id);

      if (!selectedMedia || selectedMedia.sequence === 1) return prev;

      return prev.map(m => {
        if (m.id === id) {
          // Set selected as primary
          return { ...m, sequence: 1 };
        } else if (m.sequence === 1) {
          // Move old primary to selected's position
          return { ...m, sequence: selectedMedia.sequence };
        }
        return m;
      });
    });

    // Close popup after setting primary
    setMediaPopup(false);
  };

  // Remove image (cannot remove primary)
  const removeMedia = (id) => {
    const mediaToRemove = skuMedia.find(m => m.id === id);

    if (mediaToRemove?.sequence === 1) {
      toast.error('Cannot remove primary image');
      return;
    }

    setSkuMedia(prev => {
      const filtered = prev.filter(m => m.id !== id);

      // Reorder sequences without changing primary
      const primary = filtered.find(m => m.sequence === 1);
      const others = filtered.filter(m => m.sequence !== 1);

      return [
        primary,
        ...others.map((m, idx) => ({ ...m, sequence: idx + 2 }))
      ].filter(Boolean);
    });
  };

  const primary = skuMedia.find(m => m.sequence === 1);
  const otherImages = skuMedia.filter(m => m.sequence !== 1).sort((a, b) => a.sequence - b.sequence);
  const visibleImages = otherImages.slice(0, 3);
  const hiddenCount = otherImages.length - 3;

  return (
    <>
      <div className="border border-gray-200 rounded p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-900">SKU Media</h4>

        {skuMedia.length === 0 ? (
          // Empty state with upload
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <label className="cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500 mb-1">Click to upload images</p>
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
          // Images grid
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
              {visibleImages.map(m => (
                <div key={m.id} className="relative group flex-shrink-0 w-20 h-20">
                  <img
                    src={m.media_url}
                    className="w-full h-full object-cover rounded-lg border border-gray-300"
                    alt="SKU"
                  />
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
                </div>
              ))}

              {/* ADD MORE (show if less than 4 images) */}
              {skuMedia.length < 4 && (
                <label className="shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  {uploading && <span className="text-xs">(Uploading...)</span>}
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span className="text-[10px] text-gray-500 mt-0.5">Add</span>
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
                  <Image className="h-4 w-4 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-900">+{hiddenCount}</span>
                  <span className="text-[10px] text-gray-500">View</span>
                </button>
              )}
            </div>

            {/* Add more button below grid (if 4+ images) */}
            {skuMedia.length >= 4 && (
              <label className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
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
          media={skuMedia}
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

// Mini Popup Component
function MediaPopup({ media, onSetPrimary, onRemove, onClose, onUpload, uploading }) {
  const sortedMedia = [...media].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Product Media</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-3 gap-4">
            {sortedMedia.map((m, index) => (
              <div key={m.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={m.media_url}
                    className="w-full h-full object-cover"
                    alt={`Media ${index + 1}`}
                  />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                  {m.sequence !== 1 && (
                    <>
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
                    </>
                  )}
                </div>

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

export default CreateSkuPopup;