"use client";

import { Settings } from "lucide-react";
import NormalDropdown from "../../../../../../components/shared/NormalDropdown";

const STATUSES = [
  {
    label: "Active",
    value: 1,
    activeRing: "ring ring-green-400 border-green-400 bg-green-50 text-green-700",
    activeCircle: "bg-green-500",
    idle: "border-gray-200 text-gray-500 hover:border-gray-300 bg-white",
    idleDisabled: "border-gray-100 text-gray-400 bg-gray-50 cursor-default",
  },
  {
    label: "Inactive",
    value: 0,
    activeRing: "ring ring-gray-400 border-gray-400 bg-gray-50 text-gray-700",
    activeCircle: "bg-gray-500",
    idle: "border-gray-200 text-gray-500 hover:border-gray-300 bg-white",
    idleDisabled: "border-gray-100 text-gray-400 bg-gray-50 cursor-default",
  },
  {
    label: "Blocked",
    value: 2,
    activeRing: "ring ring-red-400 border-red-400 bg-red-50 text-red-700",
    activeCircle: "bg-red-500",
    idle: "border-gray-200 text-gray-500 hover:border-gray-300 bg-white",
    idleDisabled: "border-gray-100 text-gray-400 bg-gray-50 cursor-default",
  },
];

const VENDOR_TYPES = [
  { label: "Manufacturer", value: 1 },
  { label: "Distributor", value: 2 },
  { label: "Wholesaler", value: 3 },
  { label: "Service", value: 4 },
];

const TAX_APPLIED_TYPES = [
  { label: "Inclusive", value: 1 },
  { label: "Exclusive", value: 2 },
];


function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      aria-pressed={value}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0
        ${value ? (disabled ? "bg-blue-300" : "bg-blue-600") : "bg-gray-300"}
        ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${value ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

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

export default function StatusCard({ form, onChange, isEditing = true, errors, fromDetails = false }) {
  const disabled = !isEditing;

  return (
    <div className="flex flex-col gap-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-1 mb-2 pb-2.5 border-b border-gray-200">
        <Settings size={18} className="text-gray-400" strokeWidth={1.8} />
        <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
      </div>

      {/* Status */}
      <div className="mb-4">
        <p className="text-[13px] font-medium text-gray-700 mb-2">
          Status {isEditing && (<span className="text-red-500">*</span>)}
        </p>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => {
            const active = form.status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onChange("status", s.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[13px] font-medium transition-all cursor-pointer
                  ${active
                    ? s.activeRing
                    : disabled ? s.idleDisabled : s.idle
                  }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${active ? "border-current" : "border-gray-300"}`}>
                  {active && <span className={`w-1.5 h-1.5 rounded-full ${s.activeCircle}`} />}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>


      <Field
        label="Vendor Type"
        required={isEditing}
        error={errors?.vendor_type}
      >
        <NormalDropdown
          value={form.vendor_type ? String(form.vendor_type) : null}
          options={VENDOR_TYPES.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          placeholder="Select vendor type"
          disabled={disabled}
          hasError={!!errors?.vendor_type}
          onChange={(val) =>
            !disabled && onChange("vendor_type", val ? Number(val) : "")
          }
        />
      </Field>

      {/* Tax Exempted */}
      <div className="flex items-start justify-between py-3 border-gray-100">
        <div>
          <p className="text-[13px] font-medium text-gray-700">Tax Exempted</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Exempt from applicable taxes</p>
        </div>
        <Toggle value={form.tax_exempted} onChange={(v) => onChange("tax_exempted", v)} disabled={disabled} />
      </div>

      {!form.tax_exempted && (
        <Field label={`Tax Applied Type ${fromDetails ? "" : "(default is inclusive)" }`}>
          <NormalDropdown
            value={form.tax_applied_type ? String(form.tax_applied_type) : null}
            options={TAX_APPLIED_TYPES.map((o) => ({
              value: String(o.value),
              label: o.label,
            }))}
            placeholder="Select tax type"
            disabled={disabled}
            hasError={false}
            onChange={(val) =>
              !disabled && onChange("tax_applied_type", val ? Number(val) : "")
            }
          />
        </Field>
      )}
    </div>
  );
}