"use client";
import { useEffect, useState } from "react";
import {
  Trash2,
  Plus,
  X,
  CornerDownLeft,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";

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

function CreateSkuPopup({
  onClose,
  options,
  productName,
  productId,
  existingSkus,
  pricingMode,
  globalPricing,
  onSuccess,
  taxTypeId
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sku_name: "",
    display_name: "",
    sku_code: "",
    unit_price: "",
    mrp: "",
    selling_price: "",
    uom: "piece",
    status: "active"
  });

  const safeGlobalPricing = {
    conversion_factor: globalPricing?.conversion_factor ?? 1,
    multiplication_factor: globalPricing?.multiplication_factor ?? 1,
    threshold_quantity: globalPricing?.threshold_quantity ?? 1
  };

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

  function updateForm(next) {
    setForm(prev => ({ ...prev, ...next }));
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

    if (pricingMode === "conversion") {
      if (!form.mrp || !form.selling_price) {
        toast.error("MRP and Selling Price are required");
        return false;
      }
    } else {
      if (!form.unit_price) {
        toast.error("Unit Price is required");
        return false;
      }
    }

    if (
      Number(form.mrp) <= 0 ||
      Number(form.selling_price) <= 0 ||
      Number(form.unit_price) <= 0
    ) {
      toast.error("Prices must be greater than 0");
      return false;
    }

    return true;
  }

  async function handleCreateSku() {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        product_id: productId,
        sku_name: form.sku_name.trim(),
        display_name: form.display_name.trim(),
        sku_code: form.sku_code.trim(),
        unit_price: Number(form.unit_price),
        mrp: Number(form.mrp),
        selling_price: Number(form.selling_price),
        uom: form.uom,
        status: form.status,
        is_combo: false,
        minimum_order_quantity: Number(safeGlobalPricing.threshold_quantity) || 1,
        conversion_factor: Number(safeGlobalPricing.conversion_factor) || 1,
        multiplication_factor: Number(safeGlobalPricing.multiplication_factor) || 1
      };

      if (taxTypeId) {
        payload.tax_type_id = taxTypeId;
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
      toast.error("An error occurred while creating SKU");
    } finally {
      setLoading(false);
    }
  }

  const inputCell = "w-full h-9 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create Product SKU</h3>
            <p className="text-sm text-gray-500 mt-0.5">Add a new SKU for this product</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 border-2 p-2 rounded-md hover:text-gray-50 hover:bg-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Option Values Display */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="text-xs font-semibold text-blue-900 mb-2">Current Option Values:</div>
          <div className="flex flex-wrap gap-2">
            {options.map((opt, idx) => (
              <div key={idx} className="bg-white border border-blue-200 rounded-lg px-3 py-1.5">
                <div className="text-xs text-blue-600 font-medium">{opt.type}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {opt.values.map((val, vi) => (
                    <span key={vi} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {options.length === 0 && (
              <div className="text-sm text-blue-700">No option values available</div>
            )}
          </div>
        </div>

        {/* SKU Form */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">SKU Name</label>
              <input
                className={inputCell}
                value={form.sku_name}
                onChange={(e) => updateForm({ sku_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Display Name</label>
              <input
                className={inputCell}
                value={form.display_name}
                onChange={(e) => {
                  updateForm({ display_name: e.target.value });
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">SKU Code</label>
              <input
                className={inputCell}
                value={form.sku_code}
                onChange={(e) => updateForm({ sku_code: e.target.value })}
              />
            </div>

            {pricingMode === "conversion" ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600">MRP</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCell}
                    value={form.mrp}
                    onChange={(e) => {
                      const mrpValue = e.target.value;
                      const unitPrice = mrpValue && safeGlobalPricing.conversion_factor
                        ? Number((Number(mrpValue) / safeGlobalPricing.conversion_factor).toFixed(2))
                        : "";
                      updateForm({ mrp: mrpValue, unit_price: unitPrice });
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    className={`${inputCell} bg-gray-100`}
                    value={form.unit_price}
                    readOnly
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCell}
                    value={form.selling_price}
                    onChange={(e) => updateForm({ selling_price: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCell}
                    value={form.unit_price}
                    onChange={(e) => {
                      const unitValue = e.target.value;
                      const calculatedPrice = unitValue && safeGlobalPricing.multiplication_factor
                        ? Number((Number(unitValue) * safeGlobalPricing.multiplication_factor).toFixed(2))
                        : "";
                      updateForm({
                        unit_price: unitValue,
                        mrp: calculatedPrice,
                        selling_price: calculatedPrice
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">MRP</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCell}
                    value={form.mrp}
                    readOnly
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCell}
                    value={form.selling_price}
                    readOnly
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600">UOM</label>
              <input
                className={inputCell}
                list="uom-options"
                value={form.uom}
                onChange={(e) => updateForm({ uom: e.target.value })}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  const match = UOM_OPTIONS.find(
                    opt => opt.name.toLowerCase() === val.toLowerCase()
                  );
                  if (match) {
                    updateForm({ uom: match.id });
                  }
                }}
                placeholder="Search UOM"
              />
              <datalist id="uom-options">
                {UOM_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id} label={opt.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={form.status}
                onChange={(e) => updateForm({ status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSku}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save SKU'}
          </button>
        </div>
      </div>
    </div>
  );
}
