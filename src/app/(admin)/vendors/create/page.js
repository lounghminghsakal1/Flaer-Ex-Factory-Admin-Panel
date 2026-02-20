"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import BasicInfoCard from "./_components/BasicInfoCard";
import AddressCard from "./_components/AddressCard";
import StatusCard from "./_components/StatusCard";
import HeaderWithBackAction from "../../../../../components/shared/HeaderWithBackAction";
import { useRouter } from "next/navigation";

const initialState = {
  firm_name: "",
  vendor_type: "",
  status: 1,
  primary_contact_name: "",
  primary_contact_email: "",
  primary_contact_phone: "",
  pan: "",
  gstin: "",
  tax_exempted: false,
  tax_applied_type: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
};

function validate(form) {
  const e = {};
  if (!form.firm_name.trim()) e.firm_name = "Vendor name is required";
  if (!form.vendor_type) e.vendor_type = "Vendor type is required";
  if (!form.primary_contact_name.trim()) e.primary_contact_name = "Contact name is required";
  if (!form.primary_contact_email.trim()) e.primary_contact_email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primary_contact_email))
    e.primary_contact_email = "Enter a valid email";
  if (!form.primary_contact_phone.trim()) e.primary_contact_phone = "Phone is required";
  else if (!/^\d{10}$/.test(form.primary_contact_phone))
    e.primary_contact_phone = "Enter a valid 10-digit number";
  if (form.pincode && form.pincode.length !== 6) e.pincode = "Pincode must be 6 digits";
  return e;
}

export default function VendorForm() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  async function submitVendor(formData) {
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
        tax_exempted: formData.tax_exempted,
        ...(formData.tax_applied_type && { tax_applied_type: formData.tax_applied_type }),
        ...(formData.address1 && { address1: formData.address1 }),
        ...(formData.address2 && { address2: formData.address2 }),
        ...(formData.city && { city: formData.city }),
        ...(formData.state && { state: formData.state }),
        ...(formData.pincode && { pincode: formData.pincode }),
        ...(formData.country && { country: formData.country }),
      },
    };

    const VENDOR_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors`;

    const res = await fetch(VENDOR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  // Exposed submit handler — call this from parent or a Save button wherever needed
  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    if (form.pan.length !== 10) {
      toast.error("Invalid PAN number");
      return;
    }

    if (form.gstin.length !== 15) {
      toast.error("Invalid GSTIN");
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitVendor(form);
      toast.success("Vendor created successfully!");
      const vendorId = response.data.id;
      console.log(response);
      setForm(initialState);
      if (vendorId) router.push(`/vendors/${vendorId}`);
      else console.log("Vendor id not found in backend response");
      setErrors({});
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-2 py-4">
      <HeaderWithBackAction title="Create Vendor" onActionClick={handleSubmit} isEditing={true} loading={submitting} defaultBackPath="/vendors" />
      <div className="grid grid-cols-[0.9fr_400px] gap-5 items-start w-full mt-2">
        {/* Left */}
        <div className="flex flex-col gap-3">
          <BasicInfoCard form={form} errors={errors} onChange={handleChange} />
          <AddressCard form={form} errors={errors} onChange={handleChange} />
        </div>

        {/* Right */}
        <StatusCard form={form} errors={errors} onChange={handleChange} />
      </div>

    </div>
  );
}