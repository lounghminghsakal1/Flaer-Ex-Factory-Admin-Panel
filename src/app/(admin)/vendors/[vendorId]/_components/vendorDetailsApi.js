// ─── ENUM MAPS ──────────────────────────────────────────────────────────────

export const VENDOR_TYPE_LABEL_TO_VALUE = {
  manufacturer: 1,
  distributor: 2,
  wholesaler: 3,
  service: 4,
};

export const VENDOR_TYPE_VALUE_TO_LABEL = {
  1: "Manufacturer",
  2: "Distributor",
  3: "Wholesaler",
  4: "Service",
};

export const STATUS_LABEL_TO_VALUE = {
  active: 1,
  inactive: 0,
  blocked: 2,
};

export const STATUS_VALUE_TO_LABEL = {
  1: "Active",
  0: "Inactive",
  2: "Blocked",
};

export const TAX_TYPE_LABEL_TO_VALUE = {
  inclusive: 1,
  exclusive: 2,
};

export const TAX_TYPE_VALUE_TO_LABEL = {
  1: "Inclusive",
  2: "Exclusive",
};

// ─── NORMALIZE API RESPONSE → FORM STATE ────────────────────────────────────

export function normalizeVendorResponse(data) {
  return {
    firm_name: data.firm_name || "",
    code: data.code || "",
    vendor_type: VENDOR_TYPE_LABEL_TO_VALUE[data.vendor_type] ?? data.vendor_type ?? "",
    status: STATUS_LABEL_TO_VALUE[data.status] ?? data.status ?? 1,
    is_active: data.status === "active" || data.status === 1,
    primary_contact_name: data.primary_contact_name || "",
    primary_contact_email: data.primary_contact_email || "",
    primary_contact_phone: data.primary_contact_phone || "",
    pan: data.pan || "",
    gstin: data.gstin || "",
    tin: data.tin || "",
    tax_exempted: data.tax_exempted ?? false,
    tax_applied_type: TAX_TYPE_LABEL_TO_VALUE[data.tax_applied_type] ?? data.tax_applied_type ?? "",
    address1: data.address1 || "",
    address2: data.address2 || "",
    city: data.city || "",
    state: data.state || "",
    pincode: data.pincode || data.pin_code || "",
    country: data.country || "",
  };
}

// ─── GET VENDOR ──────────────────────────────────────────────────────────────

export async function getVendor(vendorId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}`
  );
  if (!res.ok) throw new Error(`Failed to fetch vendor: ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.errors[0] || "Failed to load vendor");
  return json.data;
}

// ─── UPDATE VENDOR ────────────────────────────────────────────────────────────

/**
 * PUT /admin/api/v1/procurement/vendors/:id
 * Payload example:
 * {
 *   "vendor": {
 *     "firm_name": "Sri Lakshmi Steels",
 *     "vendor_type": 1,
 *     "status": 1,
 *     "primary_contact_name": "Ramesh Kumar",
 *     "primary_contact_email": "ramesh@example.com",
 *     "primary_contact_phone": "9876543210",
 *     "pan": "ABCDE1234F",
 *     "gstin": "29ABCDE1234F1Z5",
 *     "tax_exempted": false,
 *     "tax_applied_type": 1,
 *     "address1": "Plot 42, Industrial Area",
 *     "address2": "Phase 2",
 *     "city": "Bengaluru",
 *     "state": "Karnataka",
 *     "pin_code": "560058",
 *     "country": "India"
 *   }
 * }
 */
export async function updateVendor(vendorId, formData) {
  const payload = {
    vendor: {
      firm_name: formData.firm_name,
      vendor_type: formData.vendor_type,
      status: formData.status,
      primary_contact_name: formData.primary_contact_name,
      primary_contact_email: formData.primary_contact_email,
      primary_contact_phone: formData.primary_contact_phone,
      ...(formData.pan && { pan: formData.pan }),
      ...(formData.gstin && { gstin: formData.gstin }),
      ...(formData.tin && { tin: formData.tin }),
      tax_exempted: formData.tax_exempted,
      ...(formData.tax_applied_type && { tax_applied_type: formData.tax_applied_type }),
      ...(formData.address1 && { address1: formData.address1 }),
      ...(formData.address2 && { address2: formData.address2 }),
      ...(formData.city && { city: formData.city }),
      ...(formData.state && { state: formData.state }),
      ...(formData.pincode && { pin_code: formData.pincode }),
      ...(formData.country && { country: formData.country }),
    },
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Update failed with status ${res.status}`);
  }

  return res.json();
}