"use client";
import { useEffect, useState } from "react";
import {
  Trash2,
  Plus,
  X,
  CornerDownLeft,
  Upload,
  Image
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";

/* ================= DUMMY OPTIONS ================= */

const PROPERTY_NAME_OPTIONS = [
  "Size",
  "Material",
  "Finish",
  "Grade",
  "Color"
];

const OPTION_TYPE_OPTIONS = [
  "Thickness",
  "Length",
  "Width",
  "Weight"
];


function cartesian(arrays) {
  return arrays.reduce(
    (acc, curr) =>
      acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}


function generateProducts(baseName, properties) {
  if (!baseName) return [];

  const validProps = properties.filter(
    p => p.name && p.values.length > 0
  );

  if (!validProps.length) return [];

  const propValues = validProps.map(p =>
    p.values.map(v => v)
  );

  const combinations = cartesian(propValues);

  return combinations.map((combo, idx) => ({
    id: idx + 1,
    name: `${baseName} ${combo.join(" ")}`.trim(),
    properties: validProps.map((p, i) => ({
      name: p.name,
      value: combo[i]
    })),
    skuCount: 0
  }));
}

function generateSkus(productName, options) {
  const validOpts = options.filter(
    o => o.type && o.values.length > 0
  );

  if (!validOpts.length) return [];

  const optValues = validOpts.map(o => o.values);

  const combinations = cartesian(optValues);

  return combinations.map((combo) => ({
    sku_name: `${productName} ${combo.join(" ")}`.trim(),
    option_type_values: validOpts.map((o, i) => ({
      option_type: o.type.toLowerCase(),
      option_value: combo[i]
    }))
  }));
}

export default function ProductAttributes({
  formData,
  products,
  setProducts,
  generatedProducts,
  setGeneratedProducts,
  uploadMediaFiles,
  isCreateNew,
  pricingMode,
  globalPricing
}) {

  const [properties, setProperties] = useState([
    { name: "", values: [], input: "" }
  ]);

  const [options, setOptions] = useState([
    { type: "", values: [], input: "" }
  ]);

  const [productMedia, setProductMedia] = useState([]);

  /*
  productMedia = [
    {
      id,
      file,          // File (before upload)
      previewUrl,    // URL.createObjectURL
      uploadedUrl,   // S3 URL (after upload)
      sequence,      // 1 = primary
      active: true
    }
  ]
  */

  const [productContents, setProductContents] = useState([
    { content_type: "", content_value: "" }
  ]);

  //  THIS useEffect to disable property/option editing in edit mode
  useEffect(() => {
    if (!isCreateNew && generatedProducts.length > 0) {
      // Extract unique properties from generatedProducts
      const allProps = {};
      generatedProducts.forEach(gp => {
        (gp.properties || []).forEach(prop => {
          if (!allProps[prop.name]) {
            allProps[prop.name] = { name: prop.name, values: [], input: "" };
          }
          if (!allProps[prop.name].values.includes(prop.value)) {
            allProps[prop.name].values.push(prop.value);
          }
        });
      });

      const propsArray = Object.values(allProps);
      if (propsArray.length > 0) {
        setProperties(propsArray);
      }

      // Extract unique options from products
      const allOpts = {};
      products.forEach(p => {
        (p.product_skus || []).forEach(sku => {
          (sku.option_type_values || []).forEach(opt => {
            if (!allOpts[opt.option_type]) {
              allOpts[opt.option_type] = { type: opt.option_type, values: [], input: "" };
            }
            if (!allOpts[opt.option_type].values.includes(opt.option_value)) {
              allOpts[opt.option_type].values.push(opt.option_value);
            }
          });
        });
      });

      const optsArray = Object.values(allOpts);
      if (optsArray.length > 0) {
        setOptions(optsArray);
      }
    }
  }, [isCreateNew, generatedProducts, products]);

  // Tailwind classes
  const tableWrapper = "overflow-x-auto border border-gray-200 rounded-lg";
  const tableBase = "w-full border-collapse text-sm";
  const thBase = "bg-gray-50 border-b border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-700";
  const tdBase = "border-b border-gray-200 px-2 py-2";
  const inputCell =
    "w-full h-9 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
  const inputCellSmall =
    "w-full h-9 px-2 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  const [mediaPopup, setMediaPopup] = useState(null);

  const [propertyNames, setPropertyNames] = useState([]);
  const [optionTypes, setOptionTypes] = useState([]);

  useEffect(() => {
    fetchPropertyNames();
    fetchOptionTypes();
  }, []);

  async function fetchPropertyNames() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/get_property_names`);
      if (!response.ok) throw new Error("Failed to fetch property names");
      const result = await response.json();
      setPropertyNames(result.data);
    } catch (err) {
      console.log(err);
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

  const handleRemoveMedia = (productId, skuIndex, mediaId) => {
    setProducts(prev => {
      return prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            skus: product.skus.map((sku, i) => {
              if (i === skuIndex) {
                return {
                  ...sku,
                  media: sku.media.filter(m => m.id !== mediaId)
                };
              }
              return sku;
            })
          };
        }
        return product;
      });
    });
  };

  const handleCopyToAll = (productId, field, value) => {
    setGeneratedSkus(prev => {
      return prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            skus: product.skus.map(sku => ({
              ...sku,
              [field]: value
            }))
          };
        }
        return product;
      });
    });
  };

  const selectedPropertyNames = properties
    .map(p => p.name)
    .filter(Boolean);

  const selectedOptionTypes = options
    .map(o => o.type)
    .filter(Boolean);

  function handleCreateProducts() {
    const products = generateProducts(formData.name, properties);

    if (products.length > 0) {
      setGeneratedProducts(products);
    }
  }


  /* ================= PROPERTY HANDLERS ================= */

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

    // ✅ CHECK IF PRODUCT NAME EXISTS
    if (!formData.name || !formData.name.trim()) {
      alert("Please enter Product Name first in Main Product Information");
      return;
    }

    if (!value) return;
    if (updated[index].values.includes(value)) return;

    updated[index].values.push(value);
    updated[index].input = "";
    setProperties(updated);

    // ✅ AUTO-GENERATE PRODUCTS
    const newProducts = generateProducts(formData.name, updated);
    setGeneratedProducts(newProducts);
  };

  const removePropertyValue = (row, valueIndex) => {
    const updated = [...properties];
    updated[row].values.splice(valueIndex, 1);
    setProperties(updated);
  };

  /* ================= OPTION HANDLERS ================= */

  const addOptionRow = () => {
    setOptions(o => [...o, { type: "", values: [], input: "" }]);
  };

  const deleteOptionRow = (index) => {
    if (options.length === 1) {
      setOptions([{ type: "", values: [], input: "" }]);
    } else {
      setOptions(o => o.filter((_, i) => i !== index));
    }
  };

  const addOptionValue = (index) => {
    const updated = [...options];
    const value = updated[index].input.trim();

    if (!value) return;
    if (updated[index].values.includes(value)) return;

    updated[index].values.push(value);
    updated[index].input = "";
    setOptions(updated);

    // ✅ AUTO-GENERATE/UPDATE SKUs
    handleCreateSkus();
  };

  const removeOptionValue = (row, valueIndex) => {
    const updated = [...options];
    updated[row].values.splice(valueIndex, 1);
    setOptions(updated);
  };

  // General
  function deleteGeneratedProduct(productId) {
    setGeneratedProducts(prev =>
      prev.filter(p => p.id !== productId)
    );

    setGeneratedSkus(prev =>
      prev.filter(p => p.id !== productId)
    );
  }

  const baseProductName = formData.name.trim();

  function handleCreateSkus() {
    if (!generatedProducts.length) return;

    setProducts(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];

      // If products array is empty, generate fresh
      if (safePrev.length === 0) {
        return generatedProducts.map(p => {
          const skus = generateSkus(p.name, options);

          return {
            name: p.name, // ✅ already contains base product name
            display_name: p.name,
            product_properties: (p.properties ?? []).map(prop => ({
              property_name: prop.name,
              property_value: prop.value
            })),
            product_skus: skus.map((s, idx) => ({
              sku_name: s.sku_name,
              display_name: s.sku_name,
              display_name_edited: false,
              sku_code: "",
              mrp: "",
              selling_price: "",
              unit_price: "",
              dimension: "",
              weight: "",
              conversion_factor: 1,
              multiplication_factor: 1,
              uom: "pcs",
              threshold_quantity: 1,
              status: "active",
              master: idx === 0,
              option_type_values: s.option_type_values ?? [],
              sku_media: []
            }))
          };
        });
      }

      // Merge with existing products
      return generatedProducts.map(genProd => {
        const existingProduct = safePrev.find(
          p => p.name === genProd.name
        );

        const newSkus = generateSkus(genProd.name, options);

        const mergedSkus = newSkus.map((newSku, idx) => {
          const existingSku =
            existingProduct?.product_skus?.find(
              old => old.sku_name === newSku.sku_name
            );

          return (
            existingSku ?? {
              sku_name: newSku.sku_name,
              display_name: newSku.sku_name,
              display_name_edited: false,
              sku_code: "",
              mrp: "",
              selling_price: "",
              unit_price: "",
              dimension: "",
              weight: "",
              conversion_factor: 1,
              multiplication_factor: 1,
              uom: "pcs",
              threshold_quantity: 1,
              status: "active",
              master:
                idx === 0 &&
                !(existingProduct?.product_skus ?? []).some(s => s.master),
              option_type_values: newSku.option_type_values ?? [],
              sku_media: []
            }
          );
        });

        return {
          name: genProd.name,
          display_name: genProd.name,
          product_properties: genProd.properties.map(prop => ({
            property_name: prop.name,
            property_value: prop.value
          })),
          product_skus: mergedSkus
        };
      });
    });
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6 space-y-8">

      {/* ================= HEADERS ================= */}
      <div className="grid grid-cols-2 gap-8">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Product Properties
          </h3>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Option Values
          </h3>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="grid grid-cols-2 gap-10">

        {/* ================= PROPERTIES ================= */}
        <div className="space-y-6">
          {properties.map((prop, i) => (
            <div key={i} className="border border-gray-300 rounded-lg p-2 space-y-1">

              <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-start">

                {/* Property Name */}
                <SearchableDropdown
                  options={propertyNames.map(name => ({ id: name, name: name }))}
                  value={prop.name}
                  onChange={(value) => {
                    const updated = [...properties];
                    updated[i].name = value;
                    setProperties(updated);
                  }}
                  placeholder="Select property"
                  disabled={!isCreateNew}
                  emptyMessage="No properties available"
                />

                {/* Property Values */}
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      value={prop.input}
                      placeholder="Enter value"
                      disabled={!isCreateNew}  // ✅ ADD THIS LINE
                      onChange={e => {
                        const updated = [...properties];
                        updated[i].input = e.target.value;
                        setProperties(updated);
                      }}
                      onKeyDown={e => e.key === "Enter" && addPropertyValue(i)}
                      className="input rounded-r-none"
                    />
                    <button
                      onClick={() => addPropertyValue(i)}
                      disabled={!isCreateNew}  // ✅ ADD THIS LINE
                      className="h-11 px-2 border border-l-0 border-gray-300
             rounded-r-md bg-gray-50
             hover:bg-blue-600 hover:text-white transition"
                    >
                      <CornerDownLeft size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {prop.values.map((val, vi) => (
                      <span
                        key={vi}
                        className="flex items-center gap-1 px-2 py-1
                                   text-blue-700 bg-blue-50 rounded-md text-xs"
                      >
                        {val}
                        <button onClick={() => removePropertyValue(i, vi)} className="cursor-pointer">
                          <X size={12} className="text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {isCreateNew && (  // ✅ ADD THIS WRAPPER
                  <button onClick={() => deletePropertyRow(i)}>
                    <Trash2 className="text-red-500 hover:text-red-700" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isCreateNew && (  // ✅ ADD THIS WRAPPER
            <div className="flex justify-center">
              <button
                onClick={addPropertyRow}
                className="h-10 w-10 rounded-full border border-gray-400
                 flex items-center justify-center
                 hover:bg-blue-600 hover:text-white transition"
              >
                <Plus />
              </button>
            </div>
          )}
        </div>

        {/* ================= OPTIONS ================= */}
        <div className="space-y-6">
          {options.map((opt, i) => (
            <div key={i} className="border border-gray-300 rounded-lg p-2 space-y-1">

              <div className="grid grid-cols-[1fr_2fr_auto] gap-3 items-start">
                <SearchableDropdown
                  options={optionTypes.map(option => ({ id: option.name, name: option.name }))}
                  value={opt.type}
                  onChange={(value) => {
                    const updated = [...options];
                    updated[i].type = value;
                    setOptions(updated);
                  }}
                  placeholder="Select option"
                  emptyMessage="No option types available"
                />

                <div className="space-y-2">
                  <div className="flex">
                    <input
                      value={opt.input}
                      placeholder="Enter value"
                      onChange={e => {
                        const updated = [...options];
                        updated[i].input = e.target.value;
                        setOptions(updated);
                      }}
                      onKeyDown={e => e.key === "Enter" && addOptionValue(i)}
                      className="input rounded-r-none"
                    />
                    <button
                      onClick={() => addOptionValue(i)}
                      className="h-11 px-3 border border-l-0 border-gray-300
                                 rounded-r-md bg-gray-50
                                 hover:bg-green-600 hover:text-white transition"
                    >
                      <CornerDownLeft size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val, vi) => (
                      <span
                        key={vi}
                        className="flex items-center gap-1 px-2 py-1
                                   text-green-700 bg-green-50 rounded-md text-xs"
                      >
                        {val}
                        <button onClick={() => removeOptionValue(i, vi)}>
                          <X size={12} className="text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={() => deleteOptionRow(i)}>
                  <Trash2 className="text-red-500 hover:text-red-700" />
                </button>
              </div>
            </div>
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
      {generatedProducts.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">
            Generated Products
          </h4>

          <div className={tableWrapper}>
            <table className={tableBase}>
              <thead>
                <tr>
                  <th className={thBase}>Product Name</th>
                  <th className={`${thBase} text-center w-28`}>No. of SKUs</th>
                  <th className={`${thBase} text-right w-16`}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {generatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className={tdBase}>{p.name}</td>
                    <td className={`${tdBase} text-center font-medium`}>
                      {p.skuCount}
                    </td>
                    <td className={`${tdBase} text-right`}>
                      <button
                        onClick={() => deleteGeneratedProduct(p.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {products.some(p => p.product_skus.length > 0) &&
        products.map((product, productIndex) =>
          product.product_skus.length > 0 ? (
            <div key={productIndex} className="mb-8">
              {/* SKU table */}
              <h4 className="text-base font-semibold text-gray-900 mb-3">
                Product SKUs – {product.name}
              </h4>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 py-2 w-[160px] font-medium">SKU Name</th>
                        <th className="px-2 py-2 w-[160px] font-medium">Display Name</th>
                        <th className="px-2 py-2 w-[120px] font-medium">SKU Code</th>

                        {/* ✅ DYNAMIC COLUMN ORDER BASED ON PRICING MODE */}
                        {pricingMode === "conversion" ? (
                          <>
                            <th className="px-2 py-2 w-[90px] font-medium">MRP</th>
                            <th className="px-2 py-2 w-[90px] font-medium">Unit Price</th>
                            <th className="px-2 py-2 w-[90px] font-medium">Selling</th>
                          </>
                        ) : (
                          <>
                            <th className="px-2 py-2 w-[90px] font-medium">Unit Price</th>
                            <th className="px-2 py-2 w-[90px] font-medium">MRP</th>
                            <th className="px-2 py-2 w-[90px] font-medium">Selling</th>
                          </>
                        )}

                        <th className="px-2 py-2 w-[90px] font-medium">UOM</th>
                        <th className="px-2 py-2 w-[120px] font-medium">Status</th>
                        <th className="px-2 py-2 w-[70px] text-center font-medium">Master</th>
                        <th className="px-2 py-2 w-[80px] font-medium">Media</th>
                        <th className="px-2 py-2 w-[50px] text-center font-medium">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {product.product_skus.map((sku, skuIndex) => (
                        <tr key={skuIndex} className="border-b last:border-0 hover:bg-gray-50">

                          {/* SKU NAME */}
                          <td className="px-2 py-1">
                            <input
                              className={inputCell}
                              value={sku.sku_name ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.map((s, sIdx) =>
                                          sIdx === skuIndex
                                            ? {
                                              ...s,
                                              sku_name: val,
                                              display_name: s.display_name_edited
                                                ? s.display_name
                                                : val
                                            }
                                            : s
                                        )
                                      }
                                      : p
                                  )
                                );
                              }}
                            />
                          </td>

                          {/* DISPLAY NAME */}
                          <td className="px-2 py-1">
                            <input
                              className={inputCell}
                              value={sku.display_name ?? ""}
                              onChange={(e) => {
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.map((s, sIdx) =>
                                          sIdx === skuIndex
                                            ? {
                                              ...s,
                                              display_name: e.target.value,
                                              display_name_edited: true
                                            }
                                            : s
                                        )
                                      }
                                      : p
                                  )
                                );
                              }}
                            />
                          </td>

                          {/* SKU CODE */}
                          <td className="px-2 py-1">
                            <input
                              className={inputCell}
                              value={sku.sku_code ?? ""}
                              onChange={(e) =>
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.map((s, sIdx) =>
                                          sIdx === skuIndex
                                            ? { ...s, sku_code: e.target.value }
                                            : s
                                        )
                                      }
                                      : p
                                  )
                                )
                              }
                            />
                          </td>

                          {/* MRP / SELLING / UNIT */}
                          {/* ✅ DYNAMIC PRICING INPUTS WITH AUTO-CALCULATION */}
                          {pricingMode === "conversion" ? (
                            <>
                              {/* MRP (User enters) */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  className={inputCell}
                                  value={sku.mrp ?? ""}
                                  onChange={(e) => {
                                    const mrpValue = e.target.value;
                                    const unitPrice = mrpValue && globalPricing.conversion_factor
                                      ? Number((Number(mrpValue) / globalPricing.conversion_factor).toFixed(2))
                                      : "";

                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? { ...s, mrp: mrpValue, unit_price: unitPrice }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    );
                                  }}
                                />
                              </td>

                              {/* Unit Price (Auto-calculated) */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  className={`${inputCell} bg-gray-100`}
                                  value={sku.unit_price ?? ""}
                                  onChange={(e) =>
                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? { ...s, unit_price: e.target.value }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    )
                                  }
                                />
                              </td>

                              {/* Selling Price */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  className={inputCell}
                                  value={sku.selling_price ?? ""}
                                  onChange={(e) =>
                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? { ...s, selling_price: e.target.value }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    )
                                  }
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Unit Price (User enters) */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  className={inputCell}
                                  value={sku.unit_price ?? ""}
                                  onChange={(e) => {
                                    const unitValue = e.target.value;
                                    const calculatedPrice = unitValue && globalPricing.multiplication_factor
                                      ? Number((Number(unitValue) * globalPricing.multiplication_factor).toFixed(2))
                                      : "";

                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? {
                                                  ...s,
                                                  unit_price: unitValue,
                                                  mrp: calculatedPrice,
                                                  selling_price: calculatedPrice
                                                }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    );
                                  }}
                                />
                              </td>

                              {/* MRP (Auto-calculated) */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  className={`${inputCell} bg-gray-100`}
                                  value={sku.mrp ?? ""}
                                  onChange={(e) =>
                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? { ...s, mrp: e.target.value }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    )
                                  }
                                />
                              </td>

                              {/* Selling Price (Auto-calculated) */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  className={`${inputCell} bg-gray-100`}
                                  value={sku.selling_price ?? ""}
                                  onChange={(e) =>
                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? { ...s, selling_price: e.target.value }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    )
                                  }
                                />
                              </td>
                            </>
                          )}

                          {/* UOM */}
                          <td className="px-2 py-1">
                            <SearchableDropdown
                              options={[
                                { id: 'pcs', name: 'Pcs' },
                                { id: 'kg', name: 'Kg' },
                                { id: 'ltr', name: 'Ltr' }
                              ]}
                              value={sku.uom ?? "pcs"}
                              onChange={(value) =>
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.map((s, sIdx) =>
                                          sIdx === skuIndex
                                            ? { ...s, uom: value }
                                            : s
                                        )
                                      }
                                      : p
                                  )
                                )
                              }
                              placeholder="Select UOM"
                            />
                          </td>

                          {/* STATUS */}
                          <td className="px-2 py-1">
                            <SearchableDropdown
                              options={[
                                { id: 'active', name: 'Active' },
                                { id: 'inactive', name: 'Inactive' },
                                { id: 'deleted', name: 'Deleted' }
                              ]}
                              value={sku.status ?? "active"}
                              onChange={(value) =>
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.map((s, sIdx) =>
                                          sIdx === skuIndex
                                            ? { ...s, status: value }
                                            : s
                                        )
                                      }
                                      : p
                                  )
                                )
                              }
                              placeholder="Select status"
                            />
                          </td>

                          {/* MASTER */}
                          <td className="px-2 py-1 text-center">
                            <input
                              type="radio"
                              name={`master-${productIndex}`}
                              checked={sku.master === true}
                              onChange={() =>
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.map((s, sIdx) => ({
                                          ...s,
                                          master: sIdx === skuIndex
                                        }))
                                      }
                                      : p
                                  )
                                )
                              }
                            />
                          </td>

                          {/* MEDIA */}
                          <td className="pl-6 py-1">
                            <div className="flex flex-col items-center gap-2">
                              {/* Upload Icon */}
                              <label className="cursor-pointer text-blue-600 hover:text-blue-700">
                                <Upload size={16} />
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (!files.length) return;

                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? {
                                                  ...s,
                                                  sku_media: [
                                                    ...(s.sku_media || []),
                                                    ...files.map(file => ({
                                                      id: Date.now() + Math.random(),
                                                      name: file.name,
                                                      url: URL.createObjectURL(file),
                                                      file: file,  // ✅ Store file
                                                      active: true
                                                    }))
                                                  ]
                                                }
                                                : s
                                            )
                                          }
                                          : p
                                      )
                                    );

                                    e.target.value = "";
                                  }}
                                />
                              </label>

                              {/* File Count */}
                              {sku.sku_media?.length > 0 && (
                                <span className="text-xs text-green-600">{sku.sku_media.length}</span>
                              )}

                              {/* ✅ Upload Button */}
                              {sku.sku_media?.some(m => !m.uploadedUrl) && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const filesToUpload = sku.sku_media
                                      .filter(m => !m.uploadedUrl && m.file)
                                      .map(m => m.file);

                                    if (filesToUpload.length === 0) return;

                                    toast.loading('Uploading SKU media...');
                                    const uploadedUrls = await uploadMediaFiles(filesToUpload, 'sku');
                                    toast.dismiss();

                                    if (uploadedUrls.length > 0) {
                                      setProducts(prev =>
                                        prev.map((p, pIdx) =>
                                          pIdx === productIndex
                                            ? {
                                              ...p,
                                              product_skus: p.product_skus.map((s, sIdx) =>
                                                sIdx === skuIndex
                                                  ? {
                                                    ...s,
                                                    sku_media: s.sku_media.map((m, mIdx) => {
                                                      if (!m.uploadedUrl && uploadedUrls[mIdx]) {
                                                        return { ...m, uploadedUrl: uploadedUrls[mIdx] };
                                                      }
                                                      return m;
                                                    })
                                                  }
                                                  : s
                                              )
                                            }
                                            : p
                                        )
                                      );
                                      toast.success('SKU media uploaded');
                                    }
                                  }}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Upload
                                </button>
                              )}

                              {/* View Button */}
                              {sku.sku_media?.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMediaPopup({
                                      productIndex,
                                      skuIndex,
                                      media: sku.sku_media,
                                      isProductLevel: false
                                    })
                                  }
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                >
                                  <Image size={14} />
                                  <span className="text-xs">View</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* DELETE */}
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() =>
                                setProducts(prev =>
                                  prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.filter(
                                          (_, idx) => idx !== skuIndex
                                        )
                                      }
                                      : p
                                  )
                                )
                              }
                            >
                              <Trash2 size={16} className="text-red-500 hover:text-red-700" />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null
        )
      }

      {/* Media Popup */}
      {mediaPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {mediaPopup.isProductLevel ? 'Product Media' : 'SKU Media'}
              </h3>
              <button
                onClick={() => setMediaPopup(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {mediaPopup.media.map((item, idx) => (
                <div key={item.id} className="relative group">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                    <button
                      onClick={() => {
                        // ✅ Handle removal for both product and SKU media
                        if (mediaPopup.isProductLevel) {
                          setGeneratedProducts(prev =>
                            prev.map((p, i) =>
                              i === mediaPopup.productIndex
                                ? {
                                  ...p,
                                  content_media: p.content_media.filter(m => m.id !== item.id)
                                }
                                : p
                            )
                          );
                        } else {
                          setProducts(prev =>
                            prev.map((p, pIdx) =>
                              pIdx === mediaPopup.productIndex
                                ? {
                                  ...p,
                                  product_skus: p.product_skus.map((s, sIdx) =>
                                    sIdx === mediaPopup.skuIndex
                                      ? {
                                        ...s,
                                        sku_media: s.sku_media.filter(m => m.id !== item.id)
                                      }
                                      : s
                                  )
                                }
                                : p
                            )
                          );
                        }

                        // Update popup
                        setMediaPopup(prev => ({
                          ...prev,
                          media: prev.media.filter(m => m.id !== item.id)
                        }));
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {generatedProducts.map((p, index) => (
        <div key={p.id} className="border rounded-lg p-4 mt-6">
          <ProductContentSection
            product={p}
            index={index}
            setGeneratedProducts={setGeneratedProducts}
          />

          <ProductMediaSection
            product={p}
            index={index}
            setGeneratedProducts={setGeneratedProducts}
            uploadMediaFiles={uploadMediaFiles}
            setMediaPopup={setMediaPopup}
          />
        </div>
      ))}

    </div>
  );
}

function ProductContentSection({ product, index, setGeneratedProducts }) {
  // Ensure at least one row exists on render
  const productContents = product.product_contents && product.product_contents.length > 0
    ? product.product_contents
    : [{ content_type: "", content_value: "" }];

  // Initialize with one row if empty
  useEffect(() => {
    if (!product.product_contents || product.product_contents.length === 0) {
      setGeneratedProducts(prev =>
        prev.map((p, i) =>
          i === index
            ? { ...p, product_contents: [{ content_type: "", content_value: "" }] }
            : p
        )
      );
    }
  }, []);

  const setProductContents = (updater) => {
    setGeneratedProducts(prev =>
      prev.map((p, i) =>
        i === index
          ? {
            ...p,
            product_contents:
              typeof updater === "function"
                ? updater(p.product_contents || [{ content_type: "", content_value: "" }])
                : updater
          }
          : p
      )
    );
  };

  const handleAddRow = () => {
    setProductContents(prev => [
      ...prev,
      { content_type: "", content_value: "" }
    ]);
  };

  const handleDeleteRow = (rowIndex) => {
    if (productContents.length === 1) {
      // If only one row, clear inputs
      setProductContents([{ content_type: "", content_value: "" }]);
    } else {
      // If multiple rows, delete the row
      setProductContents(prev => prev.filter((_, idx) => idx !== rowIndex));
    }
  };

  const handleInputChange = (rowIndex, field, value) => {
    setProductContents(prev =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Content</h3>
      </div>

      <div className="space-y-4">
        {productContents.map((row, rowIndex) => (
          <div key={rowIndex} className="border border-gray-300 rounded-lg p-4">
            <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
              {/* Content Type */}
              <div className="space-y-1">
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., description"
                  value={row.content_type}
                  onChange={(e) =>
                    handleInputChange(rowIndex, 'content_type', e.target.value)
                  }
                />
              </div>

              {/* Content Value */}
              <div className="space-y-1">
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Premium quality plywood..."
                  value={row.content_value}
                  onChange={(e) =>
                    handleInputChange(rowIndex, 'content_value', e.target.value)
                  }
                />
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteRow(rowIndex)}
                className="text-red-500 hover:text-red-700 transition-colors"
                title={productContents.length === 1 ? "Clear inputs" : "Delete row"}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleAddRow}
          className="h-10 w-10 rounded-full border border-gray-400 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}


function ProductMediaSection({ product, index, setGeneratedProducts, uploadMediaFiles, setMediaPopup }) {
  const productMedia = product.content_media || [];

  const setProductMedia = (updater) => {
    setGeneratedProducts(prev =>
      prev.map((p, i) =>
        i === index
          ? {
            ...p,
            content_media:
              typeof updater === "function"
                ? updater(p.content_media || [])
                : updater
          }
          : p
      )
    );
  };

  // Make selected image primary
  const setPrimary = (id) => {
    setProductMedia(prev =>
      prev.map(m => ({
        ...m,
        sequence: m.id === id ? 1 : m.sequence > 1 ? m.sequence : m.sequence + 1
      }))
    );
  };

  // Remove image
  const removeMedia = (id) => {
    setProductMedia(prev =>
      prev.filter(m => m.id !== id)
        .map((m, idx) => ({ ...m, sequence: idx + 1 }))
    );
  };

  // Upload to S3
  const uploadToS3 = async () => {
    const files = productMedia
      .filter(m => !m.uploadedUrl)
      .map(m => m.file);

    if (!files.length) return;

    toast.loading("Uploading media...");
    const urls = await uploadMediaFiles(files, "product");
    toast.dismiss();

    setProductMedia(prev =>
      prev.map((m, i) => ({
        ...m,
        uploadedUrl: urls[i] || m.uploadedUrl
      }))
    );

    toast.success("Media uploaded");
  };

  const primary = productMedia.find(m => m.sequence === 1);
  const thumbnails = productMedia.filter(m => m.sequence !== 1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Media</h3>
        <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
          <Plus size={16} />
          Add Media
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;

              setProductMedia(prev => [
                ...prev,
                ...files.map((file, idx) => ({
                  id: Date.now() + Math.random(),
                  file,
                  previewUrl: URL.createObjectURL(file),
                  uploadedUrl: null,
                  sequence: prev.length + idx + 1,
                  active: true
                }))
              ]);

              e.target.value = "";
            }}
          />
        </label>
      </div>

      {productMedia.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500">No media added yet. Click "Add Media" to upload images.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Primary Image Section */}
          {primary && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Primary Image</p>
              <div className="relative inline-block">
                <img
                  src={primary.previewUrl || primary.uploadedUrl}
                  className="w-64 h-48 object-cover rounded-lg border-2 border-blue-500"
                  alt="Primary"
                />
                <button
                  onClick={() => removeMedia(primary.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Remove"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  Primary
                </div>
              </div>
            </div>
          )}

          {/* Thumbnails */}
          {thumbnails.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Other Images</p>
              <div className="flex flex-wrap gap-3">
                {thumbnails.map(m => (
                  <div key={m.id} className="relative group">
                    <img
                      src={m.previewUrl || m.uploadedUrl}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                      alt="Thumbnail"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={() => setPrimary(m.id)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Set Primary
                      </button>
                      <button
                        onClick={() => removeMedia(m.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {productMedia.some(m => !m.uploadedUrl) && (
              <button
                onClick={uploadToS3}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Upload size={16} />
                Upload Media
              </button>
            )}

            {productMedia.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setMediaPopup({
                    productIndex: index,
                    media: productMedia,
                    isProductLevel: true
                  })
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Image size={16} />
                View All ({productMedia.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
