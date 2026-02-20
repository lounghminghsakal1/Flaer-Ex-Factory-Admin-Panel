"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import BasicInfoCard from "../../create/_components/BasicInfoCard";
import AddressCard from "../../create/_components/AddressCard";
import StatusCard from "../../create/_components/StatusCard";
import { getVendor, updateVendor, normalizeVendorResponse } from "./vendorDetailsApi";
import VendorDetailsSkeleton from "./VendorDetailsInfoTabSkeleton";

function validate(form) {
  const e = {};
  if (!form.firm_name.trim()) e.firm_name = "Vendor name is required";
  if (!form.code.trim()) e.code = "Vendor code is required";
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

const EMPTY_FORM = {
  firm_name: "", code: "", vendor_type: "", status: 1,
  is_active: true, primary_contact_name: "", primary_contact_email: "",
  primary_contact_phone: "", pan: "", gstin: "", tin: "",
  tax_exempted: false, tax_applied_type: "",
  address1: "", address2: "", city: "", state: "", pincode: "", country: "",
};

export default function VendorInfoTab({ vendorId, isEditing, setIsEditing }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendor(vendorId);
      const normalized = normalizeVendorResponse(data);
      setForm(normalized);
      setOriginalForm(normalized);
    } catch (err) {
      toast.error(err.message || "Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // When isEditing turns off externally (e.g. cancel button), restore original
  useEffect(() => {
    if (!isEditing) {
      setForm(originalForm);
      setErrors({});
    }
  }, [isEditing]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Save handler — call this from your Save Changes button
  const handleSave = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before saving.");
      return;
    }
    setSaving(true);
    try {
      await updateVendor(vendorId, form);
      toast.success("Vendor updated successfully!");
      setOriginalForm(form);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Expose handleSave so parent can bind it to a button
  // Pattern: pass ref or render prop — here we use a data attribute trick via window
  // Cleanest pattern: parent calls window.__vendorSave?.()
  useEffect(() => {
    window.__vendorSave = handleSave;
    return () => { delete window.__vendorSave; };
  }, [form, errors]);

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="flex flex-col items-center gap-3">
  //         <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
  //           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  //           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  //         </svg>
  //         <p className="text-[13px] text-gray-400">Loading vendor details…</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (loading) return <VendorDetailsSkeleton />

  

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[0.7fr_0.4fr] gap-3 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <BasicInfoCard form={form} errors={errors} onChange={handleChange} isEditing={isEditing} fromDetails={true} />
          <AddressCard form={form} errors={errors} onChange={handleChange} isEditing={isEditing} />
        </div>

        {/* Right Column */}
        <StatusCard form={form} onChange={handleChange} isEditing={isEditing} fromDetails={true} />
      </div>
    </div>
  );
}