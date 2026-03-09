"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Percent, Tag, Hash } from "lucide-react";
import HeaderWithBackAction from "../../../../../../components/shared/HeaderWithBackAction";
import { useRouter } from "next/navigation";

const EMPTY_FORM = {
  name: "",
  code: "",
  cgst: "",
  sgst: "",
  igst: 0,
  tax_percentage: 0,
};

const EMPTY_ERRORS = {
  name: "",
  code: "",
  cgst: "",
  sgst: "",
};

const inputBase = "w-full px-3 py-2 text-sm border rounded-md outline-none transition-all";
const inputActive = "border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white";
const inputReadonly = "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed";
const inputDisabled = "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed";
const inputError = (errors, field) => errors[field] ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "";

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function TaxForm({ taxData = null, taxId = null }) {
  const [taxForm, setTaxForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const isCreateMode = !taxId;
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!taxData) return;
    setTaxForm({
      name: taxData.name ?? "",
      code: taxData.code ?? "",
      cgst: taxData.cgst ?? "",
      sgst: taxData.sgst ?? "",
      igst: taxData.igst ?? 0,
      tax_percentage: taxData.tax_percentage ?? 0,
    });
  }, [taxData]);

  const updateField = (key, val) => {
    setTaxForm(prev => {
      const updated = { ...prev, [key]: val };
      if (key === "cgst" || key === "sgst") {
        const cgst = parseFloat(key === "cgst" ? val : prev.cgst) || 0;
        const sgst = parseFloat(key === "sgst" ? val : prev.sgst) || 0;
        const computed = cgst + sgst;
        updated.igst = computed;
        updated.tax_percentage = computed;
      }
      return updated;
    });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const newErrors = { ...EMPTY_ERRORS };
    let valid = true;

    if (!taxForm.name.trim()) {
      newErrors.name = "Tax name is required";
      valid = false;
    }
    if (!taxForm.code.trim()) {
      newErrors.code = "Tax code is required";
      valid = false;
    }
    if (taxForm.cgst === "" || taxForm.cgst === null) {
      newErrors.cgst = "CGST is required";
      valid = false;
    } else if (parseFloat(taxForm.cgst) < 0) {
      newErrors.cgst = "CGST must be ≥ 0";
      valid = false;
    }
    if (taxForm.sgst === "" || taxForm.sgst === null) {
      newErrors.sgst = "SGST is required";
      valid = false;
    } else if (parseFloat(taxForm.sgst) < 0) {
      newErrors.sgst = "SGST must be ≥ 0";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleActionClick = async () => {
    // Details page: just unlock fields, don't submit yet
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const method = !taxId ? "POST" : "PUT";
      const url = !taxId
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/tax_types/${taxId}`;

      const payload = !taxId
        ? { name: taxForm.name, code: taxForm.code, cgst: taxForm.cgst, sgst: taxForm.sgst, igst: taxForm.igst, tax_percentage: taxForm.tax_percentage }
        : { tax_name: taxForm.name, tax_code: taxForm.code, cgst: taxForm.cgst, sgst: taxForm.sgst, igst: taxForm.igst, tax_percentage: taxForm.tax_percentage };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result?.status === "failure")
        throw new Error(result?.errors?.[0] ?? "Something went wrong");

      toast.success(!taxId ? "Tax type created successfully" : "Tax type updated successfully");
      if (taxId) setIsEditing(false);
      router.back();
    } catch (err) {
      toast.error(err.message || "Failed to save tax type");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <HeaderWithBackAction
        title={taxId ? "Edit Tax Type" : "Create Tax Type"}
        isEditing={isEditing}
        loading={isSubmitting}
        onActionClick={handleActionClick}
        defaultBackPath="/configs/taxes"
      />

      <div className="p-6 w-[50%]">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

          {/* Section: Basic Info */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Tag size={12} className="text-primary" />
              Basic Info
            </p>
            <div className="space-y-3">
              <Field label="Tax Name" required error={errors.name}>
                <input
                  type="text"
                  value={taxForm.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., GST 18%"
                  className={`${inputBase} ${isEditing ? `${inputActive} ${inputError(errors, "name")}` : inputDisabled}`}
                />
              </Field>
              <Field label="Tax Code" required error={errors.code}>
                <input
                  type="text"
                  value={taxForm.code}
                  onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                  disabled={!isEditing}
                  placeholder="e.g., GST18"
                  className={`${inputBase} uppercase ${isEditing ? `${inputActive} ${inputError(errors, "code")}` : inputDisabled}`}
                />
              </Field>
            </div>
          </div>

          {/* Section: Tax Rates */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Percent size={12} className="text-primary" />
              Tax Rates
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="CGST (%)" required error={errors.cgst}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={taxForm.cgst}
                    onChange={(e) => updateField("cgst", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    disabled={!isEditing}
                    placeholder="e.g., 9"
                    className={`${inputBase} ${isEditing ? `${inputActive} ${inputError(errors, "cgst")}` : inputDisabled}`}
                  />
                </Field>
                <Field label="SGST (%)" required error={errors.sgst}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={taxForm.sgst}
                    onChange={(e) => updateField("sgst", e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    disabled={!isEditing}
                    placeholder="e.g., 9"
                    className={`${inputBase} ${isEditing ? `${inputActive} ${inputError(errors, "sgst")}` : inputDisabled}`}
                  />
                </Field>
              </div>

              {/* Auto-calculated row */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={<span>IGST (%) <span className="text-[10px] text-gray-400 font-normal">Auto-calculated</span></span>}>
                  <input
                    type="number"
                    value={taxForm.igst}
                    readOnly
                    className={`${inputBase} ${inputReadonly}`}
                  />
                </Field>
                <Field label={<span>Total (%) <span className="text-[10px] text-gray-400 font-normal">Auto-calculated</span></span>}>
                  <div className="relative">
                    <input
                      type="number"
                      value={taxForm.tax_percentage}
                      readOnly
                      className={`${inputBase} ${inputReadonly} pr-8`}
                    />
                    <Hash size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </Field>
              </div>

              {/* Summary pill */}
              {(parseFloat(taxForm.cgst) > 0 || parseFloat(taxForm.sgst) > 0) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {[
                    { label: "CGST", val: taxForm.cgst },
                    { label: "SGST", val: taxForm.sgst },
                    { label: "IGST", val: taxForm.igst },
                  ].map(({ label, val }) => (
                    <span key={label} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary font-medium">
                      {label}: {parseFloat(val) || 0}%
                    </span>
                  ))}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary text-white font-semibold">
                    Total: {taxForm.tax_percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}