"use client";
import { useEffect, useState, useRef } from "react";
import {
  Trash2,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import CreateSkuPopup from "./CreateSkuPopup";
import SkuDetailsPopup from "./SkuDetailsPopup";
import { useConfirm } from "../../../../../../components/hooks/context/ConfirmContext";
import { toast } from "react-toastify";

export default function ProductUpdationAttributes({
  productId,
  formData,
  products,
  setProducts,
  pricingMode,
  globalPricing,
  isEditing,
  onPropertiesChange,
  onContentsChange,
  onMediaChange
}) {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [showUpdateSkuSection, setShowUpdateSkuSection] = useState(false);
  const [skuDetailsPopup, setSkuDetailsPopup] = useState(null);
  const [properties, setProperties] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const options = properties.map((prop) => ({
    type: prop.name,
    values: prop.values || []
  }));

  // Contents state
  const [contents, setContents] = useState([]);
  const [hasContentsChanges, setHasContentsChanges] = useState(false);

  const [skuForSkuDetailsPopup, setSkuForSkuDetailsPopup] = useState(null);

  const confirm = useConfirm();

  // Add useEffect to notify parent of changes
  useEffect(() => {
    if (onPropertiesChange) {
      onPropertiesChange(properties);
    }
  }, [properties]);

  useEffect(() => {
    if (onContentsChange) {
      onContentsChange(contents);
    }
  }, [contents]);

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
    <div className="w-full mx-auto">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm shadow-gray-200/60 p-4 space-y-2">
            {/* Option Types Section */}
            <PropertyTypesSection
              productData={productData}
              showUpdateSkuSection={showUpdateSkuSection}
              setShowUpdateSkuSection={setShowUpdateSkuSection}
              properties={properties}
              setProperties={setProperties}
              hasChanges={hasChanges}
              setHasChanges={setHasChanges}
              isEditing={isEditing}
            />
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm shadow-gray-200/60 p-4 space-y-2">
            {/* Product Contents Section */}
            <ProductContentsSection
              productData={productData}
              contents={contents}
              setContents={setContents}
              hasChanges={hasContentsChanges}
              setHasChanges={setHasContentsChanges}
              isEditing={isEditing}
            />
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm shadow-gray-200/60 p-4 space-y-2">
            <ProductMediaSection
              productData={productData}
              isEditing={isEditing}
              onMediaChange={onMediaChange}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm shadow-gray-200/60 p-4 space-y-2">
        {/* SKU Table Section */}
        <SkuTableSection
          productData={productData}
          setSkuDetailsPopup={setSkuDetailsPopup}
          options={options}
          pricingMode={pricingMode}
          globalPricing={globalPricing}
          onRefresh={fetchProductDetails}
          isEditing={isEditing}
          setSkuForSkuDetailsPopup={setSkuForSkuDetailsPopup}
        />

        {/* Details Popup */}
        {skuDetailsPopup && (
          <SkuDetailsPopup
            sku={skuForSkuDetailsPopup}
            onClose={() => setSkuDetailsPopup(null)}
            onSuccess={fetchProductDetails}
          />
        )}
      </div>
    </div>
  );
}

