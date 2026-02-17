"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Save, Edit2, ArrowLeft, Plus, X } from 'lucide-react';
import ProductCreationAttributes from "./ProductCreationAttributes";
import ProductUpdationAttributes from "./ProductUpdationAttributes";
import HierarchicalCategorySelector from "./HierarchicalCategorySelector";
import BrandSelector from "./BrandSelector";
import TaxSelector from "./TaxSelector";
import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import ProductDetailsSkeleton from "./ProductDetailsSkeleton";
import HeaderWithBackAction from "../../../../../../components/shared/HeaderWithBackAction";

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
      product_contents: [],
      content_media: []
    }
  ]);

  //  At the top of ProductsForm component
  const [productContents, setProductContents] = useState([
    { content_type: "", content_value: "" }
  ]);

  const [productMedia, setProductMedia] = useState([]);
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
    taxable: true,
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

  const [updateProperties, setUpdateProperties] = useState([]);
  const [updateContents, setUpdateContents] = useState([]);
  const [updateProductMedia, setUpdateProductMedia] = useState([]);

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
      category_id: data.sub_category?.id ?? null,
      parent_category: data.parent_category ?? null,
      sub_category: data.sub_category ?? null,
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

      products: data.products || [],
      product_contents: data.product_contents || [],
      product_media: data.product_media || []
    });
  }

  const [globalUom, setGlobalUom] = useState("piece");

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
      toast.error("Failed to fetch product details");
    } finally {
      setInitialLoading(false);
    }
  }

  //  UPLOAD MEDIA HELPER FUNCTION
  async function uploadMediaFiles(files, mediaFor = "product") {
    if (!files || files.length === 0) return [];

    const uploadedUrls = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        //  Handle both File objects and objects with .file property
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
            name: p.name,
            display_name: p.display_name || p.name,

            product_properties: p.product_properties || [],

            product_skus: p.product_skus.map((sku, i) => {
              const isConversion = pricingMode === "conversion";
              const isMultiplication = pricingMode === "multiplication";

              return {
                sku_name: sku.sku_name,
                sku_code: sku.sku_code || "",
                display_name: sku.display_name || sku.sku_name,
                mrp: Number(sku.mrp),
                selling_price: Number(sku.selling_price),
                unit_price: Number(sku.unit_price),
                dimension: sku.dimension || "",
                weight: sku.weight ? Number(sku.weight) : null,
                uom: globalUom,
                threshold_quantity: Number(globalPricing.threshold_quantity) || 1,
                status: sku.status,
                master: sku.master,

                ...(isConversion && {
                  conversion_factor: Number(sku.conversion_factor) || 1
                }),

                ...(isMultiplication && {
                  multiplication_factor: Number(sku.multiplication_factor) || 1
                }),

                option_type_values: sku.option_type_values || [],

                sku_media: (sku.sku_media || [])
                  .filter(m => m.uploadedUrl)
                  .map((m, idx) => ({
                    media_type: "image",
                    media_url: m.uploadedUrl,
                    active: true,
                    sequence: idx + 1
                  }))
              };
            })
          })),

        product_contents: [],
        product_media: []
      }
    };
  }

  function validateBeforeSubmit(formData, products) {
    if (!formData.hsn_code?.trim()) return "HSN code is required";
    if (!formData.category_id) return "Category is required";
    if (formData.taxable && !formData.tax_type_id) {
      return "Select tax type";
    }
    if (!products || products.length === 0) {
      return "At least one product variant is required";
    }

    for (let pIndex = 0; pIndex < products.length; pIndex++) {
      const p = products[pIndex];

      if (!p.product_skus || p.product_skus.length === 0) {
        return `Product "${p.name}" must have at least one SKU`;
      }

      // MASTER SKU VALIDATION (Exactly one master per product)
      const masterCount = p.product_skus.filter(sku => sku.master).length;

      if (masterCount !== 1) {
        return `Product "${p.name}" must have exactly one master SKU (Currently: ${masterCount})`;
      }

      for (let sIndex = 0; sIndex < p.product_skus.length; sIndex++) {
        const sku = p.product_skus[sIndex];

        if (!sku.sku_name?.trim()) {
          return `SKU name is required (Product: ${p.name}, SKU #${sIndex + 1})`;
        }

        if (!sku.sku_code?.trim()) {
          return `SKU code is required (Product: ${p.name}, SKU #${sIndex + 1})`;
        }

        if (sku.mrp <= 0 || sku.selling_price <= 0 || sku.unit_price <= 0) {
          return `Please enter all prices for product: ${p.name}, sku #${sIndex + 1}`
        }

        if (sku.selling_price > sku.mrp) {
          return `Selling price cannot be greater than mrp (change -> ${p.name}'s prices)`
        }

        if (!sku.uom) {
          return `UOM is required (Product: ${p.name}, SKU #${sIndex + 1})`;
        }
      }
    }

    return null;
  }

  function buildUpdateProductPayload(formData, properties, contents, productMedia) {
    const payload = {
      product: {
        name: formData.name,
        display_name: formData.display_name,
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
      }
    };

    // Add product_properties if they exist
    if (properties && properties.length > 0) {
      payload.product.product_properties = properties
        .filter(p => p.name && p.value)
        .map(p => {
          // EXISTING PROPERTY
          if (p.isExisting) {
            return {
              property_id: p.property_id,
              value_id: p.value_id,
              property_value: p.value
            };
          }
          // NEW PROPERTY
          return {
            property_name: p.name,
            property_value: p.value
          };

        });

    }

    // Add product_contents if they exist
    if (contents && contents.length > 0) {
      payload.product.product_contents = contents
        .filter(c => c.content_type && c.content_value)
        .map(c => {
          if (c.isExisting && c.id) {
            // Existing content with ID
            return {
              id: c.id,
              content_type: c.content_type,
              content_value: c.content_value
            };
          } else {
            // New content without ID
            return {
              content_type: c.content_type,
              content_value: c.content_value
            };
          }
        });
    }

    // Add product_media if they exist
    if (productMedia && productMedia.length > 0) {
      payload.product.product_media = productMedia.map(m => {
        if (m.isNew) {
          // New media without ID
          return {
            media_url: m.media_url,
            media_type: m.media_type || "image",
            active: m.active !== undefined ? m.active : true,
            sequence: m.sequence
          };
        } else {
          // Existing media with ID
          return {
            id: m.id,
            media_url: m.media_url,
            media_type: m.media_type,
            active: m.active,
            sequence: m.sequence
          };
        }
      });
    }

    return payload;
  }

  function validateUpdateProduct(formData, properties, contents, productMedia) {
    if (!formData.hsn_code?.trim()) return "HSN code is required";
    if (!formData.category_id) return "Category is required";
    if (formData.taxable && !formData.tax_type_id) {
      return "Select tax type";
    }

    // Validate properties
    if (properties && properties.length > 0) {
      for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        if (!prop.name?.trim()) {
          return `Property name is required at row ${i + 1}`;
        }
        if (!prop.value?.trim()) {
          return `Property value is required for "${prop.name}"`;
        }
      }
    }

    // Validate contents
    if (contents && contents.length > 0) {
      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        if (content.content_type?.trim() && !content.content_value?.trim()) {
          return `Content value is required for "${content.content_type}"`;
        }
        if (!content.content_type?.trim() && content.content_value?.trim()) {
          return `Content type is required at row ${i + 1}`;
        }
      }
    }

    return null; // All validations passed
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      if (isCreateNew) {
        // CREATE FLOW (existing logic)
        const validationError = validateBeforeSubmit(formData, products);
        if (validationError) {
          toast.error(validationError);
          return;
        }

        const product_media = productMedia
          .filter(m => m.media_url)
          .map((m, idx) => ({
            media_type: "image",
            media_url: m.media_url,
            active: true,
            sequence: m.sequence ?? idx + 1
          }));

        const product_contents = productContents
          .filter(c => c.content_type?.trim() && c.content_value?.trim())
          .map(c => ({
            content_type: c.content_type,
            content_value: c.content_value
          }));

        const basePayload = buildCreateProductPayload(formData, products);

        const payload = {
          product: {
            ...basePayload.product,
            product_contents,
            product_media
          }
        };

        console.log("=== CREATE PAYLOAD ===");
        console.log(JSON.stringify(payload, null, 2));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        const result = await response.json();

        if (!response.ok) {
          let errorMessage = "Something went wrong";
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

        toast.success("Product(s) created successfully");
        setProducts([]);
        setGeneratedProducts([]);
        const returnTo = searchParams.get("returnTo");

        router.push(
          `/catalog/products${returnTo ? `?${decodeURIComponent(returnTo)}` : ""}`
        );

      } else {
        const validationError = validateUpdateProduct(
          formData,
          updateProperties,
          updateContents,
          updateProductMedia
        );

        if (validationError) {
          toast.error(validationError);
          return;
        }

        const payload = buildUpdateProductPayload(
          formData,
          updateProperties,
          updateContents,
          updateProductMedia
        );

        console.log("=== UPDATE PAYLOAD ===");
        console.log(JSON.stringify(payload, null, 2));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/products/${productId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        const result = await response.json();

        if (!response.ok) {
          let errorMessage = "Failed to update product";
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

        // toast.success("Product updated successfully");
        toast.success("Product updated successfully");
        setTimeout(() => {
          setIsEditing(false);
          const returnTo = searchParams.get("returnTo");

          router.push(
            `/catalog/products${returnTo ? `?${decodeURIComponent(returnTo)}` : ""}`
          );
        }, 800);

        // Refresh product details
        if (!isCreateNew && productId) {
          fetchProductDetails();
        }
      }

    } catch (err) {
      console.error("=== SUBMIT ERROR ===", err);
      toast.error(err.message || `An error occurred while ${isCreateNew ? 'creating' : 'updating'} the product`);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading && !isCreateNew) return <ProductDetailsSkeleton />;

  return (
    <section className="min-h-screen bg-gray-50 px-2 py-4">

      {/* <div className="max-w-7xl">
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
            onClick={isCreateNew ? handleSubmit : isEditing ? handleSubmit : () => setIsEditing(true)}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${isCreateNew
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : isEditing
                ? 'bg-green-600 hover:bg-green-800 text-white'
                : 'bg-blue-600 hover:bg-blue-800 text-white'
              } ${loading ? 'opacity-60 ' : ''} cursor-pointer`}
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
      </div> */}

      <HeaderWithBackAction
        title={isCreateNew ? "Create New Product" : "Product Details"}
        onActionClick={isCreateNew ? handleSubmit : isEditing ? handleSubmit : () => setIsEditing(true)}
        isEditing={isEditing}
        defaultBackPath="/catalog/products"
        loading={loading}
      />

      <div className="w-full mx-auto mt-2">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <MainProductInformation
              formData={formData}
              setFormData={setFormData}
              pricingMode={pricingMode}
              setPricingMode={setPricingMode}
              globalPricing={globalPricing}
              setGlobalPricing={setGlobalPricing}
              setProducts={setProducts}
              isCreateNew={isCreateNew}
              isEditing={isEditing}
              globalUom={globalUom}
              setGlobalUom={setGlobalUom}
            />
          </div>
          <div className="col-span-4">
            <ProductSettings
              formData={formData}
              setFormData={setFormData}
              isCreateNew={isCreateNew}
              isEditing={isEditing}
            />
          </div>
          <div className="col-span-12">
            {isCreateNew ? (
              <ProductCreationAttributes
                formData={formData}
                products={products}
                setProducts={setProducts}
                generatedProducts={generatedProducts}
                setGeneratedProducts={setGeneratedProducts}
                uploadMediaFiles={uploadMediaFiles}
                isCreateNew={isCreateNew}
                pricingMode={pricingMode}
                globalPricing={globalPricing}
                productContents={productContents}
                setProductContents={setProductContents}
                productMedia={productMedia}
                setProductMedia={setProductMedia}
              />
            ) : (
              <ProductUpdationAttributes
                productId={productId}
                formData={formData}
                products={products}
                setProducts={setProducts}
                isEditing={isEditing}
                pricingMode={pricingMode}
                globalPricing={globalPricing}
                onPropertiesChange={setUpdateProperties}
                onContentsChange={setUpdateContents}
                onMediaChange={setUpdateProductMedia}
              />
            )}
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
  setGlobalPricing,
  setProducts,
  isCreateNew,
  isEditing,
  globalUom,
  setGlobalUom
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

  // Determine if fields should be disabled
  const fieldsDisabled = !isCreateNew && !isEditing;

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
      {/* <div className="space-y-2">
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
                disabled={fieldsDisabled}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div> */}

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
          disabled={fieldsDisabled}
        />
        <Input
          label="Display Name"
          placeholder="Shown to customers"
          value={formData.display_name}
          onChange={e => {
            setDisplayNameTouched(true);
            setFormData(p => ({ ...p, display_name: e.target.value }));
          }}
          disabled={fieldsDisabled}
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
        disabled={fieldsDisabled}
        className="placeholder:text-gray-300"
      />

      {/* HSN */}
      <Input
        label="HSN Code"
        required
        placeholder="e.g. 44129400"
        inputMode="numeric"
        maxLength={8}
        value={formData.hsn_code}
        onChange={e => {
          const digitsOnly = e.target.value.replace(/\D/g, ""); // remove letters
          setFormData(p => ({
            ...p,
            hsn_code: digitsOnly.slice(0, 8) // limit to 8 digits
          }));
        }}
        disabled={fieldsDisabled}
      />

      {/* Quantities */}
      <div>
        <label className="label">Order Quantities</label>
        <div className="grid grid-cols-3 gap-6 ">
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
              disabled={fieldsDisabled}
            />
          ))}
        </div>
      </div>

      {/* Global Pricing Mode Toggle */}
      {isCreateNew && (
        <div className="space-y-3 border-t pt-4 mt-4">
          <label className="label">Pricing Mode </label>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingMode"
                value="conversion"
                checked={pricingMode === "conversion"}
                onChange={(e) => setPricingMode(e.target.value)}
                className="accent-blue-600"
                disabled={fieldsDisabled}
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
                disabled={fieldsDisabled}
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
                disabled={fieldsDisabled}
              />
            ) : (
              <NumberInput
                label="Multiplication Factor"
                value={globalPricing.multiplication_factor}
                onChange={value =>
                  setGlobalPricing(p => ({ ...p, multiplication_factor: value }))
                }
                disabled={fieldsDisabled}
              />
            )}

            <NumberInput
              label="Threshold Quantity"
              value={globalPricing.threshold_quantity}
              min={0}
              onChange={value =>
                setGlobalPricing(p => ({ ...p, threshold_quantity: value }))
              }
              disabled={fieldsDisabled}
            />

            <SearchableDropdown
              label="UOM"
              options={UOM_OPTIONS}
              value={globalUom}
              placeholder="Select UOM"
              onChange={(value) => {
                setGlobalUom(value);

                setProducts(prev =>
                  prev.map(product => ({
                    ...product,
                    product_skus: product.product_skus.map(sku => ({
                      ...sku,
                      uom: value
                    }))
                  }))
                );
              }}
              disabled={fieldsDisabled}
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
      )}

      {/* Tags */}
      <div className="space-y-2">
        <label className="label">Tags</label>

        <div className="flex gap-3">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="Enter tag"
            className={`input flex-1 ${fieldsDisabled ? 'opacity-60 bg-gray-50 border-gray-200 ' : ''}`}
            onKeyDown={e => e.key === "Enter" && addTag()}
            disabled={fieldsDisabled}
          />
          <button
            type="button"
            onClick={addTag}
            className={`h-11 w-11 border border-gray-300 rounded-md
                       text-lg hover:bg-gray-100 ${fieldsDisabled ? "opacity-60 " : "hover:bg-gray-100"}`}
            disabled={fieldsDisabled}
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
                  className="text-blue-500 hover:text-blue-700 disabled:opacity-60 disabled:"
                  disabled={fieldsDisabled}
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

