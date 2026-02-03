"use client";
import { useEffect, useState, useRef } from "react";
import {
  Trash2,
  Plus,
  X,
  CornerDownLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import CreateSkuPopup from "./CreateSkuPopup";

export default function ProductUpdationAttributes({
  productId,
  formData,
  products,
  setProducts,
  pricingMode,
  globalPricing
}) {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [showUpdateSkuSection, setShowUpdateSkuSection] = useState(false);
  const [detailsPopup, setDetailsPopup] = useState(null);
  const [properties, setProperties] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const options = properties.map((prop) => ({
    type: prop.name,
    values: prop.values || []
  }));

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  async function fetchProductDetails() {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/${productId}`
      );
      if (!response.ok) throw new Error("Failed to fetch product details");
      const result = await response.json();
      setProductData(result.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
        <div className="text-center py-12 text-gray-500">
          No product data found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6 space-y-8">
      {/* Option Types Section */}
      <PropertyTypesSection
        productData={productData}
        showUpdateSkuSection={showUpdateSkuSection}
        setShowUpdateSkuSection={setShowUpdateSkuSection}
        properties={properties}
        setProperties={setProperties}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
      />

      {/* SKU Table Section */}
      <SkuTableSection
        productData={productData}
        setDetailsPopup={setDetailsPopup}
        options={options}
        pricingMode={pricingMode}
        globalPricing={globalPricing}
        onRefresh={fetchProductDetails}
      />

      {/* Details Popup */}
      {detailsPopup && (
        <SkuDetailsPopup
          sku={detailsPopup}
          onClose={() => setDetailsPopup(null)}
        />
      )}
    </div>
  );
}

// ==================== OPTION TYPES SECTION ====================
function PropertyTypesSection({
  productData,
  showUpdateSkuSection,
  setShowUpdateSkuSection,
  properties,
  setProperties,
  hasChanges,
  setHasChanges
}) {

  const [propertyNames, setPropertyNames] = useState([]);
  const [originalProperties, setOriginalProperties] = useState([]);

  useEffect(() => {
    extractPropertiesFromProduct();
    fetchPropertyNames();
  }, [productData]);

  function extractPropertiesFromProduct() {
    if (!productData?.product_properties) return;

    const propertiesMap = {};

    productData.product_properties.forEach(prop => {
      const propertyName = prop.property_type.name;
      const propertyValue = prop.property_value.name;

      if (!propertiesMap[propertyName]) {
        propertiesMap[propertyName] = {
          name: propertyName,
          values: [],
          input: ""
        };
      }

      if (!propertiesMap[propertyName].values.includes(propertyValue)) {
        propertiesMap[propertyName].values.push(propertyValue);
      }
    });

    const extractedProperties = Object.values(propertiesMap);
    setProperties(extractedProperties);
    setOriginalProperties(JSON.parse(JSON.stringify(extractedProperties))); // Deep copy
  }

  useEffect(() => {
    // Check if properties have changed
    const changed = JSON.stringify(properties) !== JSON.stringify(originalProperties);
    setHasChanges(changed);
  }, [properties, originalProperties]);

  async function fetchPropertyNames() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/get_property_names`
      );
      if (!response.ok) throw new Error("Failed to fetch property names");
      const result = await response.json();
      setPropertyNames(result.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load property names");
    }
  }

  const addPropertyRow = () => {
    setProperties(p => [...p, { name: "", values: [], input: "" }]);
  };

  const deletePropertyRow = (index) => {
    if (properties.length === 1) {
      setProperties([{ name: "", values: [], input: "" }]);
    } else {
      setProperties(p => p.filter((_, i) => i !== index));
    }
  };

  const addPropertyValue = (index) => {
    const updated = [...properties];
    const value = updated[index].input.trim();

    if (!updated[index].name) {
      alert("Please select property name first");
      return;
    }

    if (!value) return;
    if (updated[index].values.includes(value)) return;

    updated[index].values.push(value);
    updated[index].input = "";
    setProperties(updated);
  };

  const removePropertyValue = (propIndex, valueIndex) => {
    const property = properties[propIndex];
    const valueToRemove = property.values[valueIndex];

    const ok = window.confirm(
      `Removing "${valueToRemove}" will affect corresponding products. Do you want to continue?`
    );

    if (!ok) return;

    const updatedProperties = properties.map((p, i) =>
      i === propIndex
        ? { ...p, values: p.values.filter((_, vi) => vi !== valueIndex) }
        : p
    );

    setProperties(updatedProperties);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product Properties</h3>
        <button
          onClick={() => setShowUpdateSkuSection(!showUpdateSkuSection)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          {showUpdateSkuSection ? 'Cancel Update' : 'Update Properties'}
        </button>
      </div>

      {/* Properties Display/Edit */}
      <div className="space-y-4">
        {properties.map((prop, i) => (
          <div key={i} className="border border-gray-300 rounded-lg p-4">
            <div className="grid grid-cols-[1.2fr_2fr_auto] gap-3 items-start">
              {/* Property Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Property Name</label>
                {showUpdateSkuSection ? (
                  <SearchableDropdown
                    options={propertyNames
                      .filter(name => {
                        const selectedNames = properties
                          .map((p, idx) => idx !== i ? p.name : null)
                          .filter(Boolean);
                        return !selectedNames.includes(name);
                      })
                      .map(name => ({ id: name, name: name }))}
                    value={prop.name}
                    creatable
                    onChange={(value) => {
                      const updated = [...properties];
                      updated[i].name = value;
                      setProperties(updated);
                    }}
                    placeholder="Search or type to add"
                    emptyMessage="No property names available"
                    onCreateOption={(newProp) => {
                      setPropertyNames(prev => [...prev, newProp]);
                      const updated = [...properties];
                      updated[i].name = newProp;
                      setProperties(updated);
                    }}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                    {prop.name}
                  </div>
                )}
              </div>

              {/* Property Values */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Values</label>

                {showUpdateSkuSection && (
                  <div className="flex">
                    <input
                      value={prop.input}
                      placeholder="Enter value"
                      onChange={e => {
                        const updated = [...properties];
                        updated[i].input = e.target.value;
                        setProperties(updated);
                      }}
                      onKeyDown={e => e.key === "Enter" && addPropertyValue(i)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => addPropertyValue(i)}
                      className="px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-blue-600 hover:text-white transition"
                    >
                      <CornerDownLeft size={16} />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {prop.values.map((val, vi) => (
                    <span
                      key={vi}
                      className="flex items-center gap-1 px-2 py-1 text-blue-700 bg-blue-50 rounded-md text-xs"
                    >
                      {val}
                      {showUpdateSkuSection && (
                        <button
                          onClick={() => removePropertyValue(i, vi)}
                          title="Remove property value"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Delete Button */}
              {showUpdateSkuSection && (
                <button onClick={() => deletePropertyRow(i)} className="mt-6">
                  <Trash2 className="text-red-500 hover:text-red-700" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Property Row Button */}
      {showUpdateSkuSection && (
        <div className="flex justify-center">
          <button
            onClick={addPropertyRow}
            className="h-10 w-10 rounded-full border border-gray-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition"
          >
            <Plus />
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== SKU TABLE SECTION ====================
function SkuTableSection({
  productData,
  setDetailsPopup,
  options,
  pricingMode,
  globalPricing,
  onRefresh
}) {
  const allVariants = productData?.all_variants || [];
  const [showCreateSkuPopup, setShowCreateSkuPopup] = useState(false);

  if (allVariants.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Product SKUs</h3>
          <button
            onClick={() => {
              setShowCreateSkuPopup(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus size={18} />
            Create Product SKU
          </button>
        </div>

        <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
          No SKUs found for this product
        </div>

        {/* Create SKU Popup */}
        {showCreateSkuPopup && (
          <CreateSkuPopup
            onClose={() => setShowCreateSkuPopup(false)}
            options={options}
            productName={productData.name}
            productId={productData.id}
            taxTypeId={productData.tax_type_id}
            existingSkus={allVariants}
            pricingMode={pricingMode}
            globalPricing={globalPricing}
            onSuccess={() => {
              onRefresh?.();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product SKUs</h3>
        <button
          onClick={() => {
            setShowCreateSkuPopup(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Create Product SKU
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left font-medium text-gray-700">SKU Name</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Display Name</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">SKU Code</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">MRP</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Selling Price</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Unit Price</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">UOM</th>
                <th className="px-3 py-3 text-center font-medium text-gray-700">Master</th>
                <th className="px-3 py-3 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allVariants.map((sku, index) => (
                <tr key={sku.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-900">{sku.sku_name}</td>
                  <td className="px-3 py-3 text-gray-900">{sku.display_name}</td>
                  <td className="px-3 py-3 text-gray-600">{sku.sku_code}</td>
                  <td className="px-3 py-3 text-gray-900">₹{parseFloat(sku.mrp).toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-900">₹{parseFloat(sku.selling_price).toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-900">₹{parseFloat(sku.unit_price).toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-600 uppercase">{sku.uom}</td>
                  <td className="px-3 py-3 text-center">
                    {sku.master ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Master
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => {
                        // TODO: Navigate to SKU details page

                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      Details
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create SKU Popup */}
      {showCreateSkuPopup && (
        <CreateSkuPopup
          onClose={() => setShowCreateSkuPopup(false)}
          options={options}
          productName={productData.name}
          productId={productData.id}
          taxTypeId={productData.tax_type_id}
          existingSkus={allVariants}
          pricingMode={pricingMode}
          globalPricing={globalPricing}
          onSuccess={() => {
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}

// ==================== SKU DETAILS POPUP ====================
function SkuDetailsPopup({ sku, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SKU Details</h3>
            <p className="text-sm text-gray-500 mt-0.5">{sku.sku_code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 border-2 p-2 rounded-md hover:text-gray-50 hover:bg-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="SKU Name" value={sku.sku_name} />
                <InfoField label="Display Name" value={sku.display_name} />
                <InfoField label="SKU Code" value={sku.sku_code} />
                <InfoField label="Status" value={
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${sku.status === 'active' ? 'bg-green-100 text-green-800' :
                    sku.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {sku.status}
                  </span>
                } />
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Pricing Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <InfoField label="MRP" value={`₹${parseFloat(sku.mrp).toFixed(2)}`} />
                <InfoField label="Selling Price" value={`₹${parseFloat(sku.selling_price).toFixed(2)}`} />
                <InfoField label="Unit Price" value={`₹${parseFloat(sku.unit_price).toFixed(2)}`} />
                <InfoField label="Conversion Factor" value={sku.conversion_factor} />
                <InfoField label="Multiplication Factor" value={sku.multiplication_factor} />
                <InfoField label="Threshold Quantity" value={sku.threshold_quantity} />
              </div>
            </div>

            {/* Physical Attributes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Physical Attributes</h4>
              <div className="grid grid-cols-3 gap-4">
                <InfoField label="UOM" value={sku.uom?.toUpperCase() || 'N/A'} />
                <InfoField label="Dimension" value={sku.dimension || 'N/A'} />
                <InfoField label="Weight" value={sku.weight ? `${sku.weight} kg` : 'N/A'} />
              </div>
            </div>

            {/* Option Type Values */}
            {sku.option_type_values && sku.option_type_values.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Option Values</h4>
                <div className="flex flex-wrap gap-2">
                  {sku.option_type_values.map((opt, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <div className="text-xs text-gray-500">{opt.option_type.name}</div>
                      <div className="text-sm font-medium text-gray-900">{opt.option_value.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKU Media */}
            {sku.sku_media && sku.sku_media.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Media</h4>
                <div className="grid grid-cols-4 gap-4">
                  {sku.sku_media
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((media, idx) => (
                      <div key={media.id} className="relative">
                        <img
                          src={media.media_url}
                          alt={`SKU Media ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        {media.sequence === 1 && (
                          <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                            Primary
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                          {media.sequence}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Master SKU Badge */}
            {sku.master && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-900">Master SKU</div>
                  <div className="text-xs text-green-700">This is the primary variant for this product</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== HELPER COMPONENT ====================
function InfoField({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

// function CreateSkuPopup({
//   onClose,
//   options: initialOptions = [],
//   productName,
//   productId,
//   existingSkus,
//   pricingMode: initialPricingMode,
//   globalPricing: initialGlobalPricing,
//   onSuccess,
//   taxTypeId
// }) {
//   const [loading, setLoading] = useState(false);
//   const [pricingMode, setPricingMode] = useState(initialPricingMode || "conversion");
//   const [options, setOptions] = useState(initialOptions);
//   const [optionTypes, setOptionTypes] = useState([]);

//   const [globalPricing, setGlobalPricing] = useState({
//     conversion_factor: initialGlobalPricing?.conversion_factor || 1,
//     multiplication_factor: initialGlobalPricing?.multiplication_factor || 1,
//     threshold_quantity: initialGlobalPricing?.threshold_quantity || 1
//   });

//   const [form, setForm] = useState({
//     sku_name: "",
//     display_name: "",
//     sku_code: "",
//     unit_price: "",
//     mrp: "",
//     selling_price: "",
//     uom: "piece",
//     status: "active"
//   });

//   const UOM_OPTIONS = [
//     { id: 'sq_ft', name: 'Sq ft' },
//     { id: 'ml', name: 'Ml' },
//     { id: 'l', name: 'L' },
//     { id: 'gm', name: 'Gm' },
//     { id: 'kg', name: 'Kg' },
//     { id: 'm', name: 'Mm' },
//     { id: 'packet', name: 'Packet' },
//     { id: 'unit', name: 'Unit' },
//     { id: 'piece', name: 'Piece' },
//   ];

//   useEffect(() => {
//     fetchOptionTypes();
//   }, []);

//   async function fetchOptionTypes() {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/option_types?only_names=true`
//       );

//       if (!res.ok) throw new Error("Failed to fetch option types");

//       const result = await res.json();
//       setOptionTypes(result.data || []);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to load option types");
//     }
//   }

//   function updateForm(next) {
//     setForm(prev => ({ ...prev, ...next }));
//   }

//   function updateGlobalPricing(next) {
//     setGlobalPricing(prev => ({ ...prev, ...next }));
//   }

//   function handleMrpChange(value) {
//     const mrpValue = value;
//     const conversionFactor = Number(globalPricing.conversion_factor) || 1;
//     const unitPrice = mrpValue && conversionFactor
//       ? Number((Number(mrpValue) / conversionFactor).toFixed(2))
//       : "";
//     updateForm({ mrp: mrpValue, unit_price: unitPrice });
//   }

//   function handleUnitPriceChange(value) {
//     const unitValue = value;
//     const multiplicationFactor = Number(globalPricing.multiplication_factor) || 1;
//     const calculatedPrice = unitValue && multiplicationFactor
//       ? Number((Number(unitValue) * multiplicationFactor).toFixed(2))
//       : "";
//     updateForm({
//       unit_price: unitValue,
//       mrp: calculatedPrice,
//       selling_price: calculatedPrice
//     });
//   }

//   function handlePricingModeChange(mode) {
//     setPricingMode(mode);

//     if (mode === "conversion" && form.mrp) {
//       handleMrpChange(form.mrp);
//     } else if (mode === "multiplication" && form.unit_price) {
//       handleUnitPriceChange(form.unit_price);
//     }
//   }

//   function handleConversionFactorChange(value) {
//     updateGlobalPricing({ conversion_factor: value });
//     if (pricingMode === "conversion" && form.mrp) {
//       const conversionFactor = Number(value) || 1;
//       const unitPrice = Number((Number(form.mrp) / conversionFactor).toFixed(2));
//       updateForm({ unit_price: unitPrice });
//     }
//   }

//   function handleMultiplicationFactorChange(value) {
//     updateGlobalPricing({ multiplication_factor: value });
//     if (pricingMode === "multiplication" && form.unit_price) {
//       const multiplicationFactor = Number(value) || 1;
//       const calculatedPrice = Number((Number(form.unit_price) * multiplicationFactor).toFixed(2));
//       updateForm({ mrp: calculatedPrice, selling_price: calculatedPrice });
//     }
//   }

//   function addOption() {
//     setOptions([...options, { type: "", values: [], input: "" }]);
//   }

//   function removeOption(optionIndex) {
//     const updatedOptions = options.filter((_, idx) => idx !== optionIndex);
//     setOptions(updatedOptions);
//   }

//   function updateOptionType(optionIndex, type) {
//     const updatedOptions = [...options];
//     updatedOptions[optionIndex].type = type;
//     setOptions(updatedOptions);
//   }

//   function addValueToOption(optionIndex) {
//     const option = options[optionIndex];
//     const value = option.input?.trim();

//     if (!value) {
//       toast.error("Please enter a value");
//       return;
//     }

//     if (!option.type) {
//       toast.error("Please select option type first");
//       return;
//     }

//     if (option.values.includes(value)) {
//       toast.error("Value already exists");
//       return;
//     }

//     const updatedOptions = [...options];
//     updatedOptions[optionIndex].values.push(value);
//     updatedOptions[optionIndex].input = "";
//     setOptions(updatedOptions);
//   }

//   function removeValueFromOption(optionIndex, valueIndex) {
//     const updatedOptions = [...options];
//     updatedOptions[optionIndex].values.splice(valueIndex, 1);
//     setOptions(updatedOptions);
//   }

//   function validateForm() {
//     if (!form.sku_name.trim()) {
//       toast.error("SKU name is required");
//       return false;
//     }

//     if (!form.display_name.trim()) {
//       toast.error("Display name is required");
//       return false;
//     }

//     if (!form.sku_code.trim()) {
//       toast.error("SKU code is required");
//       return false;
//     }

//     if (existingSkus?.some(s => s.sku_name === form.sku_name.trim())) {
//       toast.error("SKU name already exists");
//       return false;
//     }

//     if (existingSkus?.some(s => s.sku_code === form.sku_code.trim())) {
//       toast.error("SKU code already exists");
//       return false;
//     }

//     if (pricingMode === "conversion") {
//       if (!form.mrp || !form.selling_price) {
//         toast.error("MRP and Selling Price are required");
//         return false;
//       }
//     } else {
//       if (!form.unit_price) {
//         toast.error("Unit Price is required");
//         return false;
//       }
//     }

//     if (
//       Number(form.mrp) <= 0 ||
//       Number(form.selling_price) <= 0 ||
//       Number(form.unit_price) <= 0
//     ) {
//       toast.error("Prices must be greater than 0");
//       return false;
//     }

//     return true;
//   }

//   async function handleCreateSku() {
//     if (!validateForm()) return;

//     setLoading(true);

//     try {
//       const payload = {
//         product_id: productId,
//         sku_name: form.sku_name.trim(),
//         display_name: form.display_name.trim(),
//         sku_code: form.sku_code.trim(),
//         unit_price: Number(form.unit_price),
//         mrp: Number(form.mrp),
//         selling_price: Number(form.selling_price),
//         uom: form.uom,
//         status: form.status,
//         is_combo: false,
//         minimum_order_quantity: Number(globalPricing.threshold_quantity) || 1,
//         conversion_factor: Number(globalPricing.conversion_factor) || 1,
//         multiplication_factor: Number(globalPricing.multiplication_factor) || 1,
//         options: options.filter(opt => opt.type && opt.values.length > 0)
//       };

//       if (taxTypeId) {
//         payload.tax_type_id = taxTypeId;
//       }

//       console.log("Create SKU payload:", payload);

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload)
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         let errorMessage = "Failed to create SKU";
//         if (Array.isArray(result?.errors)) {
//           errorMessage = result.errors.join(", ");
//         } else if (typeof result?.errors === "object") {
//           errorMessage = Object.values(result.errors).flat().join(", ");
//         } else if (result?.message) {
//           errorMessage = result.message;
//         }
//         toast.error(errorMessage);
//         return;
//       }

//       toast.success("SKU created successfully");
//       onSuccess?.();
//       onClose();
//     } catch (err) {
//       console.error("Create SKU error:", err);
//       toast.error("An error occurred while creating SKU");
//     } finally {
//       setLoading(false);
//     }
//   }

//   const inputClass = "w-full h-9 px-3 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500";
//   const labelClass = "block text-xs font-medium text-gray-700 mb-1";

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

//         {/* Header */}
//         <div className="flex items-center justify-between px-5 py-4 border-b">
//           <div>
//             <h3 className="text-sm font-semibold text-gray-900">Create Product SKU</h3>
//             <p className="text-xs text-gray-500 mt-0.5">{productName}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 p-1"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-auto p-5 space-y-5">

//           {/* Pricing Mode */}
//           <div className="border border-gray-200 rounded p-4 space-y-3">
//             <h4 className="text-xs font-semibold text-gray-900">Pricing Mode</h4>

//             <div className="flex gap-6">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="pricingMode"
//                   value="conversion"
//                   checked={pricingMode === "conversion"}
//                   onChange={(e) => handlePricingModeChange(e.target.value)}
//                   className="w-4 h-4"
//                 />
//                 <span className="text-xs text-gray-700">Conversion Factor (MRP → Unit Price)</span>
//               </label>

//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="pricingMode"
//                   value="multiplication"
//                   checked={pricingMode === "multiplication"}
//                   onChange={(e) => handlePricingModeChange(e.target.value)}
//                   className="w-4 h-4"
//                 />
//                 <span className="text-xs text-gray-700">Multiplication Factor (Unit Price → MRP)</span>
//               </label>
//             </div>

//             <div className="grid grid-cols-3 gap-3">
//               {pricingMode === "conversion" && (
//                 <div>
//                   <label className={labelClass}>Conversion Factor</label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     className={inputClass}
//                     value={globalPricing.conversion_factor}
//                     onChange={(e) => handleConversionFactorChange(e.target.value)}
//                   />
//                 </div>
//               )}

//               {pricingMode === "multiplication" && (
//                 <div>
//                   <label className={labelClass}>Multiplication Factor</label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     className={inputClass}
//                     value={globalPricing.multiplication_factor}
//                     onChange={(e) => handleMultiplicationFactorChange(e.target.value)}
//                   />
//                 </div>
//               )}

//               <div>
//                 <label className={labelClass}>Threshold Quantity</label>
//                 <input
//                   type="number"
//                   min="1"
//                   className={inputClass}
//                   value={globalPricing.threshold_quantity}
//                   onChange={(e) => updateGlobalPricing({ threshold_quantity: e.target.value })}
//                 />
//               </div>

//               <div>
//                 <label className={labelClass}>UOM</label>
//                 <select
//                   className={inputClass}
//                   value={form.uom}
//                   onChange={(e) => updateForm({ uom: e.target.value })}
//                 >
//                   {UOM_OPTIONS.map(opt => (
//                     <option key={opt.id} value={opt.id}>{opt.name}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="bg-blue-50 border border-blue-200 rounded p-2">
//               <p className="text-xs text-blue-800">
//                 <strong>{pricingMode === "conversion" ? "Conversion Mode:" : "Multiplication Mode:"}</strong>
//                 {" "}
//                 {pricingMode === "conversion" 
//                   ? "In SKU table, enter MRP → Unit Price will be auto-calculated as MRP ÷ Conversion Factor"
//                   : "In SKU table, enter Unit Price → MRP & Selling Price will be auto-calculated as Unit Price × Multiplication Factor"
//                 }
//               </p>
//             </div>
//           </div>

//           {/* SKU Information */}
//           <div className="border border-gray-200 rounded p-4 space-y-3">
//             <h4 className="text-xs font-semibold text-gray-900">SKU Information</h4>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <label className={labelClass}>SKU Name *</label>
//                 <input
//                   className={inputClass}
//                   value={form.sku_name}
//                   onChange={(e) => updateForm({ sku_name: e.target.value })}
//                   placeholder="Enter SKU name"
//                 />
//               </div>

//               <div>
//                 <label className={labelClass}>Display Name *</label>
//                 <input
//                   className={inputClass}
//                   value={form.display_name}
//                   onChange={(e) => updateForm({ display_name: e.target.value })}
//                   placeholder="Enter display name"
//                 />
//               </div>

//               <div>
//                 <label className={labelClass}>SKU Code *</label>
//                 <input
//                   className={inputClass}
//                   value={form.sku_code}
//                   onChange={(e) => updateForm({ sku_code: e.target.value })}
//                   placeholder="Enter SKU code"
//                 />
//               </div>

//               <div>
//                 <label className={labelClass}>Status</label>
//                 <select
//                   className={inputClass}
//                   value={form.status}
//                   onChange={(e) => updateForm({ status: e.target.value })}
//                 >
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                   <option value="deleted">Deleted</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Pricing Details */}
//           <div className="border border-gray-200 rounded p-4 space-y-3">
//             <h4 className="text-xs font-semibold text-gray-900">Pricing Details</h4>

//             <div className="grid grid-cols-3 gap-3">
//               {pricingMode === "conversion" ? (
//                 <>
//                   <div>
//                     <label className={labelClass}>MRP *</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       className={inputClass}
//                       value={form.mrp}
//                       onChange={(e) => handleMrpChange(e.target.value)}
//                       placeholder="0.00"
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Unit Price (Auto)</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       className={`${inputClass} bg-blue-50`}
//                       value={form.unit_price}
//                       onChange={(e) => updateForm({ unit_price: e.target.value })}
//                       placeholder="0.00"
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Selling Price *</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       className={inputClass}
//                       value={form.selling_price}
//                       onChange={(e) => updateForm({ selling_price: e.target.value })}
//                       placeholder="0.00"
//                     />
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <div>
//                     <label className={labelClass}>Unit Price *</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       className={inputClass}
//                       value={form.unit_price}
//                       onChange={(e) => handleUnitPriceChange(e.target.value)}
//                       placeholder="0.00"
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>MRP (Auto)</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       className={`${inputClass} bg-blue-50`}
//                       value={form.mrp}
//                       onChange={(e) => updateForm({ mrp: e.target.value })}
//                       placeholder="0.00"
//                     />
//                   </div>

//                   <div>
//                     <label className={labelClass}>Selling Price (Auto)</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       className={`${inputClass} bg-blue-50`}
//                       value={form.selling_price}
//                       onChange={(e) => updateForm({ selling_price: e.target.value })}
//                       placeholder="0.00"
//                     />
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>

//           {/* Option Values */}
//           <div className="border border-gray-200 rounded p-4 space-y-3">
//             <h4 className="text-xs font-semibold text-gray-900">Option Values</h4>

//             <div className="space-y-3">
//               {options.map((opt, i) => (
//                 <OptionRow
//                   key={i}
//                   option={opt}
//                   optionTypes={optionTypes}
//                   selectedTypes={options.map((o, idx) => idx !== i ? o.type : null).filter(Boolean)}
//                   onTypeChange={(type) => updateOptionType(i, type)}
//                   onAddValue={() => addValueToOption(i)}
//                   onRemoveValue={(valueIndex) => removeValueFromOption(i, valueIndex)}
//                   onRemoveOption={() => removeOption(i)}
//                   onInputChange={(value) => {
//                     const updatedOptions = [...options];
//                     updatedOptions[i].input = value;
//                     setOptions(updatedOptions);
//                   }}
//                 />
//               ))}
//             </div>

//             <div className="flex justify-center pt-2">
//               <button
//                 onClick={addOption}
//                 className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
//               >
//                 <Plus size={16} className="text-gray-600" />
//               </button>
//             </div>
//           </div>

//         </div>

//         {/* Footer */}
//         <div className="border-t px-5 py-3 flex gap-2 bg-gray-50">
//           <button
//             onClick={onClose}
//             className="flex-1 px-4 py-2 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleCreateSku}
//             disabled={loading}
//             className="flex-1 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Creating...' : 'Create SKU'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

function OptionRow({
  option,
  optionTypes,
  selectedTypes,
  onTypeChange,
  onAddValue,
  onRemoveValue,
  onRemoveOption,
  onInputChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableOptions = optionTypes
    .filter(opt => !selectedTypes.includes(opt.name))
    .filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const inputClass = "w-full h-9 px-3 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500";

  return (
    <div className="border border-gray-200 rounded p-3">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-3 items-start">

        {/* Property Name Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-9 px-3 text-xs border border-gray-300 rounded flex items-center justify-between hover:border-gray-400 transition-colors text-left"
          >
            <span className={option.type ? "text-gray-900" : "text-gray-400"}>
              {option.type || "Search or type to add"}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-auto">
              <div className="p-2 border-b sticky top-0 bg-white">
                <input
                  type="text"
                  className="w-full h-8 px-2 text-xs border border-gray-300 rounded"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="max-h-40 overflow-y-auto">
                {availableOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => {
                      onTypeChange(opt.name);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 transition-colors"
                  >
                    {opt.name}
                  </button>
                ))}

                {searchTerm && !availableOptions.some(opt => opt.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <button
                    onClick={() => {
                      onTypeChange(searchTerm);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 transition-colors text-blue-600"
                  >
                    Create "{searchTerm}"
                  </button>
                )}

                {availableOptions.length === 0 && !searchTerm && (
                  <div className="px-3 py-2 text-xs text-gray-500">No options available</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Values Section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={option.input || ""}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddValue()}
              placeholder="Enter value"
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={onAddValue}
              className="h-9 px-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={14} className="text-gray-600" />
            </button>
          </div>

          {option.values.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {option.values.map((val, vi) => (
                <span
                  key={vi}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                >
                  {val}
                  <button
                    onClick={() => onRemoveValue(vi)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={onRemoveOption}
          className="h-9 w-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

