"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Loader2, Save, Edit2, ArrowLeft, Plus, X } from 'lucide-react';
import ProductAttributes from "./ProductAttributes";
import HierarchicalCategorySelector from "./HierarchicalCategorySelector";
import BrandSelector from "./BrandSelector";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";

function applyConversionPricing(sku, conv) {
  if (!sku.mrp || !conv) return sku;
  return {
    ...sku,
    unit_price: Number((sku.mrp / conv).toFixed(2))
  };
}

function applyMultiplicationPricing(sku, mult) {
  if (!sku.unit_price || !mult) return sku;
  const price = Number((sku.unit_price * mult).toFixed(2));
  return {
    ...sku,
    mrp: price,
    selling_price: price
  };
}

export default function ProductsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateNew = searchParams.get("createNew") === "true";
  const productId = searchParams.get("id") || null;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(isCreateNew);
  const [initialLoading, setInitialLoading] = useState(false);
  const [generatedProducts, setGeneratedProducts] = useState([
    {
      id: "base",
      name: "",
      product_contents: [{ content_type: "", content_value: "" }],
      content_media: []
    }
  ]);

  const [createFormData, setCreateFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    hsn_code: "",
    status: "active",
    category_id: null,
    brand_id: null,
    tax_type_id: null,
    min_order_quantity: 1,
    max_order_quantity: 1000,
    multiplication_order_quantity: 1,
    product_type: "goods",
    tracking_type: "untracked",
    selection_type: "fifo",
    returnable: true,
    requires_inventory: true,
    taxable: false,
    tags: []
  });

  const [editAndViewFormData, setEditAndViewFormData] = useState({
    id: null,
    code: "",
    slug: "",
    status: "",
    name: "",
    display_name: "",
    description: "",
    hsn_code: "",
    category_id: null,
    brand_id: null,
    tax_type_id: null,
    min_order_quantity: 1,
    max_order_quantity: 1000,
    multiplication_order_quantity: 1,
    product_type: "goods",
    tracking_type: "untracked",
    selection_type: "fifo",
    returnable: true,
    requires_inventory: true,
    tags: []
  });

  const formData = isCreateNew ? createFormData : editAndViewFormData;
  const setFormData = isCreateNew ? setCreateFormData : setEditAndViewFormData;

  const [products, setProducts] = useState([]);

  const [pricingMode, setPricingMode] = useState("conversion");
  // "conversion" | "multiplication"

  const [globalPricing, setGlobalPricing] = useState({
    conversion_factor: 1,
    multiplication_factor: 1,
    threshold_quantity: 1
  });

  function mapBackendDataToViewFormData(data) {
    setEditAndViewFormData({
      id: data.id,
      code: data.code,
      slug: data.slug,
      status: data.status,
      name: data.name,
      display_name: data.display_name,
      description: data.description || "",
      hsn_code: data.hsn_code || "",
      category_id: data.category?.id ?? null,
      brand_id: data.brand?.id ?? null,
      tax_type_id: data.tax_type?.id ?? null,
      min_order_quantity: data.min_order_quantity,
      max_order_quantity: data.max_order_quantity,
      multiplication_order_quantity: data.multiplication_order_quantity,
      product_type: data.product_type,
      tracking_type: data.tracking_type,
      selection_type: data.selection_type,
      returnable: data.returnable,
      requires_inventory: data.requires_inventory,
      tags: data.tags || [],

      // ✅ ADD THESE LINES
      products: data.products || [],
      product_contents: data.product_contents || [],
      product_media: data.product_media || []
    });
  }

  useEffect(() => {
    if (!isCreateNew && productId) {
      fetchProductDetails();
    }
  }, [isCreateNew, productId]);

  async function fetchProductDetails() {
    try {
      setInitialLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product details");
      const result = await response.json();
      mapBackendDataToViewFormData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  }

  // ✅ ADD THIS ENTIRE useEffect
  useEffect(() => {
    if (!isCreateNew && editAndViewFormData.id) {
      // Populate generatedProducts from backend data
      const backendProducts = editAndViewFormData.products || [];

      const transformedGeneratedProducts = backendProducts.map((prod, idx) => ({
        id: idx + 1,
        name: prod.name.replace(editAndViewFormData.name + " ", ""), // Remove base product name
        properties: prod.product_properties?.map(p => ({
          name: p.property_name,
          value: p.property_value
        })) || [],
        skuCount: prod.product_skus?.length || 0,
        content_type: prod.product_contents?.[0]?.content_type || "",
        content_values: prod.product_contents?.map(c => c.content_value) || [],
        content_media: prod.product_media?.map((m, i) => ({
          id: Date.now() + i,
          name: `media-${i}`,
          url: m.media_url,
          uploadedUrl: m.media_url,
          active: m.active
        })) || []
      }));

      setGeneratedProducts(transformedGeneratedProducts);

      // Populate products (SKUs)
      const transformedProducts = backendProducts.map(prod => ({
        name: prod.name,
        display_name: prod.display_name,
        product_properties: prod.product_properties || [],
        product_skus: prod.product_skus?.map(sku => ({
          sku_name: sku.sku_name,
          sku_code: sku.sku_code || "",
          display_name: sku.display_name,
          display_name_edited: sku.display_name !== sku.sku_name,
          mrp: sku.mrp || "",
          selling_price: sku.selling_price || "",
          unit_price: sku.unit_price || "",
          dimension: sku.dimension || "",
          weight: sku.weight || "",
          conversion_factor: sku.conversion_factor || 1,
          multiplication_factor: sku.multiplication_factor || 1,
          uom: sku.uom || "pcs",
          threshold_quantity: sku.threshold_quantity || 1,
          status: sku.status || "active",
          master: sku.master || false,
          option_type_values: sku.option_type_values || [],
          sku_media: sku.sku_media?.map((m, i) => ({
            id: Date.now() + i,
            name: `sku-media-${i}`,
            url: m.media_url,
            uploadedUrl: m.media_url,
            active: m.active
          })) || []
        })) || []
      }));

      setProducts(transformedProducts);
    }
  }, [isCreateNew, editAndViewFormData.id]);

  // ✅ UPLOAD MEDIA HELPER FUNCTION
  async function uploadMediaFiles(files, mediaFor = "product") {
    if (!files || files.length === 0) return [];

    const uploadedUrls = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        // ✅ Handle both File objects and objects with .file property
        const actualFile = file instanceof File ? file : file.file;
        if (!actualFile) continue;

        formData.append('file', actualFile);
        formData.append('media_for', mediaFor);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/upload_media`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to upload ${actualFile.name}`);
        }

        const result = await response.json();
        uploadedUrls.push(result.data.url);
      } catch (err) {
        console.error(`Error uploading file:`, err);
        toast.error(`Failed to upload file`);
      }
    }

    return uploadedUrls;
  }

  function buildCreateProductPayload(formData, products) {
    return {
      product: {
        description: formData.description,
        hsn_code: formData.hsn_code,
        min_order_quantity: Number(formData.min_order_quantity),
        max_order_quantity: Number(formData.max_order_quantity),
        multiplication_order_quantity: Number(formData.multiplication_order_quantity),
        status: formData.status,
        product_type: formData.product_type,
        category_id: formData.category_id,
        brand_id: formData.brand_id,
        tax_type_id: formData.tax_type_id,
        returnable: formData.returnable,
        tracking_type: formData.tracking_type,
        selection_type: formData.selection_type,
        requires_inventory: formData.requires_inventory,
        tags: formData.tags || [],

        products: products
          .filter(p => p.product_skus?.length > 0)
          .map(p => ({
            name: `${p.name}-${p.product_properties
              .map(pp => pp.property_value)
              .join("-")}`.toLowerCase().replace(/\s+/g, "_"),
            display_name: p.display_name || p.name,

            product_properties: p.product_properties || [],

            product_skus: p.product_skus.map((sku, i) => ({
              sku_name: sku.sku_name,
              sku_code: sku.sku_code || "",
              display_name: sku.display_name || sku.sku_name,
              mrp: Number(sku.mrp),
              selling_price: Number(sku.selling_price),
              unit_price: Number(sku.unit_price),
              dimension: sku.dimension || "",
              weight: sku.weight ? Number(sku.weight) : null,
              conversion_factor: Number(sku.conversion_factor) || 1,
              multiplication_factor: Number(sku.multiplication_factor) || 1,
              uom: sku.uom,
              threshold_quantity: Number(sku.threshold_quantity) || 1,
              status: sku.status,
              master: sku.master,

              option_type_values: sku.option_type_values || [],

              sku_media: (sku.sku_media || [])
                .filter(m => m.uploadedUrl)
                .map((m, idx) => ({
                  media_type: "image",
                  media_url: m.uploadedUrl,
                  active: true,
                  sequence: idx + 1
                }))
            }))
          })),

        product_contents: [],
        product_media: []
      }
    };
  }

  function validateBeforeSubmit(formData, products) {
    if (!formData.hsn_code?.trim()) return "HSN code is required";
    if (!formData.category_id) return "Category is required";

    if (!products || products.length === 0) {
      return "At least one product variant is required";
    }

    for (const p of products) {
      if (!p.product_skus || p.product_skus.length === 0) {
        return `Product "${p.name}" must have at least one SKU`;
      }

      const hasValidSku = p.product_skus.some(sku => sku.sku_name?.trim());
      if (!hasValidSku) {
        return `Product "${p.name}" must have at least one valid SKU with a name`;
      }
    }

    return null;
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      const validationError = validateBeforeSubmit(formData, products);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // ✅ EXTRACT AND UPLOAD MEDIA
      const { product_contents, product_media } = await extractAndUploadContentsAndMedia(generatedProducts);

      const basePayload = buildCreateProductPayload(formData, products);

      const payload = {
        product: {
          ...basePayload.product,
          product_contents,
          product_media
        }
      };

      console.log("=== FINAL PAYLOAD ===");
      console.log(JSON.stringify(payload, null, 2));

      // ✅ DETERMINE METHOD AND URL
      const method = isCreateNew ? "POST" : "PUT";
      const url = isCreateNew
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/${productId}`;

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("=== BACKEND ERROR ===", result);

        let errorMessage = isCreateNew ? "Failed to create product" : "Failed to update product";

        if (Array.isArray(result?.errors)) {
          errorMessage = result.errors.join(", ");
        } else if (typeof result?.errors === "object") {
          errorMessage = Object.entries(result.errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("; ");
        } else if (typeof result?.message === "string") {
          errorMessage = result.message;
        } else if (typeof result?.error === "string") {
          errorMessage = result.error;
        }

        throw new Error(errorMessage);
      }

      toast.success(isCreateNew ? "Product created successfully" : "Product updated successfully");

      setProducts([]);
      setGeneratedProducts([]);

      router.push("/catalog/products");

    } catch (err) {
      console.error("=== SUBMIT ERROR ===", err);
      toast.error(err.message || `An error occurred while ${isCreateNew ? 'creating' : 'updating'} the product`);
    } finally {
      setLoading(false);
    }
  }

  // ✅ UPDATED TO UPLOAD MEDIA
  async function extractAndUploadContentsAndMedia(generatedProducts) {
    const product_contents = [];
    const product_media = [];

    for (const p of generatedProducts) {
      // Extract contents
      if (p.content_type && p.content_values?.length) {
        p.content_values.forEach(val => {
          product_contents.push({
            content_type: p.content_type,
            content_value: val
          });
        });
      }

      // Upload and extract media
      if (p.content_media?.length) {
        const filesToUpload = p.content_media
          .filter(m => !m.uploadedUrl && m.file)
          .map(m => m.file);

        if (filesToUpload.length > 0) {
          const uploadedUrls = await uploadMediaFiles(filesToUpload, 'product');

          // Add uploaded URLs to product_media
          uploadedUrls.forEach((url, i) => {
            product_media.push({
              media_type: "image",
              media_url: url,
              active: true,
              sequence: product_media.length + i + 1
            });
          });
        }

        // Also include already uploaded media
        p.content_media
          .filter(m => m.uploadedUrl)   // 🚨 REQUIRED
          .forEach((m, i) => {
            product_media.push({
              media_type: "image",
              media_url: m.uploadedUrl,  // ✅ S3 URL
              active: true,
              sequence: product_media.length + 1
            });
          });
      }
    }

    return { product_contents, product_media };
  }

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors border cursor-pointer border-gray-200 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isCreateNew ? 'Create New Product' : 'Product Details'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isCreateNew
                  ? 'Fill in the details to create a new product'
                  : isEditing
                    ? 'Edit product information'
                    : 'View product information'}
              </p>
            </div>
          </div>

          <button
            onClick={isCreateNew ? handleSubmit : () => setIsEditing(!isEditing)}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${isCreateNew
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : isEditing
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''} cursor-pointer`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isCreateNew ? 'Creating...' : 'Saving...'}
              </>
            ) : isCreateNew ? (
              <>
                <Plus className="w-4 h-4" />
                Save
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      <div className="w-full mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <MainProductInformation
              formData={formData}
              setFormData={setFormData}
              pricingMode={pricingMode}
              setPricingMode={setPricingMode}
              globalPricing={globalPricing}
              setGlobalPricing={setGlobalPricing}
            />
          </div>
          <div className="col-span-4">
            <ProductSettings
              formData={formData}
              setFormData={setFormData}
            />
          </div>
          <div className="col-span-12">
            <ProductAttributes
              formData={formData}
              products={products}
              setProducts={setProducts}
              generatedProducts={generatedProducts}
              setGeneratedProducts={setGeneratedProducts}
              uploadMediaFiles={uploadMediaFiles}
              isCreateNew={isCreateNew}
              pricingMode={pricingMode}
              globalPricing={globalPricing}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MainProductInformation({
  formData,
  setFormData,
  pricingMode,
  setPricingMode,
  globalPricing,
  setGlobalPricing
}) {
  const [tagInput, setTagInput] = useState("");
  const [displayNameTouched, setDisplayNameTouched] = useState(false);

  const addTag = () => {
    if (!tagInput.trim()) return;

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));

    setTagInput("");
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm shadow-gray-200/60 p-4 space-y-2">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Main Product Information
        </h2>
        <div className="mt-2 h-px bg-gray-200" />
      </div>

      {/* Product Type */}
      <div className="space-y-2">
        <label className="label">Product Type</label>
        <div className="flex gap-6">
          {["goods", "service"].map(type => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={formData.product_type === type}
                onChange={() =>
                  setFormData(p => ({ ...p, product_type: type }))
                }
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Name Row */}
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="Product Name"
          required
          placeholder="e.g. Commercial Plywood"
          value={formData.name}
          onChange={e => {
            setFormData(p => ({
              ...p,
              name: e.target.value,
              display_name: displayNameTouched ? p.display_name : e.target.value
            }));
          }}
        />
        <Input
          label="Display Name"
          placeholder="Shown to customers"
          value={formData.display_name}
          onChange={e => {
            setDisplayNameTouched(true);
            setFormData(p => ({ ...p, display_name: e.target.value }));
          }}
        />
      </div>

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Short product description"
        value={formData.description}
        onChange={e =>
          setFormData(p => ({ ...p, description: e.target.value }))
        }
      />

      {/* HSN */}
      <Input
        label="HSN Code"
        required
        placeholder="e.g. 44129400"
        inputMode="numeric"
        value={formData.hsn_code}
        onChange={e =>
          setFormData(p => ({ ...p, hsn_code: e.target.value }))
        }
      />

      {/* Quantities */}
      <div>
        <label className="label">Order Quantities</label>
        <div className="grid grid-cols-3 gap-6 mt-2">
          {[
            ["Min Order Qty", "min_order_quantity"],
            ["Max Order Qty", "max_order_quantity"],
            ["Multiplication Qty", "multiplication_order_quantity"]
          ].map(([label, key]) => (
            <NumberInput
              key={key}
              label={label}
              value={formData[key]}
              onChange={value =>
                setFormData(p => ({ ...p, [key]: value }))
              }
            />
          ))}
        </div>
      </div>

      {/* Global Pricing Mode Toggle */}
      <div className="space-y-3 border-t pt-4 mt-4">
        <label className="label">Pricing Mode</label>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pricingMode"
              value="conversion"
              checked={pricingMode === "conversion"}
              onChange={(e) => setPricingMode(e.target.value)}
              className="accent-blue-600"
            />
            <span className="text-sm font-medium">Conversion Factor (MRP → Unit Price)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pricingMode"
              value="multiplication"
              checked={pricingMode === "multiplication"}
              onChange={(e) => setPricingMode(e.target.value)}
              className="accent-green-600"
            />
            <span className="text-sm font-medium">Multiplication Factor (Unit Price → MRP)</span>
          </label>
        </div>

        {/* Global Pricing Inputs */}
        <div className="grid grid-cols-3 gap-4 mt-3">
          {pricingMode === "conversion" ? (
            <NumberInput
              label="Conversion Factor"
              value={globalPricing.conversion_factor}
              onChange={value =>
                setGlobalPricing(p => ({ ...p, conversion_factor: value }))
              }
            />
          ) : (
            <NumberInput
              label="Multiplication Factor"
              value={globalPricing.multiplication_factor}
              onChange={value =>
                setGlobalPricing(p => ({ ...p, multiplication_factor: value }))
              }
            />
          )}

          <NumberInput
            label="Threshold Quantity"
            value={globalPricing.threshold_quantity}
            onChange={value =>
              setGlobalPricing(p => ({ ...p, threshold_quantity: value }))
            }
          />
        </div>

        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
          {pricingMode === "conversion" ? (
            <p>📊 <strong>Conversion Mode:</strong> In SKU table, enter MRP → Unit Price will be auto-calculated as MRP ÷ Conversion Factor</p>
          ) : (
            <p>📊 <strong>Multiplication Mode:</strong> In SKU table, enter Unit Price → MRP & Selling Price will be auto-calculated as Unit Price × Multiplication Factor</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="label">Tags</label>

        <div className="flex gap-3">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="Enter tag"
            className="input flex-1"
            onKeyDown={e => e.key === "Enter" && addTag()}
          />
          <button
            type="button"
            onClick={addTag}
            className="h-11 w-11 border border-gray-300 rounded-md
                       text-lg hover:bg-gray-100"
          >
            +
          </button>
        </div>

        {/* Tag Pills */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2 py-1
                           bg-blue-50 text-blue-700 rounded-md text-xs"
              >
                {tag}
                <button
                  onClick={() => removeTag(i)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ProductSettings({ formData, setFormData }) {
  const CATEGORY_OPTIONS = [
    { id: 1, name: "Plywood" },
    { id: 2, name: "Laminates" },
    { id: 3, name: "Furniture Boards" },
    { id: 4, name: "Hardware" }
  ];

  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);
  
  const [taxOptions, setTaxoptions] = useState([]);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);

  useEffect(() => {
    fetchCategoryOptions();
    fetchTaxOptions();
  }, []);

  async function fetchCategoryOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories list");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setCategoryOptions(namesArray);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchTaxOptions() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types?only_names=true`);
      if (!response.ok) throw new Error("Failed to fetch tax types");
      const result = await response.json();
      const namesArray = result.data.map(item => ({ id: item.id, name: item.name }));
      setTaxoptions(namesArray);
    } catch (err) {
      console.log(err);
    }
  }


  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm shadow-gray-200/60 p-4 space-y-3">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Product Settings
        </h2>
        <div className="mt-2 h-px bg-gray-200" />
      </div>

      <div className="space-y-2">
        <label className="label">Status</label>

        <div className="flex gap-6">
          {/* Active */}
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer
        ${formData.status === "active"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            <input
              type="radio"
              name="status"
              value="active"
              checked={formData.status === "active"}
              onChange={() =>
                setFormData(p => ({ ...p, status: "active" }))
              }
              className="accent-green-600"
            />
            <span className="text-sm font-medium">Active</span>
          </label>

          {/* Inactive */}
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer
        ${formData.status === "inactive"
                ? "border-gray-500 bg-gray-100 text-gray-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            <input
              type="radio"
              name="status"
              value="inactive"
              checked={formData.status === "inactive"}
              onChange={() =>
                setFormData(p => ({ ...p, status: "inactive" }))
              }
              className="accent-gray-600"
            />
            <span className="text-sm font-medium">Inactive</span>
          </label>

          {/* Deleted */}
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer
        ${formData.status === "deleted"
                ? "border-red-600 bg-gray-100 text-red-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            <input
              type="radio"
              name="status"
              value="deleted"
              checked={formData.status === "deleted"}
              onChange={() =>
                setFormData(p => ({ ...p, status: "deleted" }))
              }
              className="accent-red-600"
            />
            <span className="text-sm font-medium">Deleted</span>
          </label>
        </div>
      </div>

      {/* Category */}
      <HierarchicalCategorySelector
        selectedCategoryId={formData.category_id}
        onCategorySelect={(category) => {
          setFormData(prev => ({
            ...prev,
            category_id: category.id
          }));
        }}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Brand */}
      {/* <FieldWithAction
        label="Brand"
        actionLabel="+ Create Brand"
      >
        <select
          value={formData.brand_id ?? ""}
          onChange={(e) =>
            setFormData(p => ({
              ...p,
              brand_id: Number(e.target.value) || null
            }))
          }
          className="input bg-white"
        >
          <option value="">Select brand</option>
          {brandOptions.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </FieldWithAction> */}
      <BrandSelector
        selectedBrandId={formData.brand_id}
        onBrandSelect={(brand) => {
          setFormData(prev => ({ ...prev, brand_id: brand.id }));
        }}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Tracking Type - Using SearchableDropdown */}
      <SearchableDropdown
        label="Tracking Type"
        options={[
          { id: "untracked", name: "Untracked" },
          { id: "batch", name: "Batch" },
          { id: "serial", name: "Serial" }
        ]}
        value={formData.tracking_type}
        onChange={(value) => setFormData(p => ({ ...p, tracking_type: value }))}
        placeholder="Select tracking type"
      />

      {/* Selection Type - Using SearchableDropdown */}
      <SearchableDropdown
        label="Selection Type"
        options={[
          { id: "fifo", name: "FIFO" },
          { id: "lifo", name: "LIFO" },
          { id: "manual", name: "Manual" }
        ]}
        value={formData.selection_type}
        onChange={(value) => setFormData(p => ({ ...p, selection_type: value }))}
        placeholder="Select selection type"
      />

      {/* Toggle Fields */}
      <div className="space-y-2 my-2">
        {/* Taxable Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Taxable</label>
          <button
            type="button"
            onClick={() =>
              setFormData(p => ({ ...p, taxable: !p.taxable }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.taxable ? "bg-blue-600" : "bg-gray-300"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.taxable ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* Tax Type Dropdown (shown when taxable is enabled) */}
        {/* Tax Type - Using SearchableDropdown */}
        {formData.taxable && (
          <SearchableDropdown
            label="Tax Type"
            options={taxOptions}
            value={formData.tax_type_id}
            onChange={(value) => setFormData(p => ({ ...p, tax_type_id: value }))}
            placeholder="Select tax type"
          />
        )}

        {/* Returnable Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Returnable</label>
          <button
            type="button"
            onClick={() =>
              setFormData(p => ({ ...p, returnable: !p.returnable }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.returnable ? "bg-blue-600" : "bg-gray-300"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.returnable ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* Requires Inventory Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Requires Inventory</label>
          <button
            type="button"
            onClick={() =>
              setFormData(p => ({ ...p, requires_inventory: !p.requires_inventory }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.requires_inventory ? "bg-blue-600" : "bg-gray-300"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.requires_inventory ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}


function Input({ label, required, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input {...props} className="input" />
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 1 }) {
  return (
    <div className="space-y-1">
      <label className="label">{label}</label>

      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        min={min}
        step="any"
        className="input"

        // ✔ allow typing freely (string)
        onChange={(e) => {
          onChange(e.target.value);
        }}

        // ✔ normalize ONLY on blur
        onBlur={(e) => {
          const num = Number(e.target.value);

          if (!Number.isFinite(num) || num < min) {
            onChange(min);
          } else {
            onChange(num);
          }
        }}
      />
    </div>
  );
}


function Textarea({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="label">{label}</label>
      <textarea {...props} rows={4} className="input resize-none h-20" />
    </div>
  );
}