function ProductSettings({ formData, setFormData, isCreateNew, isEditing }) {

  const [taxOptions, setTaxoptions] = useState([]);
  const [isTaxPopupOpen, setIsTaxPopupOpen] = useState(false);
  //const [categoryOptions, setCategoryOptions] = useState([]);

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
      // toast.error("Failed to fetch categories");
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
      toast.error("Failed to fetch Tax options");
    }
  }

  const handleTaxCreated = (newTax) => {
    // Refresh tax options after creating a new tax type
    fetchTaxOptions();
    // Optionally set the newly created tax as selected
    setFormData(prev => ({ ...prev, tax_type_id: newTax.id }));
  };

  // Determine if fields should be disabled
  const fieldsDisabled = !isCreateNew && !isEditing;

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
              } ${fieldsDisabled ? 'opacity-60 ' : ''}`}
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
              disabled={fieldsDisabled}
            />
            <span className="text-sm font-medium">Active</span>
          </label>

          {/* Inactive */}
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer
        ${formData.status === "inactive"
                ? "border-gray-500 bg-gray-100 text-gray-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              } ${fieldsDisabled ? 'opacity-60 ' : ''}`}
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
              disabled={fieldsDisabled}
            />
            <span className="text-sm font-medium">Inactive</span>
          </label>

          {/* Deleted */}
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer
        ${formData.status === "deleted"
                ? "border-red-600 bg-red-100 text-red-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              } ${fieldsDisabled ? 'opacity-60 ' : ''}`}
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
              disabled={fieldsDisabled}
            />
            <span className="text-sm font-medium">Deleted</span>
          </label>
        </div>
      </div>

      {/* Category */}
      <HierarchicalCategorySelector
        selectedParentCategory={formData.parent_category}
        selectedSubCategory={formData.sub_category}
        onCategorySelect={(child, parent) => {
          setFormData(prev => ({
            ...prev,
            category_id: child.id,
            parent_category: parent,
            sub_category: child
          }));
        }}
        disabled={fieldsDisabled}
        required={true}
      />

      {/* Brand */}
      <BrandSelector
        selectedBrandId={formData.brand_id}
        onBrandSelect={(brand) => {
          setFormData(prev => ({ ...prev, brand_id: brand.id }));
        }}
        formData={formData}
        setFormData={setFormData}
        disabled={fieldsDisabled}
      />

      {/* Tracking Type*/}
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
        disabled={fieldsDisabled}
      />

      {/* Selection Type */}
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
        disabled={fieldsDisabled}
      />

      {/* Toggle Fields */}
      <div className="space-y-2 my-2">
        {/* Taxable Toggle */}
        <TaxSelector
          selectedTaxId={formData.tax_type_id}
          onTaxSelect={(tax) => {
            // Optional: you can add any additional logic here if needed
            console.log('Selected tax:', tax);
          }}
          formData={formData}
          setFormData={setFormData}
          disabled={fieldsDisabled}
        />

        {/* Returnable Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Returnable</label>
          <button
            type="button"
            onClick={() =>
              setFormData(p => ({ ...p, returnable: !p.returnable }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.returnable ? "bg-blue-600" : "bg-gray-300"
              } ${fieldsDisabled ? 'opacity-60 ' : ''}`}
            disabled={fieldsDisabled}
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
              } ${fieldsDisabled ? 'opacity-60 ' : ''}`}
            disabled={fieldsDisabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.requires_inventory ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>
      </div>
      {/* Tax Type Popup */}
      <TaxTypePopup
        isOpen={isTaxPopupOpen}
        onClose={() => setIsTaxPopupOpen(false)}
        onTaxCreated={handleTaxCreated}
      />
    </div>
  );
}


