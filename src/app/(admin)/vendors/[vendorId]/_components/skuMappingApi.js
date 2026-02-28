// ─── GET VENDOR SKU MAPPINGS ────────────────────────────────────────────────
// GET /admin/api/v1/procurement/vendors/:vendorId/sku_mappings
// Response: { status, data: [...], meta: { current_page, total_pages, total_data_count } }

export async function getSkuMappings(vendorId, page = 1) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}/sku_mappings?page=${page}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to fetch SKU mappings: ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.errors[0] || "Failed to load SKU mappings");
  return { data: json.data ?? [], meta: json.meta ?? {} };
}

// ─── UPDATE VENDOR SKU MAPPING ───────────────────────────────────────────────
// PUT /admin/api/v1/procurement/vendors/:vendorId/sku_mappings/:productSkuId
// Payload: { product_sku_id, vendor_sku_code, vendor_unit_price, active }

export async function updateSkuMapping(vendorId, productSkuId, payload) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}/sku_mappings/${productSkuId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!res.ok || json.status === "failure") {
    const err = json?.errors[0];
    throw new Error(err || `Update failed: ${res.status}`);
  }
  return json;
}

// ─── CREATE VENDOR SKU MAPPINGS (BULK) ──────────────────────────────────────
// POST /admin/api/v1/procurement/vendors/:vendorId/sku_mappings
// Payload: { vendor_sku_mappings: [...] }
// Example:
// {
//   "vendor_sku_mappings": [
//     { "product_sku_id": 1, "vendor_sku_code": "SLS-PLY-6MM-8X4",
//       "vendor_unit_price": 1450.00, "tax_inclusive": true, "active": true }
//   ]
// }

export async function createSkuMappings(vendorId, mappings) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}/sku_mappings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_sku_mappings: mappings }),
    }
  );
  const json =  await res.json();
  if (!res.ok || json.status === 'failure') {
    const err = json?.errors[0];
    throw new Error(err || `Create failed: ${res.status}`);
  }
  return json;
}

// ─── GET ALL PRODUCT SKUS (for dropdown) ────────────────────────────────────
// GET /admin/api/v1/product_skus
// Response: { status, data: [{ id, sku_name, sku_code, ... }] }

export async function getAllProductSkus(vendorId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}/list_unmapped`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to fetch product SKUs: ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.errors[0] || "Failed to load SKUs");
  return json.data ?? [];
}