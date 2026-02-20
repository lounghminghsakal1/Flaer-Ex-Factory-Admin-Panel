"use client";

import { Building2 } from "lucide-react";

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = (hasError, disabled) =>
  `h-9 px-3 py-2 text-[13px] rounded-md border-1 outline-none w-[95%] transition-all
  placeholder:text-gray-300 text-gray-800
  ${disabled
    ? "bg-gray-50 text-gray-600 border-gray-100 cursor-default select-none"
    : hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white"
      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 bg-white"
  }`;

export default function BasicInfoCard({ form, errors = {}, onChange, isEditing = true, fromDetails = false }) {
  const disabled = !isEditing;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-200">
        <Building2 size={18} className="text-gray-400" strokeWidth={1.8} />
        <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <Field label="Vendor Name" required={isEditing} error={errors.firm_name}>
          <input className={inputCls(errors.firm_name, disabled)} placeholder="Enter vendor name"
            value={form.firm_name} readOnly={disabled}
            onChange={(e) => !disabled && onChange("firm_name", e.target.value)} />
        </Field>

        {fromDetails && (
          <Field label="Vendor Code">
            <input className="h-9 px-3 py-2 text-[13px] rounded-md border outline-none w-[95%] transition-all bg-gray-100 cursor-not-allowed"
              value={form.code} readOnly/>
          </Field>
        )}

        <Field label="Contact Name" required={isEditing} error={errors.primary_contact_name}>
          <input className={inputCls(errors.primary_contact_name, disabled)} placeholder="Enter contact name"
            value={form.primary_contact_name} readOnly={disabled}
            onChange={(e) => !disabled && onChange("primary_contact_name", e.target.value)} />
        </Field>

        <Field label="Mobile Number" required={isEditing} error={errors.primary_contact_phone}>
          <input className={inputCls(errors.primary_contact_phone, disabled)} placeholder="10-digit number"
            maxLength={10} value={form.primary_contact_phone} readOnly={disabled}
            onChange={(e) => !disabled && onChange("primary_contact_phone", e.target.value.replace(/\D/g, ""))} />
        </Field>

        <Field label="Email" required={isEditing} error={errors.primary_contact_email}>
          <input className={inputCls(errors.primary_contact_email, disabled)} type="email" placeholder="Enter email"
            value={form.primary_contact_email} readOnly={disabled}
            onChange={(e) => !disabled && onChange("primary_contact_email", e.target.value.replace(/\s/g,""))} />
        </Field>

        <Field label="PAN">
          <input className={inputCls(false, disabled)} placeholder="Enter PAN" maxLength={10}
            value={form.pan} readOnly={disabled}
            onChange={(e) => !disabled && onChange("pan", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
        </Field>

        <Field label="GSTIN">
          <input className={inputCls(false, disabled)} placeholder="Enter GSTIN" maxLength={15}
            value={form.gstin} readOnly={disabled}
            onChange={(e) => !disabled && onChange("gstin", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
        </Field>

      </div>
    </div>
  );
}