function Input({ label, required, disabled, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        {...props}
        className={`input ${disabled ? 'opacity-60 text-gray-900 ' : ''}`}
        disabled={disabled}
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 1, disabled }) {
  return (
    <div className="space-y-1">
      <label className="label">{label}</label>

      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        min={min}
        step="any"
        className={`input ${disabled ? 'opacity-60  text-gray-900' : ''}`}
        disabled={disabled}
        onWheel={(e) => e.target.blur()}

        //  allow typing freely (string)
        onChange={(e) => {
          const raw = e.target.value;

          if (raw === "") {
            onChange("");
            return;
          }

          // If min = 0 → allow 0+
          if (min === 0) {
            if (/^\d+$/.test(raw)) {
              onChange(raw);
            }
          }

          // If min = 1 → allow 1+
          else {
            if (/^[1-9]\d*$/.test(raw)) {
              onChange(raw);
            }
          }
        }}

        // normalize ONLY on blur
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


function Textarea({ label, disabled, ...props }) {
  return (
    <div className="space-y-1">
      <label className="label">{label}</label>
      <textarea
        {...props}
        rows={4}
        className={`input resize-none h-20 ${disabled ? 'opacity-60  text-gray-900' : ''}`}
        disabled={disabled}
      />
    </div>
  );
}

function TaxTypePopup({ isOpen, onClose, onTaxCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    cgst: '',
    sgst: '',
    igst: 0,
    percentage: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate IGST and percentage whenever CGST or SGST changes
  useEffect(() => {
    const cgst = parseFloat(formData.cgst) || 0;
    const sgst = parseFloat(formData.sgst) || 0;
    const calculatedIgst = cgst + sgst;

    setFormData(prev => ({
      ...prev,
      igst: calculatedIgst,
      percentage: calculatedIgst
    }));
  }, [formData.cgst, formData.sgst]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Tax name is required');
      return;
    }
    if (!formData.code.trim()) {
      setError('Tax code is required');
      return;
    }
    if (!formData.cgst || parseFloat(formData.cgst) < 0) {
      setError('Valid CGST is required');
      return;
    }
    if (!formData.sgst || parseFloat(formData.sgst) < 0) {
      setError('Valid SGST is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
            cgst: parseFloat(formData.cgst),
            sgst: parseFloat(formData.sgst),
            igst: formData.igst,
            percentage: formData.percentage
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        let errorMessage = 'Failed to create tax type';

        if (Array.isArray(errorData?.errors)) {
          errorMessage = errorData.errors.join(', ');
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Reset form
      setFormData({
        name: '',
        code: '',
        cgst: '',
        sgst: '',
        igst: 0,
        percentage: 0
      });

      // Notify parent component
      if (onTaxCreated) {
        onTaxCreated(result.data);
      }

      onClose();
      toast.success("Tax type created");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      code: '',
      cgst: '',
      sgst: '',
      igst: 0,
      percentage: 0
    });
    setError('');
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Tax</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tax Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter tax name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tax Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Enter tax code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
          </div>

          {/* CGST and SGST in a row */}
          <div className="grid grid-cols-2 gap-4">
            {/* CGST */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CGST (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cgst}
                onChange={(e) => setFormData(prev => ({ ...prev, cgst: e.target.value }))}
                onWheel={(e) => e.target.blur()}
                placeholder="Enter CGST"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* SGST */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SGST (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sgst}
                onChange={(e) => setFormData(prev => ({ ...prev, sgst: e.target.value }))}
                onWheel={(e) => e.target.blur()}
                placeholder="Enter SGST"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* IGST (Auto-calculated, Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IGST (%) <span className="text-xs text-gray-500">(Auto-calculated)</span>
            </label>
            <input
              type="number"
              value={formData.igst}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 "
            />
          </div>

          {/* Percentage (Auto-calculated, Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Percentage (%) <span className="text-xs text-gray-500">(Auto-calculated)</span>
            </label>
            <input
              type="number"
              value={formData.percentage}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 "
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Tax'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
