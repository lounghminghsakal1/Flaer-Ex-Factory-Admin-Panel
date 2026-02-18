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
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import { useConfirm } from "../../../../../../components/hooks/context/ConfirmContext";
import { toast } from "react-toastify";

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

  // Get values arrays
  const propValues = validProps.map(p => p.values);

  // Cartesian combinations
  const combinations = cartesian(propValues);

  let productId = 1;

  return combinations.map(combo => ({
    id: productId++,
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

  if (!validOpts.length) {
    //  If no options, create one default SKU
    return [{
      sku_name: productName,
      option_type_values: []
    }];
  }

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

export default function ProductCreationAttributes({
  formData,
  products,
  setProducts,
  generatedProducts,
  setGeneratedProducts,
  uploadMediaFiles,
  isCreateNew,
  pricingMode,
  globalPricing,
  productContents,
  setProductContents,
  productMedia,
  setProductMedia
}) {

  const confirm = useConfirm();

  const [properties, setProperties] = useState([
    { name: "", values: [], input: "" }
  ]);

  const [options, setOptions] = useState([
    { type: "", values: [], input: "" }
  ]);

  const [pendingCascadeDelete, setPendingCascadeDelete] = useState(null);

  //  disable property/option editing in edit mode
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

  const tableWrapper = "overflow-x-auto border border-gray-200 rounded-lg";
  const tableBase = "w-full border-collapse text-sm";
  const thBase = "bg-gray-50 border-b border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-700";
  const tdBase = "border-b border-gray-200 px-2 py-2";
  const inputCell =
    "w-full h-9 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500";
  const inputCellSmall =
    "w-full h-9 px-2 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500";

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
      toast.error("Failed to fetch property names");
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

  /* ================= PROPERTY HANDLERS ================= */

  const addPropertyRow = () => {
    setProperties(p => [...p, { name: "", values: [], input: "" }]);
  };

  const deletePropertyRow = async (index) => {

    const propertyToDelete = properties[index];

    // Detect if this is last property with values
    const remainingProperties = properties.filter((_, i) => i !== index);
    const hasOtherValidProperties = remainingProperties.some(
      p => p.name && p.values && p.values.length > 0
    );

    let ok = true;

    // CASE 1 — Last property structure
    if (!hasOtherValidProperties) {

      ok = await confirm(
        `Deleting "${propertyToDelete.name || "this property"}" will remove ALL generated products and SKUs.\n\nContinue?`
      );

      if (!ok) return;

      // Reset to empty structure row (UX friendly)
      setProperties([{ name: "", values: [], input: "" }]);

      // Clear derived data
      setGeneratedProducts([]);
      setProducts([]);

      return;
    }

    // CASE 2 — Normal recompute case
    const isValidProperty =
      propertyToDelete.name &&
      propertyToDelete.values &&
      propertyToDelete.values.length > 0;

    if (isValidProperty) {
      ok = await confirm(
        `Deleting "${propertyToDelete.name || "this property"}" will change product combinations and may change SKU structure.\n\nContinue?`
      );
    }
    if (!ok) return;

    // Remove property row
    const updatedProperties = properties.filter((_, i) => i !== index);

    setProperties(updatedProperties);

    // Rebuild generated products ALWAYS (source of truth pattern)
    const newGeneratedProducts = generateProducts(formData.name, updatedProperties);

    const validOptions = options.filter(
      o => o.type && o.values.length > 0
    );

    // Update generated products with SKU count
    setGeneratedProducts(
      newGeneratedProducts.map(gp => ({
        ...gp,
        skuCount: generateSkus(gp.name, validOptions).length
      }))
    );

    // Rebuild products + SKUs safely
    setProducts(prevProducts =>
      syncProductSkus(
        prevProducts || [],
        newGeneratedProducts,
        options
      )
    );

  };


  const addPropertyValue = (index) => {
    const updated = [...properties];
    const value = updated[index].input.trim();

    if (!updated[index].name) {
      confirm("Please select property name first");
      return;
    }

    // CHECK IF PRODUCT NAME EXISTS
    if (!formData.name || !formData.name.trim()) {
      confirm("Please enter Product Name first in Main Product Information");
      return;
    }

    if (!value) return;
    if (updated[index].values.includes(value)) return;

    updated[index].values.push(value);
    updated[index].input = "";
    setProperties(updated);

    //  AUTO-GENERATE PRODUCTS
    const newProducts = generateProducts(formData.name, updated);

    setGeneratedProducts(prev =>
      newProducts.map(np => {
        const currentOptions = options.filter(
          o => o.type && o.values.length > 0
        );

        return {
          ...np,
          skuCount:
            currentOptions.length === 0
              ? 0
              : generateSkus(np.name, currentOptions).length
        };
      })
    );

    //  Always regenerate products + SKUs together
    setTimeout(() => {
      const currentOptions = options.filter(
        o => o.type && o.values.length > 0
      );

      setProducts(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];

        return newProducts.map(genProd => {
          const existingProduct = safePrev.find(
            p => p.name === genProd.name
          );

          // Generate SKUs even if options exist already
          const newSkus =
            currentOptions.length > 0
              ? generateSkus(genProd.name, currentOptions)
              : [];

          const existingSkuMap = new Map(
            (existingProduct?.product_skus || []).map(s => [
              s.sku_name,
              s
            ])
          );

          const mergedSkus = newSkus.map((newSku, idx) => {
            if (existingSkuMap.has(newSku.sku_name)) {
              return existingSkuMap.get(newSku.sku_name);
            }

            const hasMaster =
              existingProduct?.product_skus?.some(s => s.master);

            return {
              sku_name: newSku.sku_name,
              display_name: newSku.sku_name,
              display_name_edited: false,
              sku_code: "",
              mrp: "",
              selling_price: "",
              unit_price: "",
              conversion_factor: globalPricing.conversion_factor ?? 1,
              multiplication_factor: globalPricing.multiplication_factor ?? 1,
              uom: "piece",
              threshold_quantity: 1,
              status: "active",
              master: !hasMaster && idx === 0,
              option_type_values: newSku.option_type_values ?? [],
              sku_media: []
            };
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
    }, 0);
  };

  const removePropertyValue = async (propIndex, valueIndex) => {

    const prop = properties[propIndex];
    const valueToDelete = prop.values[valueIndex];
    let ok;

    // Simulate removal first
    const updatedProperties = properties.map((p, i) =>
      i === propIndex
        ? { ...p, values: p.values.filter((_, vi) => vi !== valueIndex) }
        : p
    );

    // Generate products BEFORE + AFTER removal
    const oldProducts = generateProducts(formData.name, properties);
    const newProducts = generateProducts(formData.name, updatedProperties);

    //  Detect deleted products
    const deletedProducts = oldProducts.filter(
      oldP => !newProducts.some(newP => newP.name === oldP.name)
    );

    if (valueIndex === 0) {
      if (propIndex === 0) {
        ok = await confirm(`Removing ${valueToDelete} will delete all products and SKUs of it, do you want to continue ?? `);
      } else {
        ok = await confirm(`Removing ${valueToDelete} can change the name of the products, do you want to continue ?`);
      }
    } else {
      //  Confirm ONLY if destructive
      if (deletedProducts.length > 0) {
        ok = await confirm(
          `Removing "${valueToDelete}" will delete:\n\n` +
          deletedProducts.map(p => `• ${p.name}`).join("\n") +
          `\n\nAnd all their SKUs if present .\n\nContinue?`
        );
      }
    }
    if (!ok) return;


    //  Apply removal
    setProperties(updatedProperties);

    setProducts(prevProducts => {

      const validOptions = options.filter(
        o => o.type && o.values.length > 0
      );

      const rebuiltProducts = newProducts.map(genProd => {

        const existing = prevProducts.find(p => {

          if (!p.product_properties) return false;

          const prevProps = p.product_properties;

          const newProps = genProd.properties.map(prop => ({
            property_name: prop.name,
            property_value: prop.value
          }));

          // Match if ALL new props exist in old product
          return newProps.every(np =>
            prevProps.some(pp =>
              pp.property_name === np.property_name &&
              pp.property_value === np.property_value
            )
          );
        });

        if (existing) return existing;

        return {
          name: genProd.name,
          display_name: genProd.name,
          product_properties: genProd.properties.map(prop => ({
            property_name: prop.name,
            property_value: prop.value
          })),
          product_skus:
            validOptions.length > 0
              ? generateSkus(genProd.name, validOptions)
              : []
        };
      });

      // AFTER PRODUCTS READY → Update Generated Products With Correct SKU COUNT
      setGeneratedProducts(
        newProducts.map(np => {
          const prod = rebuiltProducts.find(p =>
            isSameProductByProps(p, np)
          );
          return {
            ...np,
            skuCount: prod?.product_skus?.length || 0
          };
        })
      );

      return rebuiltProducts;
    });

  };

  const isSameProductByProps = (product, genProd) => {
    if (!product?.product_properties) return false;

    const prevProps = product.product_properties;

    const newProps = genProd.properties.map(prop => ({
      property_name: prop.name,
      property_value: prop.value
    }));

    return newProps.every(np =>
      prevProps.some(pp =>
        pp.property_name === np.property_name &&
        pp.property_value === np.property_value
      )
    );
  };

  /* ================= OPTION HANDLERS ================= */

  const addOptionRow = () => {
    setOptions(o => [...o, { type: "", values: [], input: "" }]);
  };

  const deleteOptionRow = async (index) => {

    const optionToDelete = options[index];

    //  Detect remaining valid options
    const remainingOptions = options.filter((_, i) => i !== index);
    const validRemainingOptions = remainingOptions.filter(
      o => o.type && o.values && o.values.length > 0
    );

    let ok = true;

    //  CASE 1 — Last Option (All SKUs will be removed)
    if (validRemainingOptions.length === 0) {

      ok = await confirm(
        `Deleting "${optionToDelete.type || "this option"}" will remove ALL SKUs from all products.\n\nContinue?`
      );

      if (!ok) return;

      // Reset option UI structure
      setOptions([{ type: "", values: [], input: "" }]);

      // Remove all SKUs but keep products
      setProducts(prev =>
        (prev || []).map(p => ({
          ...p,
          product_skus: []
        }))
      );

      // Update SKU count in generated products
      setGeneratedProducts(prev =>
        (prev || []).map(gp => ({
          ...gp,
          skuCount: 0
        }))
      );

      return;
    }

    //  CASE 2 — Normal recompute case
    const isValidOption =
      optionToDelete.type &&
      optionToDelete.values &&
      optionToDelete.values.length > 0;

    if (isValidOption) {
      ok = await confirm(
        `Deleting "${optionToDelete.type || "this option"}" will change SKU combinations.\n\nContinue?`
      );
    }

    if (!ok) return;

    const updatedOptions = options.filter((_, i) => i !== index);

    setOptions(updatedOptions);

    //  If products missing → regenerate first
    let ensuredGeneratedProducts = generatedProducts;

    if (!ensuredGeneratedProducts || ensuredGeneratedProducts.length === 0) {
      ensuredGeneratedProducts = generateProducts(formData.name, properties);
    }

    //  Rebuild SKUs using sync engine
    setProducts(prev =>
      syncProductSkus(
        prev || [],
        ensuredGeneratedProducts,
        updatedOptions
      )
    );

    //  Update SKU count
    const validOptions = updatedOptions.filter(
      o => o.type && o.values && o.values.length > 0
    );

    setGeneratedProducts(
      ensuredGeneratedProducts.map(gp => ({
        ...gp,
        skuCount: generateSkus(gp.name, validOptions).length
      }))
    );

  };

  const addOptionValue = async (index) => {

    // GET FRESH PRODUCTS
    const ensuredGeneratedProducts = await ensureProductsBeforeOptionChange();
    if (!ensuredGeneratedProducts) return;

    const updated = [...options];
    const value = updated[index].input.trim();

    if (!updated[index].type) {
      confirm("Please select option type first");
      return;
    }

    if (!value) return;
    if (updated[index].values.includes(value)) return;

    updated[index].values.push(value);
    updated[index].input = "";
    setOptions(updated);

    setProducts(prev =>
      syncProductSkus(prev, ensuredGeneratedProducts, updated)
    );

    setGeneratedProducts(
      ensuredGeneratedProducts.map(gp => ({
        ...gp,
        skuCount: generateSkus(
          gp.name,
          updated.filter(o => o.type && o.values.length > 0)
        ).length
      }))
    );

  };


  function syncProductSkus(existingProducts, generatedProducts, options) {

    const validOptions = options.filter(o => o.type && o.values.length > 0);

    return generatedProducts.map(genProd => {

      const existingProduct = findExistingProduct(existingProducts, genProd);

      if (!validOptions.length) {
        return {
          ...(existingProduct || {
            name: genProd.name,
            display_name: genProd.name,
            product_properties: genProd.properties?.map(prop => ({
              property_name: prop.name,
              property_value: prop.value
            })) || []
          }),
          product_skus: []
        };
      }

      const expectedSkus = generateSkus(genProd.name, validOptions);

      const existingSkuMap = new Map(
        (existingProduct?.product_skus || []).map(s => [s.sku_name, s])
      );

      const mergedSkus = expectedSkus.map((sku, idx) => {

        if (existingSkuMap.has(sku.sku_name)) {
          return existingSkuMap.get(sku.sku_name); // PRESERVE USER DATA
        }

        return {
          sku_name: sku.sku_name,
          display_name: sku.sku_name,
          display_name_edited: false,
          sku_code: "",
          mrp: "",
          selling_price: "",
          unit_price: "",
          conversion_factor: globalPricing.conversion_factor ?? 1,
          multiplication_factor: globalPricing.multiplication_factor ?? 1,
          uom: "piece",
          threshold_quantity: 1,
          status: "active",
          master: idx === 0,
          option_type_values: sku.option_type_values ?? [],
          sku_media: []
        };
      });

      return {
        ...(existingProduct || {
          name: genProd.name,
          display_name: genProd.name,
          product_properties: genProd.properties?.map(prop => ({
            property_name: prop.name,
            property_value: prop.value
          })) || []
        }),
        product_skus: mergedSkus
      };
    });
  }

  const findExistingProduct = (existingProducts, genProd) => {
    return existingProducts.find(p => {

      if (!p.product_properties) return false;

      const prevProps = p.product_properties;

      const newProps = genProd.properties.map(prop => ({
        property_name: prop.name,
        property_value: prop.value
      }));

      return newProps.every(np =>
        prevProps.some(pp =>
          pp.property_name === np.property_name &&
          pp.property_value === np.property_value
        )
      );

    });
  };

  const ensureProductsBeforeOptionChange = async () => {

    if (generatedProducts.length > 0) {
      return generatedProducts;
    }

    const proceed = await confirm(
      "Products are not generated yet.\n\n" +
      "Finalize property values first.\n\n" +
      "Click OK to Regenerate Products.\n" +
      "Click Cancel to go back."
    );

    if (!proceed) return null;

    const newGeneratedProducts = generateProducts(formData.name, properties);

    const validOptions = options.filter(
      o => o.type && o.values.length > 0
    );

    setGeneratedProducts(
      newGeneratedProducts.map(gp => ({
        ...gp,
        skuCount: generateSkus(gp.name, validOptions).length
      }))
    );

    setProducts(prev =>
      syncProductSkus(prev || [], newGeneratedProducts, options)
    );

    return newGeneratedProducts; // RETURN FRESH DATA
  };

  const removeOptionValue = async (optIndex, valueIndex) => {

    //  GET FRESH PRODUCTS
    const ensuredGeneratedProducts = await ensureProductsBeforeOptionChange();

    if (!ensuredGeneratedProducts) return;

    const option = options[optIndex];
    const valueToRemove = option.values[valueIndex];

    let ok;
    if (valueIndex === 0) {
      if (optIndex === 0) {
        ok = await confirm(
          `Removing "${valueToRemove}" can delete all skus of every products if present, do you want to delete it ??`
        );
      } else {
        ok = await confirm(
          `Removing "${valueToRemove}" can change corressponding skus name if present, do you want to delete it ??`
        );
      }
    } else {
      ok = await confirm(
        `Removing "${valueToRemove}" can delete corressponding skus also if any present, do you want to delete it ??`
      );
    }

    if (!ok) return;

    // Remove option value
    const updatedOptions = options.map((o, i) =>
      i === optIndex
        ? { ...o, values: o.values.filter((_, vi) => vi !== valueIndex) }
        : o
    );

    setOptions(updatedOptions);

    //  USE ENSURED PRODUCTS
    setProducts(prev =>
      syncProductSkus(prev, ensuredGeneratedProducts, updatedOptions)
    );

    setGeneratedProducts(
      ensuredGeneratedProducts.map(gp => ({
        ...gp,
        skuCount: generateSkus(
          gp.name,
          updatedOptions.filter(o => o.type && o.values.length > 0)
        ).length
      }))
    );

  };

  // General
  async function deleteGeneratedProduct(productId) {
    const deleted = generatedProducts.find(p => p.id === productId);
    if (!deleted) return;
    const ok = await confirm("Are you sure you want to delete this ? ");
    if (!ok) return;

    setGeneratedProducts(prev =>
      prev.filter(p => p.id !== productId)
    );

    setProducts(prev =>
      prev.filter(p => p.name !== deleted.name)
    );
  }

  function handleCreateSkus() {
    if (!generatedProducts.length) return;

    const currentOptions = options.filter(o => o.type && o.values.length > 0);

    console.log("Creating SKUs with options:", currentOptions);

    setProducts(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];

      const newProducts = safePrev
        .filter(p =>
          generatedProducts.some(gp => gp.name === p.name)
        )
        .map(existingProduct => {
          const genProd = generatedProducts.find(
            gp => gp.name === existingProduct.name
          );

          const newSkus = generateSkus(genProd.name, currentOptions);

          console.log(`Product: ${genProd.name}, New SKUs:`, newSkus);

          //  PRESERVE EXISTING SKUs AND ADD NEW ONES
          const existingSkuMap = new Map(
            (existingProduct?.product_skus || []).map(sku => [sku.sku_name, sku])
          );

          const mergedSkus = newSkus.map((newSku, idx) => {
            // Check if SKU already exists
            if (existingSkuMap.has(newSku.sku_name)) {
              const existing = existingSkuMap.get(newSku.sku_name);
              console.log(`Preserving existing SKU: ${newSku.sku_name}`);
              return existing; //  Keep all existing data
            }

            // Create new SKU only if it doesn't exist
            console.log(`Creating new SKU: ${newSku.sku_name}`);

            //  Check if this should be master (only if no master exists yet)
            const hasMaster = existingProduct?.product_skus?.some(s => s.master === true);

            return {
              sku_name: newSku.sku_name,
              display_name: newSku.sku_name,
              display_name_edited: false,
              sku_code: "",
              mrp: "",
              selling_price: "",
              unit_price: "",
              dimension: "",
              weight: "",
              conversion_factor: globalPricing.conversion_factor ?? 1,
              multiplication_factor: globalPricing.multiplication_factor ?? 1,
              uom: "piece",
              threshold_quantity: 1,
              status: "active",
              master: !hasMaster && idx === 0, //  Only first SKU is master if none exists
              option_type_values: newSku.option_type_values ?? [],
              sku_media: []
            };
          });

          return {
            ...existingProduct,
            product_skus: mergedSkus
          };
        });

      return newProducts;
    });

    //  Update SKU count
    setGeneratedProducts(prev =>
      prev.map(gp => ({
        ...gp,
        skuCount: generateSkus(gp.name, currentOptions).length
      }))
    );
  }

  useEffect(() => {
    if (!pendingCascadeDelete) return;

    const deletedProductName = pendingCascadeDelete;

    // Remove from generated products
    setGeneratedProducts(prev =>
      prev.filter(p => p.name !== deletedProductName)
    );

    // Remove originating property value
    setProperties(prev =>
      prev
        .map(prop => ({
          ...prop,
          values: prop.values.filter(
            val => `${formData.name} ${val}` !== deletedProductName
          )
        }))
      // .filter(prop => prop.values.length > 0 || prop.name === "")
    );

    // Reset flag
    setPendingCascadeDelete(null);
  }, [pendingCascadeDelete, formData.name]);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm px-3 py-4 space-y-8">

      {/* HEADERS */}
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

      {/* CONTENT  */}
      <div className="grid grid-cols-2 gap-10">

        {/* PROPERTIES  */}
        <div className="space-y-6">
          {properties.map((prop, i) => (
            <div key={i} className="border border-gray-300 rounded-lg p-2 space-y-1">

              <div className="grid grid-cols-[1.2fr_2fr_auto] gap-2 items-start">

                {/* Property Name-  */}
                <SearchableDropdown
                  options={propertyNames
                    .filter(name => {
                      // Exclude already selected properties (except current row)
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
                  disabled={!isCreateNew}
                  emptyMessage="No properties available"
                  onCreateOption={(newProp) => {
                    // Add locally
                    setPropertyNames(prev => [...prev, newProp]);

                    // Auto-select
                    const updated = [...properties];
                    updated[i].name = newProp;
                    setProperties(updated);
                  }}
                />

                {/* Property Values */}
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      value={prop.input}
                      placeholder="Enter value"
                      disabled={!isCreateNew}
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
                      disabled={!isCreateNew}
                      className="h-9 px-2 border border-l-0 border-gray-300
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
                        <button onClick={() => removePropertyValue(i, vi)} className="cursor-pointer" title="Remove value (this will delete the product and its SKUs)">
                          <X size={12} className="text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {isCreateNew && (
                  <button onClick={() => deletePropertyRow(i)}>
                    <Trash2 className="text-red-500 hover:text-red-700" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isCreateNew && (
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

        {/* OPTIONS  */}
        <div className="space-y-6">
          {options.map((opt, i) => (
            <div key={i} className="border border-gray-300 rounded-lg p-2 space-y-1">

              <div className="grid grid-cols-[1.2fr_2fr_auto] gap-3 items-start">
                {/* Option Type */}
                <SearchableDropdown
                  options={optionTypes
                    .filter(option => {
                      // Exclude already selected option types (except current row)
                      const selectedTypes = options
                        .map((o, idx) => idx !== i ? o.type : null)
                        .filter(Boolean);
                      return !selectedTypes.includes(option.name);
                    })
                    .map(option => ({ id: option.name, name: option.name }))}
                  value={opt.type}
                  creatable
                  onChange={(value) => {
                    const updated = [...options];
                    updated[i].type = value;
                    setOptions(updated);
                    if (updated[i].values.length > 0 && generatedProducts.length > 0) {
                      setTimeout(() => {
                        handleCreateSkus();
                      }, 0);
                    }
                  }}
                  placeholder="Search or type to add"
                  emptyMessage="No option types available"
                  onCreateOption={(newOption) => {
                    setOptionTypes(prev => [...prev, { name: newOption }]);

                    const updated = [...options];
                    updated[i].type = newOption;
                    setOptions(updated);
                  }}
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
                      className="h-9 px-3 border border-l-0 border-gray-300
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
                        <button onClick={() => removeOptionValue(i, vi)} title="Remove option value(this will delete corressponding skus also)" >
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
                      {
                        products.find(prod =>
                          isSameProductByProps(prod, p)
                        )?.product_skus?.length || 0
                      }
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
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 py-2 w-[160px] font-medium">SKU Name</th>
                        <th className="px-2 py-2 w-[160px] font-medium">Display Name</th>
                        <th className="px-2 py-2 w-[120px] font-medium">SKU Code</th>
                        <th className="px-1 py-2 w-[60px] font-medium">{pricingMode === "conversion" ? "conv" : "mult"} </th>

                        {/*  DYNAMIC COLUMN ORDER BASED ON PRICING MODE */}
                        {pricingMode === "conversion" ? (
                          <>
                            <th className="px-2 py-2 w-[100px] font-medium">MRP</th>
                            <th className="px-2 py-2 w-[100px] font-medium">Unit Price</th>
                            <th className="px-2 py-2 w-[100px] font-medium">Selling</th>
                          </>
                        ) : (
                          <>
                            <th className="px-2 py-2 w-[100px] font-medium">Unit Price</th>
                            <th className="px-2 py-2 w-[100px] font-medium">MRP</th>
                            <th className="px-2 py-2 w-[100px] font-medium">Selling</th>
                          </>
                        )}
                        <th className="px-2 py-2 w-[90px] font-medium">Status</th>
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
                            <div className="relative group">
                              <input
                                className={`${inputCell} truncate`}
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

                              {/* TOOLTIP */}
                              {sku.sku_name && sku.sku_name.length > 15 && (
                                <div className={`pointer-events-none absolute z-[9999] left-0 ${skuIndex >= product.product_skus.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`}>
                                  <div className="relative">
                                    {/* Tooltip Arrow */}
                                    <div className={`absolute ${skuIndex >= product.product_skus.length - 2 ? 'bottom-0 -mb-1' : '-top-1'
                                      } left-4 w-2 h-2 bg-gray-900 transform rotate-45`}></div>

                                    {/* Tooltip Content */}
                                    <div className="relative bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                                      {sku.sku_name}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* DISPLAY NAME */}
                          <td className="px-2 py-1">
                            <div className="relative group">
                              <input
                                className={`${inputCell} truncate`}
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

                              {/* TOOLTIP */}
                              {sku.display_name && sku.display_name.length > 15 && (
                                <div className={`pointer-events-none absolute z-[9999] left-0 ${skuIndex >= product.product_skus.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`}>
                                  <div className="relative">
                                    {/* Tooltip Arrow */}
                                    <div className={`absolute ${skuIndex >= product.product_skus.length - 2 ? 'bottom-0 -mb-1' : '-top-1'
                                      } left-4 w-2 h-2 bg-gray-900 transform rotate-45`}></div>

                                    {/* Tooltip Content */}
                                    <div className="relative bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                                      {sku.display_name}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* SKU CODE */}
                          <td className="px-2 py-1">
                            <div className="relative group">
                              <input
                                className={`${inputCell} truncate`}
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

                              {/* TOOLTIP */}
                              {sku.sku_code && sku.sku_code.length > 10 && (
                                <div className={`pointer-events-none absolute z-[9999] left-0 ${skuIndex >= product.product_skus.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                                  } opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`}>
                                  <div className="relative">
                                    {/* Tooltip Arrow */}
                                    <div className={`absolute ${skuIndex >= product.product_skus.length - 2 ? 'bottom-0 -mb-1' : '-top-1'
                                      } left-4 w-2 h-2 bg-gray-900 transform rotate-45`}></div>

                                    {/* Tooltip Content */}
                                    <div className="relative bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                                      {sku.sku_code}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-1">
                            <input
                              type="number"
                              min="1"
                              className={inputCell}
                              value={
                                pricingMode === "conversion"
                                  ? sku.conversion_factor ?? globalPricing.conversion_factor
                                  : sku.multiplication_factor ?? globalPricing.multiplication_factor
                              }
                              onWheel={(e) => e.target.blur()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const newFactor = raw === "" ? "" : Number(raw);

                                setProducts(prev =>
                                  prev.map((p, pIdx) => {
                                    if (pIdx !== productIndex) return p;

                                    return {
                                      ...p,
                                      product_skus: p.product_skus.map((s, sIdx) => {
                                        if (sIdx !== skuIndex) return s;

                                        if (pricingMode === "conversion") {
                                          const newUnit =
                                            s.mrp && newFactor
                                              ? Number((Number(s.mrp) / newFactor).toFixed(2))
                                              : "";

                                          return {
                                            ...s,
                                            conversion_factor: newFactor,
                                            unit_price: newUnit
                                          };
                                        }

                                        if (pricingMode === "multiplication") {
                                          const newMrp =
                                            s.unit_price && newFactor
                                              ? Number((Number(s.unit_price) * newFactor).toFixed(2))
                                              : "";

                                          return {
                                            ...s,
                                            multiplication_factor: newFactor,
                                            mrp: newMrp,
                                            selling_price: newMrp
                                          };
                                        }

                                        return s;
                                      })
                                    };
                                  })
                                );
                              }}
                            />
                          </td>

                          {/* MRP / SELLING / UNIT */}
                          {/*  DYNAMIC PRICING INPUTS WITH AUTO-CALCULATION */}
                          {pricingMode === "conversion" ? (
                            <>
                              {/* MRP (User enters) */}
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="1"
                                  className={inputCell}
                                  value={sku.mrp ?? ""}
                                  onWheel={(e) => e.target.blur()}
                                  onChange={(e) => {
                                    const mrpValue = e.target.value;
                                    const factor =
                                      sku.conversion_factor ?? globalPricing.conversion_factor;

                                    const unitPrice = mrpValue && factor
                                      ? Number((Number(mrpValue) / factor).toFixed(2))
                                      : "";

                                    setProducts(prev =>
                                      prev.map((p, pIdx) =>
                                        pIdx === productIndex
                                          ? {
                                            ...p,
                                            product_skus: p.product_skus.map((s, sIdx) =>
                                              sIdx === skuIndex
                                                ? { ...s, mrp: mrpValue, unit_price: unitPrice, selling_price: mrpValue }
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
                                  min="1"
                                  className={`${inputCell} bg-gray-100`}
                                  value={sku.unit_price ?? ""}
                                  onWheel={(e) => e.target.blur()}
                                  disabled
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
                                  min="1"
                                  className={inputCell}
                                  value={sku.selling_price ?? ""}
                                  onWheel={(e) => e.target.blur()}
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
                                  min="1"
                                  className={inputCell}
                                  value={sku.unit_price ?? ""}
                                  onWheel={(e) => e.target.blur()}
                                  onChange={(e) => {
                                    const unitValue = e.target.value;
                                    const factor =
                                      sku.multiplication_factor ?? globalPricing.multiplication_factor;

                                    const calculatedPrice = unitValue && factor
                                      ? Number((Number(unitValue) * factor).toFixed(2))
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
                                  min="1"
                                  className={`${inputCell} bg-gray-100`}
                                  value={sku.mrp ?? ""}
                                  onWheel={(e) => e.target.blur()}
                                  disabled
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
                                  min="1"
                                  className={`${inputCell} bg-gray-100`}
                                  value={sku.selling_price ?? ""}
                                  onWheel={(e) => e.target.blur()}
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

                          {/* STATUS */}
                          <td className="px-1 py-1">
                            <select
                              className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                              value={sku.status ?? "active"}
                              onChange={(e) => {
                                const value = e.target.value;

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
                                );
                              }}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="deleted">Deleted</option>
                            </select>
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
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {/* EMPTY STATE - Show upload icon when no media */}
                              {(!sku.sku_media || sku.sku_media.length === 0) && (
                                <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                  <Upload size={18} className="text-blue-600" />
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files || []);
                                      if (!files.length) return;

                                      // Show loading state
                                      const tempId = Date.now();
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
                                                      {
                                                        id: tempId,
                                                        uploading: true,
                                                        name: 'Uploading...'
                                                      }
                                                    ]
                                                  }
                                                  : s
                                              )
                                            }
                                            : p
                                        )
                                      );

                                      try {
                                        // Upload to S3 immediately
                                        const formData = new FormData();
                                        files.forEach(file => formData.append('file', file));
                                        formData.append('media_for', 'sku');

                                        const response = await fetch(
                                          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/upload_media`,
                                          {
                                            method: 'POST',
                                            body: formData
                                          }
                                        );

                                        if (!response.ok) throw new Error('Upload failed');

                                        const result = await response.json();
                                        const uploadedUrls = result.data?.media_url ? [result.data.media_url] : [];

                                        setProducts(prev =>
                                          prev.map((p, pIdx) =>
                                            pIdx === productIndex
                                              ? {
                                                ...p,
                                                product_skus: p.product_skus.map((s, sIdx) =>
                                                  sIdx === skuIndex
                                                    ? {
                                                      ...s,
                                                      sku_media: files.map((file, idx) => ({
                                                        id: Date.now() + idx,
                                                        name: file.name,
                                                        url: uploadedUrls[idx] || URL.createObjectURL(file),
                                                        uploadedUrl: uploadedUrls[idx],
                                                        sequence: idx + 1,
                                                        active: true
                                                      }))
                                                    }
                                                    : s
                                                )
                                              }
                                              : p
                                          )
                                        );

                                        toast.success(`${files.length} image(s) uploaded`);
                                      } catch (error) {
                                        console.error('Upload error:', error);
                                        toast.error('Upload failed');

                                        // Remove loading state on error
                                        setProducts(prev =>
                                          prev.map((p, pIdx) =>
                                            pIdx === productIndex
                                              ? {
                                                ...p,
                                                product_skus: p.product_skus.map((s, sIdx) =>
                                                  sIdx === skuIndex
                                                    ? { ...s, sku_media: [] }
                                                    : s
                                                )
                                              }
                                              : p
                                          )
                                        );
                                      }

                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              )}

                              {/* UPLOADING STATE */}
                              {sku.sku_media?.some(m => m.uploading) && (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                  </div>
                                  <span className="text-xs text-gray-500">Uploading...</span>
                                </div>
                              )}

                              {/* MEDIA PREVIEW (When media exists and not uploading) */}
                              {sku.sku_media?.length > 0 && !sku.sku_media.some(m => m.uploading) && (
                                <div className="flex items-center gap-2">
                                  {/* PRIMARY IMAGE (First image, bigger)
                                  {(() => {
                                    const primary = sku.sku_media.find(m => m.sequence === 1) || sku.sku_media[0];
                                    return (
                                      <div className="relative group">
                                        <img
                                          src={primary.url || primary.uploadedUrl}
                                          alt="Primary"
                                          className="w-16 h-16 object-cover rounded border-2 border-blue-500"
                                        />
                                        <span className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-[10px] text-center py-0.5 rounded-b">
                                          Primary
                                        </span>
                                      </div>
                                    );
                                  })()} */}

                                  {/* VIEW ALL BUTTON (if more than 1 image) */}
                                  {sku.sku_media.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMediaPopup({
                                          productIndex,
                                          skuIndex,
                                          media: sku.sku_media,
                                          isProductLevel: false,
                                          onSetPrimary: (id) => {
                                            setProducts(prev =>
                                              prev.map((p, pIdx) =>
                                                pIdx === productIndex
                                                  ? {
                                                    ...p,
                                                    product_skus: p.product_skus.map((s, sIdx) =>
                                                      sIdx === skuIndex
                                                        ? {
                                                          ...s,
                                                          sku_media: s.sku_media.map(m => ({
                                                            ...m,
                                                            sequence: m.id === id ? 1 : m.sequence > 1 ? m.sequence : m.sequence + 1
                                                          }))
                                                        }
                                                        : s
                                                    )
                                                  }
                                                  : p
                                              )
                                            );
                                          },
                                          onRemove: (id) => {
                                            setProducts(prev =>
                                              prev.map((p, pIdx) =>
                                                pIdx === productIndex
                                                  ? {
                                                    ...p,
                                                    product_skus: p.product_skus.map((s, sIdx) =>
                                                      sIdx === skuIndex
                                                        ? {
                                                          ...s,
                                                          sku_media: s.sku_media
                                                            .filter(m => m.id !== id)
                                                            .map((m, idx) => ({ ...m, sequence: idx + 1 }))
                                                        }
                                                        : s
                                                    )
                                                  }
                                                  : p
                                              )
                                            );
                                          }
                                        })
                                      }
                                      className="flex flex-col items-center justify-center w-10 h-10 border border-gray-300 rounded hover:border-blue-500 transition-colors cursor-pointer"
                                    >
                                      <Image size={16} className="text-gray-600" />
                                      <span className="text-[10px] font-semibold text-gray-700">
                                        +{sku.sku_media.length - 1}
                                      </span>
                                    </button>
                                  )}

                                  {/* ADD MORE BUTTON */}
                                  <label className="cursor-pointer flex items-center justify-center w-10 h-10 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 transition-colors">
                                    <Plus size={18} className="text-gray-400" />
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (!files.length) return;

                                        // Show loading state
                                        const loadingIds = files.map((_, idx) => Date.now() + idx);
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
                                                        ...loadingIds.map(id => ({
                                                          id,
                                                          uploading: true,
                                                          name: 'Uploading...'
                                                        }))
                                                      ]
                                                    }
                                                    : s
                                                )
                                              }
                                              : p
                                          )
                                        );

                                        try {
                                          // Upload to S3
                                          const formData = new FormData();
                                          files.forEach(file => formData.append('file', file));
                                          formData.append('media_for', 'sku');

                                          const response = await fetch(
                                            `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/upload_media`,
                                            {
                                              method: 'POST',
                                              body: formData
                                            }
                                          );

                                          if (!response.ok) throw new Error('Upload failed');

                                          const result = await response.json();
                                          const uploadedUrls = result.data?.media_url ? [result.data.media_url] : [];

                                          // Replace loading items with uploaded media
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
                                                          ...(s.sku_media?.filter(m => !m.uploading) || []),
                                                          ...files.map((file, idx) => ({
                                                            id: Date.now() + idx + 1000,
                                                            name: file.name,
                                                            url: uploadedUrls[idx] || URL.createObjectURL(file),
                                                            uploadedUrl: uploadedUrls[idx],
                                                            sequence: (s.sku_media?.filter(m => !m.uploading).length || 0) + idx + 1,
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

                                          toast.success(`${files.length} image(s) uploaded`);
                                        } catch (error) {
                                          console.error('Upload error:', error);
                                          toast.error('Upload failed');

                                          // Remove loading items on error
                                          setProducts(prev =>
                                            prev.map((p, pIdx) =>
                                              pIdx === productIndex
                                                ? {
                                                  ...p,
                                                  product_skus: p.product_skus.map((s, sIdx) =>
                                                    sIdx === skuIndex
                                                      ? {
                                                        ...s,
                                                        sku_media: s.sku_media?.filter(m => !m.uploading) || []
                                                      }
                                                      : s
                                                  )
                                                }
                                                : p
                                            )
                                          );
                                        }

                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* DELETE */}
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={async () => {
                                let cascadeProductName = null;
                                const ok = await confirm("Are you sure you want to delete this ? ");
                                if (!ok) return;
                                setProducts(prev => {
                                  const updated = prev.map((p, pIdx) =>
                                    pIdx === productIndex
                                      ? {
                                        ...p,
                                        product_skus: p.product_skus.filter((_, idx) => idx !== skuIndex)
                                      }
                                      : p
                                  );

                                  const productAfterDelete = updated[productIndex];

                                  if (productAfterDelete.product_skus.length === 0) {
                                    cascadeProductName = productAfterDelete.name;
                                    return updated.filter((_, idx) => idx !== productIndex);
                                  }

                                  return updated;
                                });

                                if (cascadeProductName) {
                                  setPendingCascadeDelete(cascadeProductName);
                                }
                              }}

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

      {mediaPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {mediaPopup.isProductLevel ? 'Product Media' : 'SKU Media'}
              </h3>
              <button
                onClick={() => setMediaPopup(null)}
                className="text-gray-400 border-2 p-1 rounded-md hover:text-gray-50 hover:bg-red-500 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {mediaPopup.media?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No media uploaded
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaPopup.media
                    ?.filter(m => !m.uploading)
                    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                    .map((media) => {
                      const isPrimary = media.sequence === 1;
                      return (
                        <div
                          key={media.id}
                          className={`relative group rounded-lg overflow-hidden ${isPrimary ? 'ring-2 ring-blue-500' : 'border border-gray-200'
                            }`}
                        >
                          <img
                            src={media.url || media.uploadedUrl || media.previewUrl}
                            alt={media.name}
                            className="w-full h-48 object-cover"
                          />

                          {/* Overlay with actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {!isPrimary && (
                              <button
                                onClick={() => {
                                  mediaPopup.onSetPrimary?.(media.id);
                                  setMediaPopup(null);
                                }}
                                className="px-4 py-2 bg-blue-600 text-gray-200 text-sm rounded hover:bg-blue-800 cursor-pointer"
                              >
                                Set as Primary
                              </button>
                            )}
                            <button
                              onClick={() => {
                                mediaPopup.onRemove?.(media.id);
                                // Close popup if no media left
                                if (mediaPopup.media.filter(m => !m.uploading).length <= 1) {
                                  setMediaPopup(null);
                                }
                              }}
                              className="px-4 py-2 bg-red-500 text-gray-200 text-sm rounded hover:bg-red-800 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Primary badge */}
                          {isPrimary && (
                            <span className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
                              Primary
                            </span>
                          )}

                          {/* Sequence number */}
                          <span className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-xs">
                            {media.sequence || 1}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setMediaPopup(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-400 hover:text-gray-100 transition-colors font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PRODUCT CONTENT */}
      <ProductContentSection
        productContents={productContents}
        setProductContents={setProductContents}
      />

      {/* GLOBAL PRODUCT MEDIA */}
      <ProductMediaSection
        productMedia={productMedia}
        setProductMedia={setProductMedia}
      // uploadMediaFiles={uploadMediaFiles}
      // setMediaPopup={setMediaPopup}
      />

    </div>
  );
}

function ProductContentSection({ productContents, setProductContents }) {

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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-blue-500"
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

function ProductMediaSection({ productMedia, setProductMedia }) {
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
        formData.append('media_for', 'product');

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
      const maxSequence = productMedia.length > 0
        ? Math.max(...productMedia.map(m => m.sequence))
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
      if (productMedia.length === 0 && newMedia.length > 0) {
        newMedia[0].sequence = 1;
      }

      setProductMedia(prev => [...prev, ...newMedia]);
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
    setProductMedia(prev => {
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
    const mediaToRemove = productMedia.find(m => m.id === id);

    if (mediaToRemove?.sequence === 1) {
      toast.error('Cannot remove primary image');
      return;
    }

    setProductMedia(prev => {
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

  const primary = productMedia.find(m => m.sequence === 1);
  const otherImages = productMedia.filter(m => m.sequence !== 1).sort((a, b) => a.sequence - b.sequence);
  const visibleImages = otherImages.slice(0, 3);
  const hiddenCount = otherImages.length - 3;

  return (
    <>
      <div className="border border-gray-200 rounded p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-900">Product Media</h4>

        {productMedia.length === 0 ? (
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
                <div className="relative group shrink-0 w-40 h-40">
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
                <div key={m.id} className="relative group flex-shrink-0 w-28 h-28">
                  <img
                    src={m.media_url}
                    className="w-full h-full object-cover rounded-lg border border-gray-300"
                    alt="SKU"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center gap-1.5">
                    <button
                      onClick={() => setPrimary(m.id)}
                      className="px-2 py-1 bg-blue-500 text-white text-[10px] rounded hover:bg-blue-700 cursor-pointer"
                    >
                      Primary
                    </button>
                    <button
                      onClick={() => removeMedia(m.id)}
                      className="px-2 py-1 bg-red-500 text-white text-[10px] rounded hover:bg-red-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* ADD MORE (show if less than 4 images) */}
              {/* {productMedia.length < 4 && (
                <label className="shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
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
              )} */}

              {/* VIEW ALL BUTTON */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setMediaPopup(true)}
                  className="shrink-0 w-28 h-28 border border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:scale-110  cursor-pointer transition-colors"
                >
                  <Image className="h-4 w-4 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-900">+{hiddenCount}</span>
                  <span className="text-[10px] text-gray-500">View</span>
                </button>
              )}


              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition cursor-pointer">
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

            </div>

            {/* Add more button below grid (if 4+ images) */}
            {/* {productMedia.length >= 4 && (
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
            )} */}
          </div>
        )}
      </div>

      {/* Media Popup */}
      {mediaPopup && (
        <MediaPopup
          media={productMedia}
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
            className="text-gray-400 hover:text-gray-100 rounded hover:bg-red-500 p-2 cursor-pointer"
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
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-700 cursor-pointer"
                      >
                        Set as Primary
                      </button>
                      <button
                        onClick={() => onRemove(m.id)}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-700 cursor-pointer"
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
          <label className="w-64 ml-56 px-4 py-2 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-800 transition-colors cursor-pointer text-center">
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
            className="px-4 py-2 w-64 text-xs font-medium border border-gray-300 rounded hover:bg-gray-500 hover:text-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