// ==================== PROPERTY TYPES SECTION ====================
function PropertyTypesSection({
  productData,
  properties,
  setProperties,
  hasChanges,
  setHasChanges,
  isEditing // prop to control edit mode
}) {

  const [propertyNames, setPropertyNames] = useState([]);
  const [originalProperties, setOriginalProperties] = useState([]);

  useEffect(() => {
    extractPropertiesFromProduct();
    fetchPropertyNames();
  }, [productData]);

  function extractPropertiesFromProduct() {
    if (!productData?.product_properties) {
      setProperties([]);
      setOriginalProperties([]);
      return;
    }

    // Create a map to consolidate properties 
    const propertiesMap = {};

    productData.product_properties.forEach(prop => {
      const propertyName = prop.property_type.name;
      const propertyValue = prop.property_value.name;

      if (!propertiesMap[propertyName]) {
        propertiesMap[propertyName] = {
          property_id: prop.property_type.id,
          value_id: prop.property_value.id,
          original_value_id: prop.property_value.id,
          name: propertyName,
          value: propertyValue,
          isExisting: true,
          isValueChanged: false
        };
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
    setProperties(p => [
      ...p,
      {
        name: "",
        value: "",
        isExisting: false,
        isValueChanged: true
      }
    ]);
  };


  const deletePropertyRow = async (index) => {
    const propertyToRemove = properties[index];

    // Confirm if removing an existing property
    if (propertyToRemove.isExisting && propertyToRemove.value) {
      const ok = await confirm(
        `Removing "${propertyToRemove.name}: ${propertyToRemove.value}" Are you sure you want to remove this ?`
      );
      if (!ok) return;
    }

    setProperties(p => p.filter((_, i) => i !== index));
  };

  const updatePropertyName = (index, name) => {
    const updated = [...properties];
    updated[index].name = name;
    setProperties(updated);
  };

  const updatePropertyValue = (index, value) => {
    const updated = [...properties];

    updated[index].value = value;
    if (updated[index].isExisting) {
      updated[index].isValueChanged =
        value !== updated[index].value;
    }

    setProperties(updated);
  };


  const createNewPropertyName = (newPropertyName) => {
    setPropertyNames(prev => [...prev, newPropertyName]);
  };

  // Get selected property names (except current row)
  const getSelectedNames = (currentIndex) => {
    return properties
      .map((p, idx) => idx !== currentIndex ? p.name : null)
      .filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product Properties</h3>
      </div>

      {/* Properties Display/Edit */}
      <div className="space-y-4">
        {properties.length === 0 && !isEditing ? (
          <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-lg">
            No properties added yet
          </div>
        ) : (
          properties.map((prop, i) => (
            <PropertyRow
              key={i}
              property={prop}
              propertyNames={propertyNames}
              selectedNames={getSelectedNames(i)}
              onNameChange={(name) => updatePropertyName(i, name)}
              onValueChange={(value) => updatePropertyValue(i, value)}
              onRemoveProperty={() => deletePropertyRow(i)}
              onCreateNewProperty={createNewPropertyName}
              isEditing={isEditing}
              isExisting={prop.isExisting} // Existing properties cannot change name
            />
          ))
        )}
      </div>

      {/* Add Property Row Button */}
      {isEditing && (
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

function PropertyRow({
  property,
  propertyNames,
  selectedNames,
  onNameChange,
  onValueChange,
  onRemoveProperty,
  onCreateNewProperty,
  isEditing,
  isExisting // If true, property type cannot be changed
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

  // Filter available property names
  const availableNames = propertyNames
    .filter(name => !selectedNames.includes(name))
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Check if search term matches exactly with an existing property
  const exactMatch = propertyNames.some(
    name => name.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="grid grid-cols-[1.2fr_2fr_auto] gap-3 items-start">

        {/* Property Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Property Name</label>

          {isEditing && !isExisting ? (
            // Editable dropdown for new properties
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md flex items-center justify-between hover:border-gray-400 transition-colors text-left bg-white"
              >
                <span className={property.name ? "text-gray-900" : "text-gray-400"}>
                  {property.name || "Search or type to add"}
                </span>
                <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              </button>

              {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
                  {/* Search Input */}
                  <div className="p-2 border-b sticky top-0 bg-white">
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                      placeholder="Search or type to create..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Options List */}
                  <div className="overflow-y-auto flex-1">
                    {availableNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          onNameChange(name);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors text-gray-900"
                      >
                        {name}
                      </button>
                    ))}

                    {/* Create New Property Button */}
                    {searchTerm && !exactMatch && (
                      <button
                        onClick={() => {
                          if (onCreateNewProperty) {
                            onCreateNewProperty(searchTerm);
                          }
                          onNameChange(searchTerm);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className="w-full px-3 py-2 text-sm text-left bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-medium border-t"
                      >
                        + Create "{searchTerm}"
                      </button>
                    )}

                    {/* Empty State */}
                    {availableNames.length === 0 && !searchTerm && (
                      <div className="px-3 py-6 text-sm text-gray-500 text-center">
                        No property names available
                      </div>
                    )}

                    {/* No Results */}
                    {availableNames.length === 0 && searchTerm && exactMatch && (
                      <div className="px-3 py-6 text-sm text-gray-500 text-center">
                        No matching properties
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Read-only display for existing properties or when not editing
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
              {property.name || "—"}
            </div>
          )}
        </div>

        {/* Property Value */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Value</label>

          {isEditing ? (
            <input
              value={property.value || ""}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Enter value"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
              {property.value || "—"}
            </div>
          )}
        </div>

        {/* Delete Button */}
        {isEditing && (
          <button onClick={onRemoveProperty} className="mt-6">
            <Trash2 className="text-red-500 hover:text-red-700" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// SKU TABLE SECTION 
function SkuTableSection({
  productData,
  setSkuDetailsPopup,
  options,
  pricingMode,
  globalPricing,
  onRefresh,
  isEditing,
  setSkuForSkuDetailsPopup
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
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 hover:scale-102 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
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
                  <td className="px-3 py-3 text-gray-900">
                    <div className="w-[200px] truncate" title={sku.sku_name} >
                      {sku.sku_name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-900">
                    <div className="w-[200px] truncate" title={sku.display_name}>
                      {sku.display_name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="w-[140px] truncate" title={sku.sku_code}>
                      {sku.sku_code}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-900">₹{parseFloat(sku.mrp)}</td>
                  <td className="px-3 py-3 text-gray-900">₹{parseFloat(sku.selling_price)}</td>
                  <td className="px-3 py-3 text-gray-900">₹{parseFloat(sku.unit_price)}</td>
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
                        setSkuForSkuDetailsPopup(sku);
                        setSkuDetailsPopup(true);
                      }}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/80 text-white text-xs font-medium rounded cursor-pointer hover:scale-105 transition-colors"
                    >
                      Details
                      <ExternalLink className="w-4 h-4" />
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


function ProductContentsSection({
  productData,
  contents,
  setContents,
  hasChanges,
  setHasChanges,
  isEditing
}) {
  const [originalContents, setOriginalContents] = useState([]);

  useEffect(() => {
    extractContentsFromProduct();
  }, [productData]);

  function extractContentsFromProduct() {
    if (!productData?.product_contents || productData.product_contents.length === 0) {
      setContents([]);
      setOriginalContents([]);
      return;
    }

    // Map existing contents with their IDs
    const extractedContents = productData.product_contents.map(content => ({
      id: content.id,
      content_type: content.name,
      content_value: content.value,
      isExisting: true
    }));

    setContents(extractedContents);
    setOriginalContents(JSON.parse(JSON.stringify(extractedContents))); // Deep copy
  }

  useEffect(() => {
    // Check if contents have changed
    const changed = JSON.stringify(contents) !== JSON.stringify(originalContents);
    setHasChanges(changed);
  }, [contents, originalContents]);

  const addContentRow = () => {
    setContents(prev => [...prev, { content_type: "", content_value: "", isExisting: false }]);
  };

  const deleteContentRow = async (index) => {
    const contentToRemove = contents[index];

    // Confirm if removing an existing content
    if (contentToRemove.isExisting && contentToRemove.content_value) {
      const ok = await confirm(
        `Removing "${contentToRemove.content_type}: ${contentToRemove.content_value}" Are sure you want to remove this ?`
      );
      if (!ok) return;
    }

    setContents(prev => prev.filter((_, i) => i !== index));
  };

  const updateContentType = (index, type) => {
    const updated = [...contents];
    updated[index].content_type = type;
    setContents(updated);
  };

  const updateContentValue = (index, value) => {
    const updated = [...contents];
    updated[index].content_value = value;
    setContents(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Product Content</h3>
      </div>

      {/* Contents Display/Edit */}
      <div className="space-y-4">
        {contents.length === 0 && !isEditing ? (
          <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-lg">
            No content added yet
          </div>
        ) : (
          contents.map((content, i) => (
            <ContentRow
              key={i}
              content={content}
              onTypeChange={(type) => updateContentType(i, type)}
              onValueChange={(value) => updateContentValue(i, value)}
              onRemoveContent={() => deleteContentRow(i)}
              isEditing={isEditing}
              isExisting={content.isExisting}
            />
          ))
        )}
      </div>

      {/* Add Content Row Button */}
      {isEditing && (
        <div className="flex justify-center">
          <button
            onClick={addContentRow}
            className="h-10 w-10 rounded-full border border-gray-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition"
          >
            <Plus />
          </button>
        </div>
      )}
    </div>
  );
}

function ContentRow({
  content,
  onTypeChange,
  onValueChange,
  onRemoveContent,
  isEditing,
  isExisting // If true, content type cannot be changed
}) {

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
      <div className="grid grid-cols-[1.2fr_2fr_auto] gap-3 items-center">

        {/* Content Type */}
        <div>
          {isEditing && !isExisting ? (
            // Editable text input for new content
            <input
              value={content.content_type || ""}
              onChange={(e) => onTypeChange(e.target.value)}
              placeholder="Enter content type"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 bg-white"
            />
          ) : (
            // Read-only display for existing content or when not editing
            <input
              value={content.content_type || ""}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 cursor-not-allowed"
            />
          )}
        </div>

        {/* Content Value */}
        <div>
          {isEditing ? (
            <input
              value={content.content_value || ""}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Enter value"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500 bg-white"
            />
          ) : (
            <input
              value={content.content_value || ""}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 cursor-not-allowed"
            />
          )}
        </div>

        {/* Delete Button */}
        {isEditing && (
          <button onClick={onRemoveContent} className="">
            <Trash2 className="text-red-500 hover:text-red-700" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}


function ProductMediaSection({ productData, isEditing, onMediaChange }) {
  const [productMedia, setProductMedia] = useState(
    productData?.product_medias || []
  );
  const [uploading, setUploading] = useState(false);
  const [mediaPopup, setMediaPopup] = useState(false);

  useEffect(() => {
    if (onMediaChange) {
      onMediaChange(productMedia);
    }
  }, [productMedia]);

  // Upload media to S3
  const handleMediaUpload = async (files) => {
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("media_for", "product");

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
        productMedia.length > 0
          ? Math.max(...productMedia.map((m) => m.sequence))
          : 0;

      // Add new media with proper sequence
      const newMedia = files.map((file, idx) => ({
        id: Date.now() + idx, // Temporary ID for new uploads
        media_url: uploadedUrls[idx],
        media_type: "image",
        active: true,
        sequence: maxSequence + idx + 1,
        isNew: true, // Flag to identify new uploads
      }));

      // If this is the first upload, set sequence to 1 (primary)
      if (productMedia.length === 0 && newMedia.length > 0) {
        newMedia[0].sequence = 1;
      }

      setProductMedia((prev) => [...prev, ...newMedia]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  // Set image as primary
  const setPrimary = (id) => {
    setProductMedia((prev) => {
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
    const mediaToRemove = productMedia.find((m) => m.id === id);

    if (mediaToRemove?.sequence === 1) {
      toast.error("Cannot remove primary image");
      return;
    }

    const confirmed = await confirm(
      "Are you sure you want to remove this image?"
    );
    if (!confirmed) return;

    setProductMedia((prev) => {
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

  const sortedMedia = [...productMedia].sort((a, b) => a.sequence - b.sequence);
  const primary = sortedMedia.find((m) => m.sequence === 1);
  const otherImages = sortedMedia.filter((m) => m.sequence !== 1);
  const visibleOthers = otherImages.slice(0, 3);
  const hiddenCount = otherImages.length - 3;

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Media</h3>

        {productMedia.length === 0 && !isEditing ? (
          // Empty state - non-editing mode
          <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
            No media uploaded yet
          </div>
        ) : productMedia.length === 0 && isEditing ? (
          // Empty state - editing mode with upload
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <label className="cursor-pointer block text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload images
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG up to 10MB each
              </p>
              {uploading && (
                <p className="text-sm text-blue-600 mt-2">Uploading...</p>
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
          </div>
        ) : (
          // Images display
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3 flex-wrap">
              {/* PRIMARY IMAGE - Larger */}
              {primary && (
                <div className="relative group">
                  <div className="w-56 h-48 rounded-lg overflow-hidden border-2 border-blue-500">
                    <img
                      src={primary.media_url}
                      className="w-full h-full object-cover"
                      alt="Primary"
                    />
                  </div>
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
                    Primary
                  </span>

                  {/* Hover overlay - only in editing mode */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        Primary Image
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* OTHER IMAGES - Smaller (show first 3) */}
              {visibleOthers.map((media) => (
                <div key={media.id} className="relative group">
                  <div className="w-56 h-48 rounded-lg overflow-hidden border border-gray-300">
                    <img
                      src={media.media_url}
                      className="w-full h-full object-cover"
                      alt={`Media ${media.sequence}`}
                    />
                  </div>

                  {/* Hover overlay - only in editing mode */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={() => setPrimary(media.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                      >
                        Primary
                      </button>
                      <button
                        onClick={() => removeMedia(media.id)}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* VIEW MORE BUTTON */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setMediaPopup(true)}
                  className="w-32 h-32 border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition cursor-pointer"
                >
                  <ImageIcon className="h-8 w-8 text-gray-600 mb-1" />
                  <span className="text-lg font-semibold text-gray-900">
                    +{hiddenCount}
                  </span>
                  <span className="text-xs text-gray-500">View</span>
                </button>
              )}

              {/* ADD MORE BUTTON - only in editing mode */}
              {isEditing && (
                <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition cursor-pointer">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-1"></div>
                      <span className="text-xs text-gray-600">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600">Add</span>
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
            </div>

            {/* Add More Images button below - only in editing mode and if images exist */}
            {/* {isEditing && productMedia.length >= 4 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-sm font-medium">
                  <Upload size={16} />
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
              </div>
            )} */}
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Product Media</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {media.map((m) => (
              <div key={m.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={m.media_url}
                    className="w-full h-full object-cover"
                    alt={`Media ${m.sequence}`}
                  />
                </div>

                {/* Sequence Badge */}
                <div className="absolute top-2 left-2">
                  {m.sequence === 1 ? (
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
                      Primary
                    </span>
                  ) : (
                    <span className="bg-gray-800/80 text-white px-2 py-1 rounded text-xs font-medium">
                      {m.sequence}
                    </span>
                  )}
                </div>

                {/* Hover Overlay - only in editing mode and not for primary */}
                {isEditing && m.sequence !== 1 && (
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                    <button
                      onClick={() => onSetPrimary(m.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium"
                    >
                      Set as Primary
                    </button>
                    <button
                      onClick={() => onRemove(m.id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
          {isEditing && (
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-sm font-medium">
              <Upload size={16} />
              Add More Images
              {uploading && <span className="ml-1">(Uploading...)</span>}
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
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


